from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy import select

from fastauth.adapters.sqlalchemy.models import UserModel
from fastauth.adapters.sqlalchemy.rbac import SQLAlchemyRoleAdapter

from auth.core.fastauth_config import adapter
from mint_shared.jwks.user import get_current_user
from mint_shared.jwks.manager import JWKSManager


jwks_manager = JWKSManager("http://auth:4001/.well-known/jwks.json")

router = APIRouter(prefix="/api/v1/auth", tags=["users"])


class UserSearchResult(BaseModel):
    id: str
    email: str
    name: str | None


class MeResponse(BaseModel):
    id: str
    email: str
    name: str | None
    email_verified: bool
    role: str


async def require_auth(request: Request) -> dict:
    return await get_current_user(request, jwks_manager)


@router.get("/me")
async def me(current_user: dict = Depends(require_auth)) -> MeResponse:
    """Override fastauth /me to include the user's primary role."""
    user_id = current_user.get("sub")

    role_adapter = SQLAlchemyRoleAdapter(adapter._session_factory)
    roles = await role_adapter.get_user_roles(user_id)

    async with adapter._session_factory() as session:
        result = await session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        user = result.scalar_one_or_none()

    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")

    role = "ADMIN" if "admin" in roles else "USER"

    return MeResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        email_verified=user.email_verified,
        role=role,
    )


@router.get("/users/search", response_model=list[UserSearchResult])
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
