from fastapi import APIRouter, Depends
from sqlalchemy import select

from wallet.core.deps import require_auth
from wallet.db import AsyncSession, get_db
from wallet.models import Wallet

wallet_user_route = APIRouter()


@wallet_user_route.get("/history")
async def get_wallet_history():
    return {"message": "get_wallet_history"}


@wallet_user_route.get("/")
async def get_wallet(db: AsyncSession = Depends(get_db), user: dict = Depends(require_auth)):
    stmt = select(Wallet).where(Wallet.user_id == user.get("sub")).limit(1)
    result = await db.execute(stmt)

    wallet = result.scalar_one()

    return wallet
