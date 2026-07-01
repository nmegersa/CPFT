# CPFT (College Personal Finances Tracker) ERD / Database Design Document

## Project Overview

**CPFT** is a full-stack personal finance and credit health dashboard designed for students, young adults, and new credit card users.

The app helps users:

1. Track income and expenses.
2. Categorize transactions.
3. Set monthly budgets.
4. Monitor subscriptions.
5. Understand credit card utilization.
6. Simulate credit decisions.
7. Receive simple financial insights.

This document defines the database structure, entity relationships, and design reasoning for the project.

---

# 1. Core Database Goals

The database should support:

* Multiple users.
* Secure user accounts.
* Financial accounts such as checking, savings, and credit cards.
* Transactions connected to accounts.
* Budget categories and spending limits.
* Subscription tracking.
* Credit card profile tracking.
* Credit utilization calculations.
* What-if credit simulations.
* Personalized finance insights.
* Future growth for Plaid, AI insights, alerts, and analytics.

---

# 2. Main Entities

The core entities are:

1. `users`
2. `financial_accounts`
3. `transactions`
4. `categories`
5. `budgets`
6. `subscriptions`
7. `credit_profiles`
8. `credit_simulations`
9. `insights`
10. `alerts`

Optional future entities:

11. `goals`
12. `income_sources`
13. `audit_logs`
14. `plaid_connections`

---

# 3. ERD Overview

## High-Level Relationship Map

```text
users
  ├── financial_accounts
  │       ├── transactions
  │       └── credit_profiles
  │
  ├── categories
  │       ├── transactions
  │       ├── budgets
  │       └── subscriptions
  │
  ├── budgets
  ├── subscriptions
  ├── credit_simulations
  ├── insights
  ├── alerts
  ├── goals
  ├── income_sources
  └── audit_logs
```

## Relationship Summary

```text
One user has many financial accounts.
One financial account has many transactions.
One user has many categories.
One category can be used by many transactions.
One user has many budgets.
One budget belongs to one category.
One user has many subscriptions.
One subscription belongs to one category.
One financial account can have one credit profile if it is a credit card.
One user has many credit simulations.
One user has many insights.
One user has many alerts.
```

---

# 4. Entity Details

---

## 4.1 users

Stores registered users.

### Purpose

Each user owns their own financial data. All major tables should connect back to `users`.

### Fields

```text
users
- id UUID PRIMARY KEY
- first_name VARCHAR(100)
- last_name VARCHAR(100)
- email VARCHAR(255) UNIQUE NOT NULL
- password_hash TEXT NOT NULL
- created_at TIMESTAMP NOT NULL
- updated_at TIMESTAMP NOT NULL
```

### Notes

* Never store raw passwords.
* `password_hash` should store a securely hashed password.
* Email should be unique.
* Most other tables will reference `users.id`.

---

## 4.2 financial_accounts

Stores checking accounts, savings accounts, credit cards, and cash accounts.

### Purpose

A user may have multiple accounts. Transactions belong to accounts.

### Fields

```text
financial_accounts
- id UUID PRIMARY KEY
- user_id UUID FOREIGN KEY REFERENCES users(id)
- account_name VARCHAR(100) NOT NULL
- account_type VARCHAR(50) NOT NULL
- institution_name VARCHAR(100)
- current_balance NUMERIC(12,2) DEFAULT 0
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMP NOT NULL
- updated_at TIMESTAMP NOT NULL
```

### Example account types

```text
checking
savings
credit_card
cash
investment
student_loan
other
```

### Example Records

```text
account_name: "Discover Student Card"
account_type: "credit_card"
institution_name: "Discover"

account_name: "Checking Account"
account_type: "checking"
institution_name: "Chase"
```

### Relationships

```text
users 1 ─── many financial_accounts
financial_accounts 1 ─── many transactions
financial_accounts 1 ─── 0 or 1 credit_profiles
```

---

## 4.3 categories

Stores spending and income categories.

### Purpose

Categories allow users to organize transactions, budgets, and subscriptions.

### Fields

