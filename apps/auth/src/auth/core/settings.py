import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

env_filename = (
    os.environ.get("ENV_FILENAME") if os.environ.get("ENV_FILENAME") is not None else ".env"
)

if not env_filename:
    raise ValueError("ENV_FILENAME is missing")


env_file = Path(__file__).parent.parent.parent.parent / env_filename

load_dotenv(env_file)


class Settings(BaseSettings):
    app_port: int
    app_host: str
    app_reload: bool
    keys_dir: str
    fastauth_secret: str
    database_url: str
    kafka_brokers: str
    smtp_host: str = "mailhog"
    smtp_port: int = 1025
    smtp_from: str = "Mint <noreply@mint.dev>"
    base_url: str = "http://localhost/api/v1"
    jwt_issuer: str = "mint-auth"
    jwt_audience: str = "mint-services"

    model_config = SettingsConfigDict(env_file=env_file, env_file_encoding="utf-8")


settings = Settings()  # type: ignore[call-arg]
