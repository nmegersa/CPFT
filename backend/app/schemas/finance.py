import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class AccountCreate(BaseModel):
    account_name: str = Field(min_length=1, max_length=100)
    account_type: str = Field(min_length=1, max_length=50)
    institution_name: Optional[str] = None
    current_balance: Decimal = Decimal("0")
    credit_limit: Optional[Decimal] = Field(default=None, gt=0)


class CreditProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    account_id: uuid.UUID
    account_name: str
    credit_limit: Decimal
    current_balance: Decimal
    utilization: Decimal


class CreditProfileCreate(BaseModel):
    account_id: uuid.UUID
    credit_limit: Decimal = Field(gt=0)


class AccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    account_name: str
    account_type: str
    institution_name: Optional[str]
    current_balance: Decimal
    created_at: datetime


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    category_type: str
    color: Optional[str]


class TransactionCreate(BaseModel):
    account_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    transaction_type: str = "expense"
    merchant: str = Field(min_length=1, max_length=150)
    description: Optional[str] = None
    amount: Decimal = Field(gt=0)
    transaction_date: date


class BudgetSet(BaseModel):
    category_id: uuid.UUID
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2000, le=2100)
    limit_amount: Decimal = Field(gt=0)


class BudgetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    category_id: uuid.UUID
    month: int
    year: int
    limit_amount: Decimal


class AccountUpdate(BaseModel):
    account_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    current_balance: Optional[Decimal] = None
    is_active: Optional[bool] = None


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category_type: str = "expense"
    color: Optional[str] = None


class CreditPaymentCreate(BaseModel):
    card_account_id: uuid.UUID
    from_account_id: uuid.UUID
    amount: Decimal = Field(gt=0)
    payment_date: date


class SubscriptionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    amount: Decimal = Field(gt=0)
    billing_cycle: str = Field(pattern="^(weekly|monthly)$")
    next_payment_date: date
    account_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None


class SubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    amount: Decimal
    billing_cycle: str
    next_payment_date: Optional[date]
    is_active: bool
    account_id: Optional[uuid.UUID]
    category_id: Optional[uuid.UUID]


class ToggleActive(BaseModel):
    is_active: bool


class SavingsPlanCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    amount: Decimal = Field(gt=0)
    frequency: str = Field(pattern="^(weekly|monthly)$")
    next_run_date: date
    from_account_id: uuid.UUID
    to_account_id: uuid.UUID


class SavingsPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    amount: Decimal
    frequency: str
    next_run_date: date
    is_active: bool
    from_account_id: Optional[uuid.UUID]
    to_account_id: Optional[uuid.UUID]


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    account_id: uuid.UUID
    category_id: Optional[uuid.UUID]
    transaction_type: str
    merchant: Optional[str]
    description: Optional[str]
    amount: Decimal
    transaction_date: date
