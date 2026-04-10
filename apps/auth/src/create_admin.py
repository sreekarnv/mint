"""
Create an admin user in the auth service database.

Usage (run from repo root):
    docker exec -it mint-auth python /app/apps/auth/create_admin.py \
        --email admin@mint.dev \
        --password changeme \
        --name "Admin User"
"""

import argparse
import asyncio
import sys

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

sys.path.insert(0, "/app/apps/auth/src")

from auth.core.settings import settings
from fastauth.core.credentials import hash_password
from fastauth.adapters.sqlalchemy.user import SQLAlchemyUserAdapter
from fastauth.adapters.sqlalchemy.rbac import SQLAlchemyRoleAdapter
from fastauth.exceptions import UserAlreadyExistsError


async def create_admin(email: str, password: str, name: str) -> None:
    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    user_adapter = SQLAlchemyUserAdapter(session_factory)
    role_adapter = SQLAlchemyRoleAdapter(session_factory)

    try:
        hashed = hash_password(password)
        user = await user_adapter.create_user(
            email=email,
            hashed_password=hashed,
            name=name,
        )
        user = await user_adapter.update_user(user["id"], email_verified=True)
        print(f"Created user {email} (id={user['id']})")
    except UserAlreadyExistsError:
        user = await user_adapter.get_user_by_email(email)
        print(f"User {email} already exists (id={user['id']})")

    user_id = user["id"]

    roles = await role_adapter.get_user_roles(user_id)
    if "admin" in roles:
        print("User already has admin role")
    else:
        await role_adapter.assign_role(user_id, "admin")
        print(f"Assigned admin role to {email}")

    print(f"\nDone.")
    print(f"User ID : {user_id}")
    print(f"Email   : {email}")

    await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create an admin user")
    parser.add_argument("--email", required=True, help="Admin email address")
    parser.add_argument("--password", required=True, help="Admin password")
    parser.add_argument("--name", default="Admin", help="Display name (default: Admin)")
    args = parser.parse_args()

    asyncio.run(create_admin(args.email, args.password, args.name))
