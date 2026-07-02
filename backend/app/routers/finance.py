from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Category, FinancialAccount, Transaction, User
from app.routers.auth import get_current_user
from app.schemas.finance import (
    AccountCreate,
    AccountOut,
    CategoryOut,
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
    account = FinancialAccount(user_id=user.id, **data.model_dump())
    db.add(account)
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
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx
