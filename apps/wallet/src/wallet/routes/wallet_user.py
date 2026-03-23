from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from wallet.core.deps import require_auth
from wallet.db import get_db
from wallet.models import BalanceHistory, Wallet

wallet_user_route = APIRouter()


@wallet_user_route.get("/history")
async def get_wallet_history(
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == user.get("sub")))
    wallet = wallet_result.scalar_one_or_none()

    if not wallet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found")

    history_result = await db.execute(
        select(BalanceHistory)
        .where(BalanceHistory.wallet_id == wallet.id)
        .order_by(BalanceHistory.created_at.desc())
    )
    history = history_result.scalars().all()

    return {
        "walletId": wallet.id,
        "history": [
            {
                "id": h.id,
                "delta": h.delta,
                "balanceAfter": h.balance_after,
                "transactionId": h.transaction_id,
                "createdAt": h.created_at,
            }
            for h in history
        ],
    }


@wallet_user_route.get("/")
async def get_wallet(
    user: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Wallet).where(Wallet.user_id == user.get("sub")))
    wallet = result.scalar_one_or_none()

    if not wallet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found")

    return wallet
