from typing import Any

from pydantic import PostgresDsn, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from src.constants import Environment


class CustomBaseSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


class Config(CustomBaseSettings):
    DATABASE_URL: PostgresDsn
    DATABASE_ASYNC_URL: PostgresDsn
    DATABASE_POOL_SIZE: int = 16
    DATABASE_POOL_TTL: int = 60 * 20  # 20 minutes
    DATABASE_POOL_PRE_PING: bool = True

    ENVIRONMENT: Environment = Environment.PRODUCTION

    SENTRY_DSN: str | None = None

    CORS_ORIGINS: list[str] = ["*"]
    CORS_ORIGINS_REGEX: str | None = None
    CORS_HEADERS: list[str] = ["*"]

    APP_VERSION: str = "0.1"

    # Auth settings
    AUTH_ACCESS_TOKEN_TTL_MIN: int = 15
    AUTH_REFRESH_TTL_DAYS: int = 7
    AUTH_JWT_SECRET: str = "CHANGE_ME_IN_PRODUCTION"
    AUTH_COOKIE_DOMAIN: str | None = None
    AUTH_COOKIE_SECURE: bool | None = None
    AUTH_COOKIE_SAMESITE: str = "lax"
    AUTH_COOKIE_ACCESS_NAME: str = "access_token"
    AUTH_COOKIE_REFRESH_NAME: str = "refresh_token"

    # OAuth settings
    OAUTH_GOOGLE_CLIENT_ID: str | None = None
    OAUTH_GOOGLE_CLIENT_SECRET: str | None = None
    OAUTH_GOOGLE_REDIRECT_URI: str | None = None

    # URL settings
    FRONTEND_URL: str | None = None
    APP_URL: str | None = None

    @model_validator(mode="after")
    def validate_sentry_non_local(self) -> "Config":
        if self.ENVIRONMENT.is_deployed and not self.SENTRY_DSN:
            raise ValueError("Sentry is not set")

        return self


settings = Config()

app_configs: dict[str, Any] = {"title": "App API"}
if settings.ENVIRONMENT.is_deployed:
    app_configs["root_path"] = f"/v{settings.APP_VERSION}"

if not settings.ENVIRONMENT.is_debug:
    app_configs["openapi_url"] = None  # hide docs
