from fastapi import APIRouter
from fastapi.requests import Request

from wallet.core.jwks import jwks_manager

wallet_user_route = APIRouter()


@wallet_user_route.get("/history")
async def get_wallet_history():
    return {"message": "get_wallet_history"}


@wallet_user_route.get("/")
async def get_wallet(request: Request):
    token_claims = await jwks_manager.verify_token(request.cookies.get("access_token"))
    return {"message": "get_wallet", "claims": token_claims}
