import uuid
from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class SavingsPlan(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Recurring automatic transfer from a funding account into savings."""

    __tablename__ = "savings_plans"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("financial_accounts.id", ondelete="SET NULL")
    )
    to_account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("financial_accounts.id", ondelete="SET NULL")
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    # weekly | monthly
    frequency: Mapped[str] = mapped_column(String(20), nullable=False)
    next_run_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
