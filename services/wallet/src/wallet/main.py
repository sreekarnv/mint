from fastapi import FastAPI

import wallet.kafka.consumers.auth_events
from wallet.core.settings import settings
from wallet.routes.kafka import kafka_router
from wallet.routes.wallet_admin import wallet_admin_route
from wallet.routes.wallet_user import wallet_user_route

app = FastAPI(title="Wallet Service")

app.include_router(kafka_router)
app.include_router(wallet_admin_route, prefix="/api/v1/wallet")
app.include_router(wallet_user_route, prefix="/api/v1/wallet")


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
