from sqlalchemy import select, update, func
import grpc

from wallet.proto.generated.wallet_pb2 import (
    MutationResponse,
    BalanceResponse,
    StatusResponse,
    WalletResponse,
)
from wallet.proto.generated.wallet_pb2_grpc import WalletServiceServicer
from wallet.models.wallet import Wallet
from wallet.models.balance_history import BalanceHistory


class WalletServicer(WalletServiceServicer):
    def __init__(self, get_db):
        self.get_db = get_db
    
    async def DebitWallet(self, request, context):
        async for session in self.get_db():
            async with session.begin():
                stmt = (
                    select(Wallet)
                    .where(Wallet.id == request.wallet_id)
                    .with_for_update()
                )
                result = await session.execute(stmt)
                wallet = result.scalar_one_or_none()
                
                if not wallet:
                    await context.abort(
                        grpc.StatusCode.NOT_FOUND,
                        f"Wallet {request.wallet_id} not found"
                    )
                    return MutationResponse(success=False, error="Wallet not found")
                
                if wallet.status.upper() != "ACTIVE":
                    await context.abort(
                        grpc.StatusCode.FAILED_PRECONDITION,
                        f"Wallet is {wallet.status}, cannot debit"
                    )
                    return MutationResponse(success=False, error=f"Wallet is {wallet.status}")
                
                if wallet.balance < request.amount_cents:
                    await context.abort(
                        grpc.StatusCode.FAILED_PRECONDITION,
                        f"Insufficient funds: balance={wallet.balance}, requested={request.amount_cents}"
                    )
                    return MutationResponse(success=False, error="Insufficient funds")
                
                history_stmt = select(BalanceHistory).where(
                    BalanceHistory.wallet_id == wallet.id,
                    BalanceHistory.transaction_id == request.transaction_id
                )
                history_result = await session.execute(history_stmt)
                existing_history = history_result.scalar_one_or_none()
                
                if existing_history:
                    return MutationResponse(
                        success=True,
                        balance_after=existing_history.balance_after
                    )
                
                new_balance = wallet.balance - request.amount_cents
                wallet.balance = new_balance
                wallet.updated_at = func.now()
                
                history = BalanceHistory(
                    wallet_id=wallet.id,
                    transaction_id=request.transaction_id,
                    delta=-request.amount_cents,
                    balance_after=new_balance
                )
                session.add(history)
                await session.flush()
                
                return MutationResponse(
                    success=True,
                    balance_after=new_balance
                )
    
    async def CreditWallet(self, request, context):
        async for session in self.get_db():
            async with session.begin():
                stmt = (
                    select(Wallet)
                    .where(Wallet.id == request.wallet_id)
                    .with_for_update()
                )
                result = await session.execute(stmt)
                wallet = result.scalar_one_or_none()
                
                if not wallet:
                    await context.abort(
                        grpc.StatusCode.NOT_FOUND,
                        f"Wallet {request.wallet_id} not found"
                    )
                    return MutationResponse(success=False, error="Wallet not found")
                
                if wallet.status.upper() != "ACTIVE":
                    await context.abort(
                        grpc.StatusCode.FAILED_PRECONDITION,
                        f"Wallet is {wallet.status}, cannot credit"
                    )
                    return MutationResponse(success=False, error=f"Wallet is {wallet.status}")
                
                history_stmt = select(BalanceHistory).where(
                    BalanceHistory.wallet_id == wallet.id,
                    BalanceHistory.transaction_id == request.transaction_id
                )
                history_result = await session.execute(history_stmt)
                existing_history = history_result.scalar_one_or_none()
                
                if existing_history:
                    return MutationResponse(
                        success=True,
                        balance_after=existing_history.balance_after
                    )
                
                new_balance = wallet.balance + request.amount_cents
                wallet.balance = new_balance
                wallet.updated_at = func.now()
                
                history = BalanceHistory(
                    wallet_id=wallet.id,
                    transaction_id=request.transaction_id,
                    delta=request.amount_cents,
                    balance_after=new_balance
                )
                session.add(history)
                await session.flush()
                
                return MutationResponse(
                    success=True,
                    balance_after=new_balance
                )
    
    async def GetBalance(self, request, context):
        async for session in self.get_db():
            stmt = select(Wallet).where(Wallet.id == request.wallet_id)
            result = await session.execute(stmt)
            wallet = result.scalar_one_or_none()
            
            if not wallet:
                await context.abort(
                    grpc.StatusCode.NOT_FOUND,
                    f"Wallet {request.wallet_id} not found"
                )
                return BalanceResponse(balance=0, currency="USD")
            
            return BalanceResponse(
                balance=wallet.balance,
                currency=wallet.currency
            )
    
    async def FreezeWallet(self, request, context):
        async for session in self.get_db():
            async with session.begin():
                stmt = (
                    update(Wallet)
                    .where(Wallet.id == request.wallet_id)
                    .values(status="FROZEN", updated_at=func.now())
                )
                result = await session.execute(stmt)
                
                if result.rowcount == 0:
                    await context.abort(
                        grpc.StatusCode.NOT_FOUND,
                        f"Wallet {request.wallet_id} not found"
                    )
                    return StatusResponse(success=False, message="Wallet not found")
                
                return StatusResponse(
                    success=True,
                    message="Wallet frozen successfully"
                )
    
    async def UnfreezeWallet(self, request, context):
        async for session in self.get_db():
            async with session.begin():
                stmt = (
                    update(Wallet)
                    .where(Wallet.id == request.wallet_id)
                    .values(status="ACTIVE", updated_at=func.now())
                )
                result = await session.execute(stmt)

                if result.rowcount == 0:
                    await context.abort(
                        grpc.StatusCode.NOT_FOUND,
                        f"Wallet {request.wallet_id} not found"
                    )
                    return StatusResponse(success=False, message="Wallet not found")

                return StatusResponse(
                    success=True,
                    message="Wallet unfrozen successfully"
                )

    async def GetWallet(self, request, context):
        async for session in self.get_db():
            stmt = (
                select(Wallet)
                .where(Wallet.user_id == request.user_id)
                .limit(1)
            )
            result = await session.execute(stmt)
            wallet = result.scalar_one_or_none()
            
            if not wallet:
                await context.abort(
                    grpc.StatusCode.NOT_FOUND,
                    f"No wallet found for user {request.user_id}"
                )
                return WalletResponse(
                    id="", user_id=request.user_id, 
                    balance=0, currency="USD", 
                    status="", is_default=False
                )
            
            is_default = getattr(wallet, 'is_default', True)
            
            return WalletResponse(
                id=wallet.id,
                user_id=wallet.user_id,
                balance=wallet.balance,
                currency=wallet.currency,
                status=wallet.status,
                is_default=is_default
            )