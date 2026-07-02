from typing import Optional

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    first_name: Mapped[Optional[str]] = mapped_column(String(100))
    last_name: Mapped[Optional[str]] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    # student | worker_employee | intern | self_employed | unemployed | other
    occupation: Mapped[Optional[str]] = mapped_column(String(50))
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)

    financial_accounts = relationship(
        "FinancialAccount", back_populates="user", cascade="all, delete-orphan"
    )
    categories = relationship(
        "Category", back_populates="user", cascade="all, delete-orphan"
    )
    transactions = relationship(
        "Transaction", back_populates="user", cascade="all, delete-orphan"
    )
    budgets = relationship(
        "Budget", back_populates="user", cascade="all, delete-orphan"
    )
    subscriptions = relationship(
        "Subscription", back_populates="user", cascade="all, delete-orphan"
    )
    credit_profiles = relationship(
        "CreditProfile", back_populates="user", cascade="all, delete-orphan"
    )
    credit_simulations = relationship(
        "CreditSimulation", back_populates="user", cascade="all, delete-orphan"
    )
    insights = relationship(
        "Insight", back_populates="user", cascade="all, delete-orphan"
    )
    alerts = relationship(
        "Alert", back_populates="user", cascade="all, delete-orphan"
    )
    password_reset_tokens = relationship(
        "PasswordResetToken", back_populates="user", cascade="all, delete-orphan"
    )
