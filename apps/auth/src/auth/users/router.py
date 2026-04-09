from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import select

from fastauth.adapters.sqlalchemy.models import UserModel

from auth.core.fastauth_config import adapter
from mint_shared.jwks.user import get_current_user
from mint_shared.jwks.manager import JWKSManager


jwks_manager = JWKSManager("http://auth:4001/.well-known/jwks.json")

router = APIRouter(prefix="/api/v1/auth/users", tags=["users"])


class UserSearchResult(BaseModel):
    id: str
    email: str
    name: str | None


async def require_auth(request: Request) -> dict:
    return await get_current_user(request, jwks_manager)


@router.get("/search", response_model=list[UserSearchResult])
async def search_users(
    email: str = Query(..., min_length=1),
    current_user: dict = Depends(require_auth),
):
    caller_id = current_user.get("sub")
    async with adapter._session_factory() as session:
        result = await session.execute(
            select(UserModel.id, UserModel.email, UserModel.name)
            .where(UserModel.email.ilike(f"{email}%"))
            .where(UserModel.is_active == True)  # noqa: E712
            .where(UserModel.id != caller_id)
            .limit(10)
        )
        rows = result.all()

    return [UserSearchResult(id=row.id, email=row.email, name=row.name) for row in rows]
