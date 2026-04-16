import os
import pytest

from fastapi import FastAPI
from fastapi.testclient import TestClient

from wallet.core.deps import require_auth
from wallet.db import get_db
from wallet.routes.wallet_admin import wallet_admin_route
from wallet.routes.wallet_user import wallet_user_route


from helpers import make_session_mock


os.environ.setdefault("APP_PORT", "4002")
os.environ.setdefault("APP_HOST", "localhost")
os.environ.setdefault("APP_RELOAD", "False")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")
os.environ.setdefault("KAFKA_BROKERS", "localhost:9092")


@pytest.fixture
def session():
    return make_session_mock()


@pytest.fixture
def user_client(session):
    app = FastAPI()
    app.include_router(wallet_user_route, prefix="/api/v1/wallet")

    async def override_auth():
        return {"sub": "u-1", "roles": ["user"]}

    async def override_db():
        yield session

    app.dependency_overrides[require_auth] = override_auth
    app.dependency_overrides[get_db] = override_db

    return TestClient(app)


@pytest.fixture
def admin_client(session):
    app = FastAPI()
    app.include_router(wallet_admin_route, prefix="/api/v1/wallet")

    async def override_auth():
        return {"sub": "admin-1", "roles": ["admin"]}

    async def override_db():
        yield session

    app.dependency_overrides[require_auth] = override_auth
    app.dependency_overrides[get_db] = override_db

    return TestClient(app)
