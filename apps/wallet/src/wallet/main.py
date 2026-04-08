import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.grpc import GrpcInstrumentorServer
from mint_shared.telemetry import setup_telemetry

from wallet.grpc import start_grpc_server
from wallet.core.settings import settings
from wallet.routes.kafka import kafka_router
from wallet.routes.wallet_admin import wallet_admin_route
from wallet.routes.wallet_user import wallet_user_route

import wallet.kafka.consumers.auth_events
import wallet.kafka.consumers.transaction_events

from wallet.db import get_db

# Initialize OTel before the FastAPI app is constructed
setup_telemetry(os.getenv("OTEL_SERVICE_NAME", "wallet-service"))
GrpcInstrumentorServer().instrument()


@asynccontextmanager
async def lifespan(app: FastAPI):
    grpc_server = await start_grpc_server(get_db, port=50051)
    yield
    grpc_server.stop(0)


app = FastAPI(
    title="Wallet Service",
    description="Multi-currency wallet service - balances, top-ups, and gRPC interface for transaction settlement.",
    version="1.0.0",
    docs_url="/api-docs",
    lifespan=lifespan,
)

app.include_router(kafka_router)
app.include_router(wallet_admin_route, prefix="/api/v1/wallet")
app.include_router(wallet_user_route, prefix="/api/v1/wallet")

FastAPIInstrumentor.instrument_app(app)


def start():
    import uvicorn

    uvicorn.run(
        "wallet.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.app_reload,
    )


if __name__ == "__main__":
    start()
