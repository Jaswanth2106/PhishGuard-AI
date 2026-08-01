from pathlib import Path
from typing import List, Union

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "PhishGuard AI API"
    API_V1_STR: str = "/api/v1"
    API_VERSION: str = "3.5.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    MODEL_VERSION: str = "2.6.0"
    MODEL_PATH: Path = Path("ml/models/model.pkl")
    VECTORIZER_PATH: Path = Path("ml/models/vectorizer.pkl")

    DATABASE_URL: str = "sqlite:///backend/data/phishguard.db"
    JWT_SECRET_KEY: str = "change-this-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # BACKEND_CORS_ORIGINS is a JSON-formatted list of origins
    # e.g: '["http://localhost", "http://localhost:3000"]'
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        if isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")


settings = Settings()

