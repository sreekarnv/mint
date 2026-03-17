import subprocess
import sys


def migrate():
    """Run alembic upgrade head."""
    subprocess.run(["uv", "run", "alembic", "upgrade", "head"], check=True)


def make_migration():
    """Generate a new migration. Usage: uv run migration <message>"""
    message = sys.argv[1] if len(sys.argv) > 1 else "migration"
    subprocess.run(
        ["uv", "run", "alembic", "revision", "--autogenerate", "-m", message],
        check=True,
    )
