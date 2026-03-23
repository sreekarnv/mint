FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update -y && \
    apt-get upgrade -y

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock ./

COPY shared-py/ shared-py/

COPY apps/wallet/pyproject.toml apps/wallet/README.md apps/wallet/

RUN uv sync --package mint-wallet --no-install-project --frozen

COPY apps/wallet/src/ apps/wallet/src/
COPY apps/wallet/.env.development apps/wallet/.env.development
COPY apps/wallet/alembic.ini apps/wallet/alembic.ini

RUN uv sync --package mint-wallet --frozen

WORKDIR /app/apps/wallet

EXPOSE 4002

CMD ["uv", "run", "dev"]
