from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.models import Base
from app.routers import auth, finance

app = FastAPI(
    title="CPFT API",
    description="College Personal Finances Tracker — personal finance and credit health API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(finance.router)


@app.on_event("startup")
def create_tables():
    # Dev convenience: create tables directly. Use Alembic migrations
    # once the schema stabilizes / for Postgres.
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"app": "CPFT API", "docs": "/docs"}
