from fastapi import APIRouter

wallet_admin_route = APIRouter()


@wallet_admin_route.post("/freeze")
async def freeze_wallet():
    return {"message": "Freeze Wallet"}


@wallet_admin_route.post("/unfreeze")
async def unfreeze_wallet():
    return {"message": "Freeze Wallet"}
