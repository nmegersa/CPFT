from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.models import Base
from app.routers import auth, finance

IS_PROD = settings.environment == "production"

if IS_PROD and settings.secret_key == "change-me-in-production":
    raise RuntimeError("Set a strong SECRET_KEY before running in production.")

app = FastAPI(
    title="CPFT API",
    description="College Personal Finances Tracker — personal finance and credit health API",
    version="1.0.0",
    # Hide interactive API docs in production.
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None,
    openapi_url=None if IS_PROD else "/openapi.json",
)

# Only the configured frontend may call the API (plus localhost in dev).
origins = [settings.frontend_base_url]
if not IS_PROD:
    origins += ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    if IS_PROD:
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response


app.include_router(auth.router)
app.include_router(finance.router)


@app.on_event("startup")
def create_tables():
    # Dev convenience: create tables directly.
    # In production run `alembic upgrade head` instead (also safe here: no-op for existing tables).
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"app": "CPFT API", "docs": "/docs"}
