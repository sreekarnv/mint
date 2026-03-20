from pathlib import Path

from fastauth.adapters.sqlalchemy import SQLAlchemyAdapter
from fastauth.app import FastAuth
from fastauth.config import FastAuthConfig, JWTConfig
from fastauth.providers.credentials import CredentialsProvider

from auth.core.settings import settings
from auth.hooks import AuthEventHooks

adapter = SQLAlchemyAdapter(engine_url=settings.database_url)


KEYS_DIR = Path(__file__).parent.parent.parent.parent.joinpath(settings.keys_dir)
_PRIVATE_KEY = (KEYS_DIR / "private_key.pem").read_text()
_PUBLIC_KEY = (KEYS_DIR / "public_key.pem").read_text()


config = FastAuthConfig(
    secret=settings.fastauth_secret,
    providers=[CredentialsProvider()],
    adapter=adapter.user,
    token_adapter=adapter.token,
    route_prefix="/api/v1/auth",
    token_delivery="cookie",
    cookie_samesite="lax",
    jwt=JWTConfig(
        algorithm="RS256",
        private_key=_PRIVATE_KEY,
        public_key=_PUBLIC_KEY,
        jwks_enabled=True,
        access_token_ttl=900,
        issuer="auth",
    ),
    base_url=f"http://{settings.app_host}:{settings.app_port}",
    hooks=AuthEventHooks(),
)

auth = FastAuth(config)
