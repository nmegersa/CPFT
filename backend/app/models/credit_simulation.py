import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin


class CreditSimulation(Base, UUIDPrimaryKeyMixin):
    """What-if credit card scenarios (snapshots are self-contained)."""

    __tablename__ = "credit_simulations"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    credit_profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("credit_profiles.id", ondelete="CASCADE"), nullable=False
    )
    # add_purchase | make_payment | increase_credit_limit | decrease_credit_limit
    # | miss_payment | pay_statement_balance | pay_minimum_only
    simulation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    input_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    starting_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    starting_credit_limit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    resulting_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    resulting_credit_limit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    starting_utilization: Mapped[Decimal] = mapped_column(Numeric(6, 4), nullable=False)
    resulting_utilization: Mapped[Decimal] = mapped_column(Numeric(6, 4), nullable=False)
    result_message: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user = relationship("User", back_populates="credit_simulations")
    credit_profile = relationship("CreditProfile", back_populates="simulations")
