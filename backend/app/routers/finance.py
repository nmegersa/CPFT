import calendar
from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Budget,
    Category,
    CreditProfile,
    FinancialAccount,
    SavingsPlan,
    Subscription,
    Transaction,
    User,
)
from app.routers.auth import get_current_user
from app.schemas.finance import (
    AccountCreate,
    AccountOut,
    BudgetOut,
    BudgetSet,
    CategoryOut,
    CreditProfileCreate,
    CreditProfileOut,
    SavingsPlanCreate,
    SavingsPlanOut,
    SubscriptionCreate,
    SubscriptionOut,
    ToggleActive,
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


def advance_date(d: date, cycle: str) -> date:
    """Next occurrence: +7 days for weekly, same day next month (clamped) for monthly."""
    if cycle == "weekly":
        return d + timedelta(days=7)
    y, m = (d.year + 1, 1) if d.month == 12 else (d.year, d.month + 1)
    return date(y, m, min(d.day, calendar.monthrange(y, m)[1]))


def process_subscriptions(db: Session, user: User) -> bool:
    """Record transactions for any active subscriptions whose payment date has passed."""
    today = date.today()
    subs = db.execute(
        select(Subscription).where(
            Subscription.user_id == user.id,
            Subscription.is_active,
            Subscription.next_payment_date <= today,
        )
    ).scalars().all()
    changed = False
    for sub in subs:
        account = db.get(FinancialAccount, sub.account_id) if sub.account_id else None
        while sub.next_payment_date and sub.next_payment_date <= today:
            if account:
                db.add(Transaction(
                    user_id=user.id,
                    account_id=account.id,
                    category_id=sub.category_id,
                    transaction_type="expense",
                    merchant=sub.name,
                    description="Subscription payment",
                    amount=sub.amount,
                    transaction_date=sub.next_payment_date,
                    is_recurring=True,
                    source="system_generated",
                ))
                account.current_balance = (account.current_balance or Decimal("0")) + \
                    balance_delta(account.account_type, "expense", sub.amount)
                changed = True
            sub.next_payment_date = advance_date(sub.next_payment_date, sub.billing_cycle)
        if account:
            sync_credit_profile(db, account)
    if changed:
        db.commit()
    return changed


def process_savings_plans(db: Session, user: User) -> bool:
    """Run due savings transfers: move money and record a transfer transaction."""
    today = date.today()
    plans = db.execute(
        select(SavingsPlan).where(
            SavingsPlan.user_id == user.id,
            SavingsPlan.is_active,
            SavingsPlan.next_run_date <= today,
        )
    ).scalars().all()
    savings_cat = db.execute(
        select(Category).where(Category.user_id == user.id, Category.name == "Savings")
    ).scalar_one_or_none()
    changed = False
    for plan in plans:
        src = db.get(FinancialAccount, plan.from_account_id) if plan.from_account_id else None
        dst = db.get(FinancialAccount, plan.to_account_id) if plan.to_account_id else None
        while plan.next_run_date <= today:
            if src and dst:
                db.add(Transaction(
                    user_id=user.id,
                    account_id=src.id,
                    category_id=savings_cat.id if savings_cat else None,
                    transaction_type="transfer",
                    merchant=plan.name,
                    description=f"Savings transfer to {dst.account_name}",
                    amount=plan.amount,
                    transaction_date=plan.next_run_date,
                    is_recurring=True,
                    source="system_generated",
                ))
                src.current_balance = (src.current_balance or Decimal("0")) - plan.amount
                dst.current_balance = (dst.current_balance or Decimal("0")) + plan.amount
                changed = True
            plan.next_run_date = advance_date(plan.next_run_date, plan.frequency)
    if changed:
        db.commit()
    return changed


def fast_forward(d: date, cycle: str) -> date:
    """Skip missed occurrences (used when reactivating) so past dates aren't billed."""
    today = date.today()
    while d <= today:
        d = advance_date(d, cycle)
    return d


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


@router.get("/subscriptions", response_model=list[SubscriptionOut])
def list_subscriptions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    process_subscriptions(db, user)
    return db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
        .order_by(Subscription.created_at)
    ).scalars().all()


@router.post("/subscriptions", response_model=SubscriptionOut, status_code=201)
def create_subscription(
    data: SubscriptionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.get(FinancialAccount, data.account_id)
    if account is None or account.user_id != user.id:
        raise HTTPException(status_code=404, detail="Payment account not found.")
    if data.category_id:
        cat = db.get(Category, data.category_id)
        if cat is None or cat.user_id != user.id:
            raise HTTPException(status_code=404, detail="Category not found.")
    sub = Subscription(user_id=user.id, **data.model_dump())
    db.add(sub)
    db.commit()
    process_subscriptions(db, user)  # bill immediately if start date is today/past
    db.refresh(sub)
    return sub


@router.patch("/subscriptions/{sub_id}", response_model=SubscriptionOut)
def toggle_subscription(
    sub_id: str,
    data: ToggleActive,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db.get(Subscription, sub_id)
    if sub is None or sub.user_id != user.id:
        raise HTTPException(status_code=404, detail="Subscription not found.")
    if data.is_active and not sub.is_active and sub.next_payment_date:
        # Skip payments missed while paused instead of billing them all at once.
        sub.next_payment_date = fast_forward(sub.next_payment_date, sub.billing_cycle)
    sub.is_active = data.is_active
    db.commit()
    db.refresh(sub)
    return sub


@router.get("/savings/plans", response_model=list[SavingsPlanOut])
def list_savings_plans(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    process_savings_plans(db, user)
    return db.execute(
        select(SavingsPlan).where(SavingsPlan.user_id == user.id)
        .order_by(SavingsPlan.created_at)
    ).scalars().all()


@router.post("/savings/plans", response_model=SavingsPlanOut, status_code=201)
def create_savings_plan(
    data: SavingsPlanCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for acc_id, label in ((data.from_account_id, "Source"), (data.to_account_id, "Destination")):
        acc = db.get(FinancialAccount, acc_id)
        if acc is None or acc.user_id != user.id:
            raise HTTPException(status_code=404, detail=f"{label} account not found.")
    if data.from_account_id == data.to_account_id:
        raise HTTPException(status_code=400, detail="Source and destination must differ.")
    plan = SavingsPlan(user_id=user.id, **data.model_dump())
    db.add(plan)
    db.commit()
    process_savings_plans(db, user)
    db.refresh(plan)
    return plan


@router.patch("/savings/plans/{plan_id}", response_model=SavingsPlanOut)
def toggle_savings_plan(
    plan_id: str,
    data: ToggleActive,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.get(SavingsPlan, plan_id)
    if plan is None or plan.user_id != user.id:
        raise HTTPException(status_code=404, detail="Savings plan not found.")
    if data.is_active and not plan.is_active:
        plan.next_run_date = fast_forward(plan.next_run_date, plan.frequency)
    plan.is_active = data.is_active
    db.commit()
    db.refresh(plan)
    return plan


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
