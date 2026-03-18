from fastapi import APIRouter

wallet_user_route = APIRouter()


@wallet_user_route.get("/history")
async def get_wallet_history():
    return {"message": "get_wallet_history"}


@wallet_user_route.get("/")
async def get_wallet():
    return {"message": "get_wallet"}
