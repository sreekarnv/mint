from fastapi.requests import Request
from mint_shared.jwks.user import get_current_user

from wallet.core.jwks import jwks_manager


async def require_auth(request: Request) -> dict:
    return await get_current_user(request, jwks_manager)
