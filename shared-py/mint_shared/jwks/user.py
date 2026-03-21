from fastapi import status
from fastapi.exceptions import HTTPException
from fastapi.requests import Request

from mint_shared.jwks.manager import JWKSManager


async def get_current_user(request: Request, jwks_manager: JWKSManager) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token_str = None

    if auth_header.startswith("Bearer "):
        token_str = auth_header[7:]
    else:
        token_str = request.cookies.get("access_token")

    if not token_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    return await jwks_manager.verify_token(token_str)
