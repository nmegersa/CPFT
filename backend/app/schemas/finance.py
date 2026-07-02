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
