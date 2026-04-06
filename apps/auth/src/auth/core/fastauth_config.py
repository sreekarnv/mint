from pathlib import Path

from fastauth.adapters.sqlalchemy import SQLAlchemyAdapter
from fastauth.app import FastAuth
from fastauth.config import FastAuthConfig, JWTConfig
from fastauth.providers.credentials import CredentialsProvider
from fastauth.email_transports.smtp import SMTPTransport

from auth.core.settings import settings

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
    email_transport=SMTPTransport(
        host=settings.smtp_host,
        port=settings.smtp_port,
        username="",
        password="",
        from_email=settings.smtp_from,
        use_tls=False,
    ),
    jwt=JWTConfig(
        algorithm="RS256",
        private_key=_PRIVATE_KEY,
        public_key=_PUBLIC_KEY,
        jwks_enabled=True,
        access_token_ttl=900,
    ),
    roles=[
        {"name": "user", "permissions": ["wallet:read", "wallet:transfer"]},
        {
            "name": "admin",
            "permissions": ["wallet:read", "wallet:transfer", "wallet:freeze", "users:manage"],
        },
    ],
    default_role="user",
    base_url=settings.base_url,
    debug=True,
)

auth = FastAuth(config)

# Late binding: hooks.py imports `auth` from this module at the top level,
# so hooks must be assigned after `auth` is created to avoid a circular import.
from auth.hooks import AuthEventHooks  # noqa: E402
auth.config.hooks = AuthEventHooks()
