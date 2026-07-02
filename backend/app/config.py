from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment / .env file."""

    database_url: str = "sqlite:///./cpft_dev.db"
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 24
    reset_token_expire_minutes: int = 30
    frontend_base_url: str = "http://localhost:5173"
    environment: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
