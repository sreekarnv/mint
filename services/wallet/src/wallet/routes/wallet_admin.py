from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from wallet.core.deps import require_admin
from wallet.db import get_db
from wallet.models.wallet import Wallet, WalletStatus

wallet_admin_route = APIRouter()


@wallet_admin_route.post("/freeze")
async def freeze_wallet(
    user_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    if wallet.status == WalletStatus.FROZEN:
        raise HTTPException(status_code=400, detail="Already frozen")
    wallet.status = WalletStatus.FROZEN
    await db.commit()
    return {"walletId": wallet.id, "status": wallet.status}


@wallet_admin_route.post("/unfreeze")
async def unfreeze_wallet(
    user_id: str,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    if wallet.status != WalletStatus.FROZEN:
        raise HTTPException(status_code=400, detail="Wallet is not frozen")
    wallet.status = WalletStatus.ACTIVE
    await db.commit()
    return {"walletId": wallet.id, "status": wallet.status}