```text
categories
- id UUID PRIMARY KEY
- user_id UUID FOREIGN KEY REFERENCES users(id)
- name VARCHAR(100) NOT NULL
- category_type VARCHAR(50) NOT NULL
- color VARCHAR(20)
- icon VARCHAR(50)
- is_default BOOLEAN DEFAULT false
- created_at TIMESTAMP NOT NULL
- updated_at TIMESTAMP NOT NULL
```

### Example category types

```text
income
expense
transfer
debt_payment
savings
```

### Example categories

```text
Food
Rent
Gas
School
Entertainment
Shopping
Subscriptions
Savings
Credit Card Payment
Paycheck
Internship Income
```

### Relationships

```text
users 1 ─── many categories
categories 1 ─── many transactions
categories 1 ─── many budgets
categories 1 ─── many subscriptions
```

---

## 4.4 transactions

Stores user financial activity.

### Purpose

This is one of the most important tables. It stores income, expenses, transfers, and payments.

### Fields

```text
transactions
- id UUID PRIMARY KEY
- user_id UUID FOREIGN KEY REFERENCES users(id)
- account_id UUID FOREIGN KEY REFERENCES financial_accounts(id)
- category_id UUID FOREIGN KEY REFERENCES categories(id)
- transaction_type VARCHAR(50) NOT NULL
- merchant VARCHAR(150)
- description TEXT
- amount NUMERIC(12,2) NOT NULL
- transaction_date DATE NOT NULL
- is_recurring BOOLEAN DEFAULT false
- source VARCHAR(50) DEFAULT 'manual'
- created_at TIMESTAMP NOT NULL
- updated_at TIMESTAMP NOT NULL
```

### Example transaction types

```text
income
expense
transfer
credit_card_payment
refund
fee
```

### Example sources

```text
manual
csv_upload
plaid
system_generated
```

### Amount rule

Use positive amounts for all transactions and rely on `transaction_type` to determine whether it increases or decreases the user's balance.

Example:

```text
transaction_type: expense
amount: 25.50

transaction_type: income
amount: 1200.00
```

This is easier for beginners than mixing positive and negative numbers.

### Relationships

```text
users 1 ─── many transactions
financial_accounts 1 ─── many transactions
categories 1 ─── many transactions
```

---

## 4.5 budgets

Stores monthly spending limits by category.

### Purpose

Users can set budgets like "Food: $300/month."

### Fields

```text
budgets
- id UUID PRIMARY KEY
- user_id UUID FOREIGN KEY REFERENCES users(id)
- category_id UUID FOREIGN KEY REFERENCES categories(id)
- month INTEGER NOT NULL
- year INTEGER NOT NULL
- limit_amount NUMERIC(12,2) NOT NULL
- created_at TIMESTAMP NOT NULL
- updated_at TIMESTAMP NOT NULL
```

### Example

```text
category: Food
month: 7
year: 2026
limit_amount: 300.00
```

### Relationships

```text
users 1 ─── many budgets
categories 1 ─── many budgets
```

### Constraint Recommendation

A user should only have one budget per category per month/year.

```text
UNIQUE(user_id, category_id, month, year)
```

---

## 4.6 subscriptions

Stores recurring payments.

### Purpose

Helps users track recurring expenses such as streaming services, gym memberships, software, phone bills, and other monthly charges.

### Fields

```text
subscriptions
- id UUID PRIMARY KEY
- user_id UUID FOREIGN KEY REFERENCES users(id)
- category_id UUID FOREIGN KEY REFERENCES categories(id)
- name VARCHAR(150) NOT NULL
- amount NUMERIC(12,2) NOT NULL
- billing_cycle VARCHAR(50) NOT NULL
- next_payment_date DATE
- is_active BOOLEAN DEFAULT true
- notes TEXT
- created_at TIMESTAMP NOT NULL
- updated_at TIMESTAMP NOT NULL
```

### Example billing cycles

```text
weekly
monthly
quarterly
yearly
custom
```

### Example Records

```text
name: "Spotify"
amount: 10.99
billing_cycle: "monthly"

name: "Gym Membership"
amount: 29.99
billing_cycle: "monthly"
```

### Relationships

```text
users 1 ─── many subscriptions
categories 1 ─── many subscriptions
```

