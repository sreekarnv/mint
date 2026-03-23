import subprocess
import sys


def migrate():
    subprocess.run(["alembic", "upgrade", "head"], check=True)


def makemigrations():
    message = sys.argv[1] if len(sys.argv) > 1 else "migration"
    subprocess.run(
        ["alembic", "revision", "--autogenerate", "-m", message],
        check=True,
    )


def downgrade():
    revision = sys.argv[1] if len(sys.argv) > 1 else "-1"
    subprocess.run(["alembic", "downgrade", revision], check=True)
