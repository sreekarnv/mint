import asyncio
import logging
from pathlib import Path

from mint_shared.migrate import run_migrations, wait_for_db
from wallet.core.settings import settings

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


def main() -> None:
    ini_path = Path(__file__).parent.parent / "alembic.ini"
    logger.info(f"Alembic Ini = {ini_path}")
    asyncio.run(wait_for_db(settings.database_url))

    logger.info("Running migrations...")
    run_migrations(ini_path)
    logger.info("Migrations complete.")


if __name__ == "__main__":
    main()
