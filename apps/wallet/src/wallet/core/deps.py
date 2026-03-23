from fastapi import Depends, HTTPException, status
from fastapi.requests import Request
from mint_shared.jwks.roles import require_live_role
from mint_shared.jwks.user import get_current_user

from wallet.core.jwks import jwks_manager
from wallet.core.settings import settings


async def require_auth(request: Request) -> dict:
    return await get_current_user(request, jwks_manager)


async def require_admin(user: dict = Depends(require_auth)) -> dict:
    roles = user.get("roles", [])
    if "admin" not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
