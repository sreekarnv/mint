# shared-py/mint_shared/auth/roles.py
import httpx
from fastapi import HTTPException, status


async def get_live_roles(user_id: str, auth_service_url: str, service_token: str) -> list[str]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{auth_service_url}/api/v1/auth/roles/user/{user_id}",
            headers={"Authorization": f"Bearer {service_token}"},
            timeout=5.0,
        )
    if resp.status_code == 200:
        data = resp.json()
        return data.get("roles", [])
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Could not verify roles")


async def require_live_role(
    role: str, user_id: str, auth_service_url: str, service_token: str
) -> None:
    roles = await get_live_roles(user_id, auth_service_url, service_token)
    if role not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Role '{role}' required")
