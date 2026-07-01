import uuid
from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    ForeignKey,
    Numeric,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Transaction(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Income, expenses, transfers, and payments.

    Amounts are always positive; transaction_type determines direction.
    """

    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_transactions_amount_positive"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("financial_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("categories.id", ondelete="SET NULL"), index=True
    )
    # income | expense | transfer | credit_card_payment | refund | fee
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)
    merchant: Mapped[Optional[str]] = mapped_column(String(150))
    description: Mapped[Optional[str]] = mapped_column(Text)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    # manual | csv_upload | plaid | system_generated
    source: Mapped[str] = mapped_column(String(50), default="manual", server_default="manual")

    user = relationship("User", back_populates="transactions")
    account = relationship("FinancialAccount", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
