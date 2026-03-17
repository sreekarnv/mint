from contextlib import asynccontextmanager

from fastapi import FastAPI

from auth.core.fastauth_config import adapter, auth
from auth.core.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await adapter.create_tables()
    await auth.initialize_jwks()
    yield


app = FastAPI(title="Auth Service", lifespan=lifespan)
auth.mount(app)


def start():
    import uvicorn

    uvicorn.run(
        "auth.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.app_reload,
    )


if __name__ == "__main__":
    start()
