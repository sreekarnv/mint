"""
migrate.py — runs `alembic upgrade head` programmatically.

Called by the `migrate` script entry point defined in pyproject.toml.
Used as the CMD for the auth-migrate service in docker-compose, and as
a Kubernetes init container command in production.

No shell scripts. The same file works in every environment.
"""

import logging
import time
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy.ext.asyncio import create_async_engine

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


def run_migrations(ini_path: str) -> None:
    alembic_cfg = Config(str(ini_path))
    command.upgrade(alembic_cfg, "head")


async def wait_for_db(url: str, retries: int = 10, delay: float = 2.0) -> None:
    engine = create_async_engine(url)
    for attempt in range(1, retries + 1):
        try:
            async with engine.connect():
                logger.info("Database is ready.")
                return
        except Exception as exc:
            logger.info("Waiting for database (attempt %d/%d): %s", attempt, retries, exc)
            if attempt == retries:
                await engine.dispose()
                raise RuntimeError("Database not ready after %d attempts." % retries) from exc
            time.sleep(delay)
    await engine.dispose()
