from fastapi import FastAPI

from wallet.core.settings import settings

app = FastAPI(title="Wallet Service")


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
