from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

env_file = Path(__file__).parent.parent.parent.parent / ".env"
load_dotenv(env_file)


class Settings(BaseSettings):
    app_port: int
    app_host: str
    app_reload: bool
    keys_dir: str
    fastauth_secret: str
    database_url: str

    model_config = SettingsConfigDict(env_file=env_file, env_file_encoding="utf-8")


settings = Settings()  # type: ignore[call-arg]
