import uuid
from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy import CheckConstraint, Date, ForeignKey, Numeric, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CreditProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Credit card-specific data; powers the utilization calculator.

    One credit card account has at most one credit profile.
    """

    __tablename__ = "credit_profiles"
    __table_args__ = (
        CheckConstraint("credit_limit > 0", name="ck_credit_profiles_limit_positive"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("financial_accounts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    credit_limit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    current_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    statement_balance: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    apr: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    minimum_payment: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    payment_due_date: Mapped[Optional[date]] = mapped_column(Date)
    statement_close_date: Mapped[Optional[date]] = mapped_column(Date)

    user = relationship("User", back_populates="credit_profiles")
    account = relationship("FinancialAccount", back_populates="credit_profile")
    simulations = relationship(
        "CreditSimulation", back_populates="credit_profile",
        cascade="all, delete-orphan",
    )
