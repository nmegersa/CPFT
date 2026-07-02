"""Tests for the balance and recurrence math at the heart of CPFT."""
from datetime import date, timedelta
from decimal import Decimal

from app.routers.finance import advance_date, balance_delta, fast_forward

D = Decimal


def test_bank_expense_lowers_balance():
    assert balance_delta("checking", "expense", D("50")) == D("-50")


def test_bank_income_raises_balance():
    assert balance_delta("checking", "income", D("100")) == D("100")
    assert balance_delta("savings", "refund", D("25")) == D("25")


def test_bank_transfer_is_outflow():
    assert balance_delta("checking", "transfer", D("75")) == D("-75")


def test_credit_card_expense_raises_debt():
    assert balance_delta("credit_card", "expense", D("40")) == D("40")
    assert balance_delta("credit_card", "fee", D("5")) == D("5")


def test_credit_card_payment_lowers_debt():
    assert balance_delta("credit_card", "credit_card_payment", D("60")) == D("-60")


def test_advance_weekly():
    assert advance_date(date(2026, 7, 1), "weekly") == date(2026, 7, 8)


def test_advance_monthly_simple():
    assert advance_date(date(2026, 7, 15), "monthly") == date(2026, 8, 15)


def test_advance_monthly_clamps_to_month_end():
    # Jan 31 -> Feb 28 (no Feb 31)
    assert advance_date(date(2026, 1, 31), "monthly") == date(2026, 2, 28)


def test_advance_monthly_year_rollover():
    assert advance_date(date(2026, 12, 20), "monthly") == date(2027, 1, 20)


def test_fast_forward_skips_missed_periods():
    start = date.today() - timedelta(days=30)
    result = fast_forward(start, "weekly")
    assert result > date.today()
    assert (result - date.today()).days <= 7


def test_fast_forward_future_date_unchanged():
    future = date.today() + timedelta(days=3)
    assert fast_forward(future, "weekly") == future
