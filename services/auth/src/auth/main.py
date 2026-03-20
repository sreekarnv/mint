from contextlib import asynccontextmanager
from sys import prefix

from fastapi import FastAPI
from mint_shared import get_hello

from auth.core.fastauth_config import auth
from auth.core.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await auth.initialize_jwks()
    yield


app = FastAPI(title="Auth Service", lifespan=lifespan)
auth.mount(app)

get_hello()


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
