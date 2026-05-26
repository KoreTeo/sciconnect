from pydantic_settings import BaseSettings
import os

_BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_DEFAULT_UPLOAD_DIR = os.path.join(_BACKEND_ROOT, "uploads")


class Settings(BaseSettings):
    # База данных
    DATABASE_URL: str = "postgresql://sciconnect:sciconnect123@db:5432/sciconnect"

    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Redis
    REDIS_URL: str = "redis://redis:6379"

    # SMTP
    SMTP_HOST: str = "mailhog"
    SMTP_PORT: int = 1025
    SMTP_FROM: str = "noreply@sciconnect.local"
    SMTP_FROM_NAME: str = "SciConnect"
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # Email delivery
    EMAIL_ASYNC: bool = True
    EMAIL_QUEUE_KEY: str = "sciconnect:email"

    # URLs and email policy
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    EMAIL_VERIFICATION_REQUIRED: bool = True
    SMTP_USE_TLS: bool = False
    SMTP_USE_SSL: bool = False

    # Cookies
    COOKIE_SECURE: bool = False  # True в prod

    # Приложение
    APP_NAME: str = "SciConnect API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SEED_DEMO: bool = False
    PAYMENT_PROVIDER: str = "demo"
    UPLOAD_DIR: str = _DEFAULT_UPLOAD_DIR

    class Config:
        env_file = ".env"


settings = Settings()