---

# 5. Credit Health Entities

---

## 5.1 credit_profiles

Stores credit card-specific data.

### Purpose

This table powers the credit utilization calculator.

Each credit card account can have one credit profile.

### Fields

```text
credit_profiles
- id UUID PRIMARY KEY
- user_id UUID FOREIGN KEY REFERENCES users(id)
- account_id UUID FOREIGN KEY REFERENCES financial_accounts(id)
- credit_limit NUMERIC(12,2) NOT NULL
- current_balance NUMERIC(12,2) NOT NULL
- statement_balance NUMERIC(12,2)
- apr NUMERIC(5,2)
- minimum_payment NUMERIC(12,2)
- payment_due_date DATE
- statement_close_date DATE
- created_at TIMESTAMP NOT NULL
- updated_at TIMESTAMP NOT NULL
```

### Example

```text
account: Discover Student Card
credit_limit: 1500.00
current_balance: 200.00
apr: 27.99
minimum_payment: 35.00
```

### Utilization Formula

```text
credit_utilization = current_balance / credit_limit
```

Example:

```text
200 / 1500 = 0.1333
13.33%
```

### Utilization Ranges

```text
0% - 9%      Excellent
10% - 29%    Good
30% - 49%    Risky
50%+         High Risk
```

### Relationships

```text
users 1 ─── many credit_profiles
financial_accounts 1 ─── 0 or 1 credit_profiles
```

### Constraint Recommendation

```text
UNIQUE(account_id)
```

This prevents multiple credit profiles for the same credit card account.

---

## 5.2 credit_simulations

Stores what-if credit card scenarios.

### Purpose

Lets users simulate credit decisions.

Examples:

* What if I spend $300?
* What if I pay $100?
* What if my credit limit increases?
* What if I miss a payment?

### Fields

```text
credit_simulations
- id UUID PRIMARY KEY
- user_id UUID FOREIGN KEY REFERENCES users(id)
- credit_profile_id UUID FOREIGN KEY REFERENCES credit_profiles(id)
- simulation_type VARCHAR(50) NOT NULL
- input_amount NUMERIC(12,2)
- starting_balance NUMERIC(12,2) NOT NULL
- starting_credit_limit NUMERIC(12,2) NOT NULL
- resulting_balance NUMERIC(12,2) NOT NULL
- resulting_credit_limit NUMERIC(12,2) NOT NULL
- starting_utilization NUMERIC(6,4) NOT NULL
- resulting_utilization NUMERIC(6,4) NOT NULL
- result_message TEXT
- created_at TIMESTAMP NOT NULL
```

### Example simulation types

```text
add_purchase
make_payment
increase_credit_limit
decrease_credit_limit
miss_payment
pay_statement_balance
pay_minimum_only
```

### Example

```text
simulation_type: add_purchase
input_amount: 300.00
starting_balance: 200.00
starting_credit_limit: 1500.00
resulting_balance: 500.00
resulting_credit_limit: 1500.00
starting_utilization: 0.1333
resulting_utilization: 0.3333
result_message: "Your utilization would increase from 13.33% to 33.33%, which may be considered risky."
```

### Relationships

```text
users 1 ─── many credit_simulations
credit_profiles 1 ─── many credit_simulations
```

---

# 6. Insights and Alerts

---

## 6.1 insights

Stores personalized messages generated from user activity.

### Purpose

Insights make the app feel smart without needing advanced AI.

Examples:

* "Food is your highest spending category this month."
* "Your credit utilization is above 30%."
* "Your subscriptions total $85.96/month."
* "You spent 20% less this month compared to last month."

### Fields

```text
insights
- id UUID PRIMARY KEY
- user_id UUID FOREIGN KEY REFERENCES users(id)
- insight_type VARCHAR(50) NOT NULL
- title VARCHAR(150) NOT NULL
- message TEXT NOT NULL
- severity VARCHAR(50) DEFAULT 'info'
- is_dismissed BOOLEAN DEFAULT false
- created_at TIMESTAMP NOT NULL
```

### Example insight types

```text
budget_warning
spending_trend
credit_utilization_warning
subscription_summary
savings_tip
income_change
```

