from pathlib import Path

from fastauth.adapters.sqlalchemy import SQLAlchemyAdapter
from fastauth.app import FastAuth
from fastauth.config import FastAuthConfig, JWTConfig
from fastauth.providers.credentials import CredentialsProvider

from auth.core.settings import settings

adapter = SQLAlchemyAdapter(engine_url="sqlite+aiosqlite:///./auth.db")

_PRIVATE_KEY = (Path(settings.keys_dir) / "private_key.pem").read_text()
_PUBLIC_KEY = (Path(settings.keys_dir) / "public_key.pem").read_text()


config = FastAuthConfig(
    secret=settings.fastauth_secret,
    providers=[CredentialsProvider()],
    adapter=adapter.user,
    token_adapter=adapter.token,
    jwt=JWTConfig(
        algorithm="RS256",
        private_key=_PRIVATE_KEY,
        public_key=_PUBLIC_KEY,
        jwks_enabled=True,
        access_token_ttl=900,
        issuer="auth",
    ),
    base_url=f"http://{settings.app_host}:{settings.app_port}",
)

auth = FastAuth(config)
