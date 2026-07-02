"""Seed a demo account with realistic data for the walkthrough video."""
import datetime as dt
import random

import requests

API = "http://localhost:8000"
EMAIL = "demo@cpft.app"
PW = "campus budget season 2026"

s = requests.Session()


def auth():
    r = s.post(f"{API}/auth/login", json={"email": EMAIL, "password": PW})
    if r.status_code != 200:
        r = s.post(f"{API}/auth/signup", json={
            "first_name": "Jordan", "last_name": "Rivera", "email": EMAIL,
            "occupation": "student", "password": PW, "confirm_password": PW,
        })
        r.raise_for_status()
    return r.json()["access_token"]


token = auth()
s.headers["Authorization"] = f"Bearer {token}"

# Fresh start only if empty, so re-runs stay idempotent-ish.
existing = s.get(f"{API}/accounts").json()
if not existing:
    accounts = {}
    for name, atype, bal, lim in [
        ("Chase Checking", "checking", 2450.75, None),
        ("Ally Savings", "savings", 5200.00, None),
        ("Chase Sapphire", "credit_card", 680.00, 3000),
        ("Roth IRA", "investment", 4100.00, None),
    ]:
        body = {"account_name": name, "account_type": atype, "current_balance": bal}
        if lim:
            body["credit_limit"] = lim
        accounts[name] = s.post(f"{API}/accounts", json=body).json()["id"]

    cats = {c["name"]: c["id"] for c in s.get(f"{API}/categories").json()}
    chk, cc = accounts["Chase Checking"], accounts["Chase Sapphire"]

    today = dt.date.today()
    spend = [
        ("Chipotle", "Food", 12.85, chk), ("Trader Joe's", "Food", 63.20, chk),
        ("Starbucks", "Food", 6.15, cc), ("Campus Bookstore", "School", 240.00, cc),
        ("Shell", "Gas", 41.30, chk), ("Uber", "Transportation", 18.75, cc),
        ("AMC Theatres", "Entertainment", 15.50, cc), ("Amazon", "Shopping", 54.99, cc),
        ("Rent - Oakwood Apts", "Rent", 850.00, chk), ("CVS", "Health", 22.40, chk),
        ("Target", "Shopping", 78.30, cc), ("Dominos", "Food", 24.60, cc),
    ]
    for i, (m, cat, amt, acc) in enumerate(spend):
        d = today - dt.timedelta(days=random.randint(1, 26))
        s.post(f"{API}/transactions", json={
            "account_id": acc, "category_id": cats.get(cat),
            "transaction_type": "expense", "merchant": m, "amount": amt,
            "transaction_date": d.isoformat(),
        })
    # Income
    for wk in (5, 19):
        s.post(f"{API}/transactions", json={
            "account_id": chk, "category_id": cats.get("Income"),
            "transaction_type": "income", "merchant": "Part-time Job Paycheck",
            "amount": 620.00, "transaction_date": (today - dt.timedelta(days=wk)).isoformat(),
        })

    m, y = today.month, today.year
    for cat, lim in [("Food", 300), ("Rent", 900), ("School", 250),
                     ("Shopping", 150), ("Gas", 120), ("Entertainment", 80)]:
        s.put(f"{API}/budgets", json={"category_id": cats[cat], "month": m,
                                      "year": y, "limit_amount": lim})

    for name, amt, cyc in [("Netflix", 15.99, "monthly"), ("Spotify", 5.99, "monthly")]:
        s.post(f"{API}/subscriptions", json={
            "name": name, "amount": amt, "billing_cycle": cyc,
            "next_payment_date": (today + dt.timedelta(days=6)).isoformat(),
            "account_id": cc, "category_id": cats.get("Subscriptions"),
        })

    s.post(f"{API}/savings/plans", json={
        "name": "Emergency Fund", "amount": 150, "frequency": "monthly",
        "next_run_date": (today + dt.timedelta(days=10)).isoformat(),
        "from_account_id": chk, "to_account_id": accounts["Ally Savings"],
    })
    print("seeded fresh demo data")
else:
    print("demo account already has data; skipping seed")

print("LOGIN:", EMAIL, "/", PW)
