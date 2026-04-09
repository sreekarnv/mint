import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from mint_shared.telemetry import setup_telemetry

from auth.core.fastauth_config import adapter, auth
from auth.core.settings import settings
from auth.kafka.router import kafka_router
from auth.users.router import router as users_router

# Initialize OTel before the FastAPI app is constructed
setup_telemetry(os.getenv("OTEL_SERVICE_NAME", "auth-service"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    await auth.initialize_jwks()
    await auth.initialize_roles()
    yield


auth.role_adapter = adapter.role
app = FastAPI(
    title="Auth Service",
    description="Authentication and authorization service - JWT issuance, refresh, and RBAC.",
    version="1.0.0",
    docs_url="/api-docs",
    lifespan=lifespan,
)
auth.mount(app)

app.include_router(kafka_router)
app.include_router(users_router)

FastAPIInstrumentor.instrument_app(app)


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
