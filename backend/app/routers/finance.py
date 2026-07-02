from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Budget, Category, CreditProfile, FinancialAccount, Transaction, User
from app.routers.auth import get_current_user
from app.schemas.finance import (
    AccountCreate,
    AccountOut,
    BudgetOut,
    BudgetSet,
    CategoryOut,
    CreditProfileCreate,
    CreditProfileOut,
    TransactionCreate,
    TransactionOut,
)

router = APIRouter(tags=["finance"])

DEFAULT_CATEGORIES = [
    ("Income", "income", "#10b981"),
    ("Food", "expense", "#f59e0b"),
    ("Rent", "expense", "#8b5cf6"),
    ("Gas", "expense", "#ef4444"),
    ("Transportation", "expense", "#f97316"),
    ("School", "expense", "#3b82f6"),
    ("Entertainment", "expense", "#ec4899"),
    ("Shopping", "expense", "#14b8a6"),
    ("Subscriptions", "expense", "#6366f1"),
    ("Savings", "savings", "#22d3ee"),
    ("Credit Card Payment", "debt_payment", "#a3e635"),
    ("Health", "expense", "#f43f5e"),
    ("Travel", "expense", "#eab308"),
    ("Other", "expense", "#94a3b8"),
]


def balance_delta(account_type: str, tx_type: str, amount: Decimal) -> Decimal:
    """How a transaction moves an account balance.

    Credit cards track debt: spending raises the balance, payments lower it.
    Bank/cash accounts: income raises, spending lowers.
    """
    if account_type == "credit_card":
        return amount if tx_type in ("expense", "fee") else -amount
    return amount if tx_type in ("income", "refund") else -amount


def sync_credit_profile(db: Session, account: FinancialAccount) -> None:
    if account.account_type != "credit_card":
        return
    profile = db.execute(
        select(CreditProfile).where(CreditProfile.account_id == account.id)
    ).scalar_one_or_none()
    if profile:
        profile.current_balance = account.current_balance or Decimal("0")


@router.get("/accounts", response_model=list[AccountOut])
def list_accounts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.execute(
        select(FinancialAccount)
        .where(FinancialAccount.user_id == user.id, FinancialAccount.is_active)
        .order_by(FinancialAccount.created_at)
    ).scalars().all()


@router.post("/accounts", response_model=AccountOut, status_code=201)
def create_account(
    data: AccountCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = FinancialAccount(user_id=user.id, **data.model_dump(exclude={"credit_limit"}))
    db.add(account)
    db.flush()
    if account.account_type == "credit_card" and data.credit_limit:
        db.add(
            CreditProfile(
                user_id=user.id,
                account_id=account.id,
                credit_limit=data.credit_limit,
                current_balance=account.current_balance or Decimal("0"),
            )
        )
    db.commit()
    db.refresh(account)
    return account


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cats = db.execute(
        select(Category).where(Category.user_id == user.id).order_by(Category.name)
    ).scalars().all()
    if not cats:  # lazy-seed defaults for new (or pre-existing) users
        for name, ctype, color in DEFAULT_CATEGORIES:
            db.add(Category(user_id=user.id, name=name, category_type=ctype,
                            color=color, is_default=True))
        db.commit()
        cats = db.execute(
            select(Category).where(Category.user_id == user.id).order_by(Category.name)
        ).scalars().all()
    return cats


@router.get("/transactions", response_model=list[TransactionOut])
def list_transactions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.execute(
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
    ).scalars().all()


@router.post("/transactions", response_model=TransactionOut, status_code=201)
def create_transaction(
    data: TransactionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.get(FinancialAccount, data.account_id)
    if account is None or account.user_id != user.id:
        raise HTTPException(status_code=404, detail="Account not found.")
    if data.category_id:
        cat = db.get(Category, data.category_id)
        if cat is None or cat.user_id != user.id:
            raise HTTPException(status_code=404, detail="Category not found.")

    tx = Transaction(user_id=user.id, **data.model_dump())
    account.current_balance = (account.current_balance or Decimal("0")) + balance_delta(
        account.account_type, data.transaction_type, data.amount
    )
    sync_credit_profile(db, account)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.get("/budgets", response_model=list[BudgetOut])
def list_budgets(
    month: int,
    year: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.execute(
        select(Budget).where(
            Budget.user_id == user.id, Budget.month == month, Budget.year == year
        )
    ).scalars().all()


@router.put("/budgets", response_model=BudgetOut)
def set_budget(
    data: BudgetSet,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update the budget for a category in a given month/year."""
    cat = db.get(Category, data.category_id)
    if cat is None or cat.user_id != user.id:
        raise HTTPException(status_code=404, detail="Category not found.")
    budget = db.execute(
        select(Budget).where(
            Budget.user_id == user.id,
            Budget.category_id == data.category_id,
            Budget.month == data.month,
            Budget.year == data.year,
        )
    ).scalar_one_or_none()
    if budget:
        budget.limit_amount = data.limit_amount
    else:
        budget = Budget(user_id=user.id, **data.model_dump())
        db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@router.get("/credit/profiles", response_model=list[CreditProfileOut])
def list_credit_profiles(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.execute(
        select(CreditProfile, FinancialAccount)
        .join(FinancialAccount, CreditProfile.account_id == FinancialAccount.id)
        .where(CreditProfile.user_id == user.id)
        .order_by(FinancialAccount.created_at)
    ).all()
    out = []
    for profile, account in rows:
        bal = account.current_balance or Decimal("0")
        if profile.current_balance != bal:
            profile.current_balance = bal
        limit = profile.credit_limit
        out.append(
            CreditProfileOut(
                id=profile.id,
                account_id=profile.account_id,
                account_name=account.account_name,
                credit_limit=limit,
                current_balance=bal,
                utilization=bal / limit if limit > 0 else Decimal("0"),
            )
        )
    db.commit()
    return out


@router.post("/credit/profile", response_model=CreditProfileOut, status_code=201)
def create_credit_profile(
    data: CreditProfileCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.get(FinancialAccount, data.account_id)
    if account is None or account.user_id != user.id or account.account_type != "credit_card":
        raise HTTPException(status_code=404, detail="Credit card account not found.")
    existing = db.execute(
        select(CreditProfile).where(CreditProfile.account_id == account.id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="This card already has a credit profile.")
    profile = CreditProfile(
        user_id=user.id,
        account_id=account.id,
        credit_limit=data.credit_limit,
        current_balance=account.current_balance or Decimal("0"),
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    bal = profile.current_balance
    return CreditProfileOut(
        id=profile.id,
        account_id=profile.account_id,
        account_name=account.account_name,
        credit_limit=profile.credit_limit,
        current_balance=bal,
        utilization=bal / profile.credit_limit,
    )
