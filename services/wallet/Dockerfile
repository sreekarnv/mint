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

COPY services/wallet/pyproject.toml services/wallet/README.md services/wallet/

RUN uv sync --package mint-wallet --no-install-project --frozen

COPY services/wallet/src/ services/wallet/src/
COPY services/wallet/.env.development services/wallet/.env.development
COPY services/wallet/alembic.ini services/wallet/alembic.ini

RUN uv sync --package mint-wallet --frozen

WORKDIR /app/services/wallet

EXPOSE 4002

CMD ["uv", "run", "dev"]
