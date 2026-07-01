import uuid
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class FinancialAccount(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Checking, savings, credit card, cash, or other accounts."""

    __tablename__ = "financial_accounts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    account_name: Mapped[str] = mapped_column(String(100), nullable=False)
    # checking | savings | credit_card | cash | investment | student_loan | other
    account_type: Mapped[str] = mapped_column(String(50), nullable=False)
    institution_name: Mapped[Optional[str]] = mapped_column(String(100))
    current_balance: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0"), server_default="0"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    user = relationship("User", back_populates="financial_accounts")
    transactions = relationship(
        "Transaction", back_populates="account", cascade="all, delete-orphan"
    )
    credit_profile = relationship(
        "CreditProfile", back_populates="account", uselist=False,
        cascade="all, delete-orphan",
    )
