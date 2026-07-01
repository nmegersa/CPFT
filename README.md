# CPFT — College Personal Finances Tracker

A full-stack personal finance and credit health dashboard for students, young adults, and new credit card users.

Features (MVP):

- Track income and expenses across financial accounts
- Categorize transactions
- Set monthly budgets with visual progress bars
- Monitor subscriptions
- Understand credit card utilization
- Simulate what-if credit decisions
- Receive simple rule-based financial insights

See [`docs/database-design.md`](docs/database-design.md) for the full ERD and database design document.

## Project Structure

```
CPFT/
├── docs/
│   └── database-design.md   # ERD / database design (source of truth)
├── backend/                 # FastAPI + SQLAlchemy + PostgreSQL
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── config.py        # Settings (env-driven)
│   │   ├── database.py      # Engine / session setup
│   │   └── models/          # SQLAlchemy models (MVP tables)
│   ├── alembic/             # Migration environment
│   └── requirements.txt
└── frontend/                # React + TypeScript + Vite
    └── src/
        ├── components/      # Reusable UI (progress bars, cards, etc.)
        ├── pages/           # Dashboard, Budgets, Transactions, Credit, Subscriptions
        └── data/            # Mock data (until the API is wired up)
```

## Running the Frontend (works today)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The UI currently runs on mock data shaped like the real API, so it works without the backend. It is fully responsive — a sidebar on desktop and a bottom tab bar on mobile.

## Running the Backend (optional for now)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

By default the backend uses a local SQLite file (`cpft_dev.db`) so it starts without PostgreSQL. To use Postgres, copy `.env.example` to `.env` and set `DATABASE_URL`.

- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Migrations

Alembic is configured. Once you have a database set up:

```bash
cd backend
alembic revision --autogenerate -m "initial tables"
alembic upgrade head
```

## Build Phases

1. **Foundation** — users, auth, financial accounts, categories
2. **Personal finance** — transactions, budgets, subscriptions, dashboard
3. **Credit health** — credit profiles, simulations, utilization logic
4. **Smart features** — insights, alerts, rule-based recommendations
5. **Optional** — goals, income sources, audit logs, Plaid, CSV upload
