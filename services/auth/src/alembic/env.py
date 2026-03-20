import asyncio
import os
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from dotenv import load_dotenv
from fastauth.adapters.sqlalchemy.models import (
    OAuthAccountModel,
    PasskeyModel,
    RoleModel,
    SessionModel,
    TokenModel,
    UserModel,
)
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

envfile_name = os.environ.get("ENV_FILENAME")

if not envfile_name:
    envfile_name = ".env"

env_file = Path(__file__).parent.parent.parent / envfile_name
load_dotenv(env_file)

config = context.config

database_url = os.environ.get("DATABASE_URL")

if database_url is None:
    raise ValueError("DATABASE_URL not set")

config.set_main_option("sqlalchemy.url", database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = UserModel.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    if database_url is None:
        raise ValueError("DATABASE_URL not set")

    connectable = create_async_engine(database_url, poolclass=pool.NullPool)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