### Example severity levels

```text
info
success
warning
danger
```

### Relationships

```text
users 1 ─── many insights
```

---

## 6.2 alerts

Stores direct alerts/reminders.

### Purpose

Alerts are more urgent or action-based than insights.

Examples:

* Budget limit almost reached.
* Credit card due date coming soon.
* Subscription payment coming soon.
* High utilization warning.

### Fields

```text
alerts
- id UUID PRIMARY KEY
- user_id UUID FOREIGN KEY REFERENCES users(id)
- alert_type VARCHAR(50) NOT NULL
- title VARCHAR(150) NOT NULL
- message TEXT NOT NULL
- scheduled_for TIMESTAMP
- is_read BOOLEAN DEFAULT false
- created_at TIMESTAMP NOT NULL
```

### Example alert types

```text
budget_limit
credit_due_date
subscription_due
high_utilization
large_transaction
```

### Relationships

```text
users 1 ─── many alerts
```

---

# 7. Optional Future Entities

These are not required for the MVP, but they are useful if the project grows.

---

## 7.1 goals

Stores financial goals.

### Purpose

Users can track savings goals.

Examples:

* Emergency fund
* Spring break trip
* New laptop
* Pay off credit card

### Fields

```text
goals
- id UUID PRIMARY KEY
- user_id UUID FOREIGN KEY REFERENCES users(id)
- name VARCHAR(150) NOT NULL
- target_amount NUMERIC(12,2) NOT NULL
- current_amount NUMERIC(12,2) DEFAULT 0
- target_date DATE
- is_completed BOOLEAN DEFAULT false
- created_at TIMESTAMP NOT NULL
- updated_at TIMESTAMP NOT NULL
```

### Relationships

```text
users 1 ─── many goals
```

---

## 7.2 income_sources

Stores recurring income.

### Purpose

Useful for students with part-time jobs, internships, campus jobs, or scholarships.

### Fields

```text
income_sources
- id UUID PRIMARY KEY
- user_id UUID FOREIGN KEY REFERENCES users(id)
- name VARCHAR(150) NOT NULL
- amount NUMERIC(12,2) NOT NULL
- frequency VARCHAR(50) NOT NULL
- next_expected_date DATE
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMP NOT NULL
- updated_at TIMESTAMP NOT NULL
```

### Example frequencies

```text
weekly
biweekly
monthly
one_time
semesterly
custom
```

### Example Records

```text
name: "Summer Internship Paycheck"
amount: 1200.00
frequency: "biweekly"

name: "Campus Job"
amount: 450.00
frequency: "biweekly"
```

### Relationships

```text
users 1 ─── many income_sources
```

---

## 7.3 audit_logs

Stores security and activity events.

### Purpose

Useful for finance/security-related apps. Shows that you understand real-world system design.

### Fields

```text
audit_logs
- id UUID PRIMARY KEY
- user_id UUID FOREIGN KEY REFERENCES users(id)
- action VARCHAR(100) NOT NULL
- entity_name VARCHAR(100)
- entity_id UUID
- ip_address VARCHAR(100)
- user_agent TEXT
- created_at TIMESTAMP NOT NULL
```

### Example actions

```text
user_login
user_logout
transaction_created
transaction_updated
transaction_deleted
credit_profile_updated
budget_created
password_changed
```

### Relationships

```text
users 1 ─── many audit_logs
```

---

## 7.4 plaid_connections

Stores external bank connection metadata.

### Purpose

This should only be added later if the app integrates with Plaid or another banking API.

### Fields

```text
plaid_connections
- id UUID PRIMARY KEY
- user_id UUID FOREIGN KEY REFERENCES users(id)
- institution_name VARCHAR(150)
- plaid_item_id TEXT
- access_token_encrypted TEXT
- status VARCHAR(50) DEFAULT 'active'
- created_at TIMESTAMP NOT NULL
- updated_at TIMESTAMP NOT NULL
```

### Important Security Note

Never store raw access tokens without encryption.

### Relationships

```text
users 1 ─── many plaid_connections
```

---

# 8. MVP Tables

For the first version of the app, only build these tables:

```text
users
financial_accounts
categories
transactions
budgets
subscriptions
credit_profiles
credit_simulations
insights
alerts
```

Do not build optional tables yet unless needed.

---

# 9. Recommended MVP Entity Relationship Diagram

```text
┌──────────────┐
│    users     │
└──────┬───────┘
       │
       │ 1 to many
       ▼
┌────────────────────┐
│ financial_accounts │
└──────┬─────────────┘
       │
       │ 1 to many
       ▼
┌──────────────┐
│ transactions │
└──────┬───────┘
       │
       │ many to 1
       ▼
┌──────────────┐
│  categories  │
└──────────────┘


users 1 ─── many categories
users 1 ─── many budgets
users 1 ─── many subscriptions
users 1 ─── many credit_profiles
users 1 ─── many credit_simulations
users 1 ─── many insights
users 1 ─── many alerts

categories 1 ─── many budgets
categories 1 ─── many subscriptions
categories 1 ─── many transactions

financial_accounts 1 ─── many transactions
financial_accounts 1 ─── 0 or 1 credit_profiles

credit_profiles 1 ─── many credit_simulations
```

---

# 10. SQL-Style Schema Draft

This is not final production SQL, but it can guide implementation.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    institution_name VARCHAR(100),
    current_balance NUMERIC(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE categories (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    category_type VARCHAR(50) NOT NULL,
    color VARCHAR(20),
    icon VARCHAR(50),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    account_id UUID NOT NULL REFERENCES financial_accounts(id),
    category_id UUID REFERENCES categories(id),
    transaction_type VARCHAR(50) NOT NULL,
    merchant VARCHAR(150),
    description TEXT,
    amount NUMERIC(12,2) NOT NULL,
    transaction_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    source VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE budgets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    limit_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(user_id, category_id, month, year)
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    category_id UUID REFERENCES categories(id),
    name VARCHAR(150) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    billing_cycle VARCHAR(50) NOT NULL,
    next_payment_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE credit_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    account_id UUID NOT NULL UNIQUE REFERENCES financial_accounts(id),
    credit_limit NUMERIC(12,2) NOT NULL,
    current_balance NUMERIC(12,2) NOT NULL,
    statement_balance NUMERIC(12,2),
    apr NUMERIC(5,2),
    minimum_payment NUMERIC(12,2),
    payment_due_date DATE,
    statement_close_date DATE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE credit_simulations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    credit_profile_id UUID NOT NULL REFERENCES credit_profiles(id),
    simulation_type VARCHAR(50) NOT NULL,
    input_amount NUMERIC(12,2),
    starting_balance NUMERIC(12,2) NOT NULL,
    starting_credit_limit NUMERIC(12,2) NOT NULL,
    resulting_balance NUMERIC(12,2) NOT NULL,
    resulting_credit_limit NUMERIC(12,2) NOT NULL,
    starting_utilization NUMERIC(6,4) NOT NULL,
    resulting_utilization NUMERIC(6,4) NOT NULL,
    result_message TEXT,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE insights (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    insight_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'info',
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    scheduled_for TIMESTAMP,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL
);
```

---

# 11. Important Indexes

Indexes help queries run faster.

Recommended indexes:

```sql
CREATE INDEX idx_financial_accounts_user_id
ON financial_accounts(user_id);

CREATE INDEX idx_transactions_user_id
ON transactions(user_id);

CREATE INDEX idx_transactions_account_id
ON transactions(account_id);

CREATE INDEX idx_transactions_category_id
ON transactions(category_id);

CREATE INDEX idx_transactions_date
ON transactions(transaction_date);

CREATE INDEX idx_budgets_user_month_year
ON budgets(user_id, month, year);

CREATE INDEX idx_subscriptions_user_id
ON subscriptions(user_id);

CREATE INDEX idx_credit_profiles_user_id
ON credit_profiles(user_id);

CREATE INDEX idx_credit_simulations_user_id
ON credit_simulations(user_id);

CREATE INDEX idx_insights_user_id
ON insights(user_id);

CREATE INDEX idx_alerts_user_id
ON alerts(user_id);
```

---

# 12. Example User Flow

## New User Setup

```text
1. User creates account.
2. System creates default categories.
3. User adds financial accounts.
4. User adds transactions manually or by CSV upload.
5. User creates budgets.
6. User creates a credit profile for a credit card account.
7. User runs credit simulations.
8. App generates insights and alerts.
```

---

# 13. Example Default Categories

When a new user signs up, the app can create these default categories:

```text
Income
Food
Rent
Gas
Transportation
School
Entertainment
Shopping
Subscriptions
Savings
Credit Card Payment
Health
Travel
Other
```

Each default category belongs to the user, even if the names are the same across users.

---

# 14. Business Logic Rules

## Credit Utilization

```text
utilization = current_balance / credit_limit
```

If credit limit is 0, return an error.

## Utilization Message Rules

```text
0% - 9%:
"Excellent utilization. This is generally a healthy range."

10% - 29%:
"Good utilization. You are below the commonly recommended 30% threshold."

30% - 49%:
"Your utilization is getting high. Consider paying down your balance."

50%+:
"High utilization. This may hurt your credit health if reported."
```

## Budget Warning Rules

```text
If category spending >= 80% of budget:
Create warning insight.

If category spending >= 100% of budget:
Create danger alert.
```

## Subscription Insight Rule

```text
If total monthly subscriptions > 100:
Create insight showing total monthly subscription cost.
```

## Spending Trend Rule

```text
Compare current month spending to previous month spending.

If current month spending is 20% higher:
Create warning insight.
```

---

# 15. API Routes Connected to ERD

## Auth

```text
POST /auth/register
POST /auth/login
GET /auth/me
```

## Financial Accounts

```text
GET /accounts
POST /accounts
GET /accounts/:id
PUT /accounts/:id
DELETE /accounts/:id
```

## Categories

```text
GET /categories
POST /categories
PUT /categories/:id
DELETE /categories/:id
```

## Transactions

```text
GET /transactions
POST /transactions
GET /transactions/:id
PUT /transactions/:id
DELETE /transactions/:id
POST /transactions/upload-csv
```

## Budgets

```text
GET /budgets
POST /budgets
PUT /budgets/:id
DELETE /budgets/:id
```

## Subscriptions

```text
GET /subscriptions
POST /subscriptions
PUT /subscriptions/:id
DELETE /subscriptions/:id
```

## Credit Profiles

```text
GET /credit/profile
POST /credit/profile
PUT /credit/profile/:id
DELETE /credit/profile/:id
```

## Credit Simulations

```text
POST /credit/simulate
GET /credit/simulations
GET /credit/simulations/:id
DELETE /credit/simulations/:id
```

## Dashboard

```text
GET /dashboard/summary
GET /dashboard/spending-by-category
GET /dashboard/monthly-trends
GET /dashboard/credit-health
```

## Insights

```text
GET /insights
POST /insights/generate
PUT /insights/:id/dismiss
```

## Alerts

```text
GET /alerts
PUT /alerts/:id/read
DELETE /alerts/:id
```

---

# 16. Recommended Build Order

## Phase 1: Foundation

Build:

```text
users
auth
financial_accounts
categories
```

## Phase 2: Personal Finance

Build:

```text
transactions
budgets
subscriptions
dashboard summary
```

## Phase 3: Credit Health

Build:

```text
credit_profiles
credit_simulations
credit utilization logic
what-if calculator
```

## Phase 4: Smart Features

Build:

```text
insights
alerts
rule-based recommendations
```

## Phase 5: Optional Additions

Build only after MVP works:

```text
goals
income_sources
audit_logs
plaid_connections
CSV upload
AI insights
```

---

# 17. What Can Be Changed Later

This schema is intentionally flexible.

You can later:

* Remove subscriptions if you want a smaller MVP.
* Add goals if you want savings tracking.
* Add income sources if you want student job tracking.
* Add Plaid if you want real bank connections.
* Add audit logs if you want stronger security.
* Add AI insights if you want a smarter app.
* Add shared budgets if you want family or roommate features.

The safest core to keep is:

```text
users
financial_accounts
categories
transactions
budgets
credit_profiles
credit_simulations
```

Those tables define the main product.
