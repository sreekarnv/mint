FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock ./

COPY shared-py/ shared-py/

COPY apps/auth/pyproject.toml apps/auth/README.md apps/auth/

RUN uv sync --package mint-auth --no-install-project --frozen

COPY apps/auth/src/ apps/auth/src/
COPY apps/auth/.env.development apps/auth/.env.development
COPY apps/auth/alembic.ini apps/auth/alembic.ini

RUN uv sync --package mint-auth --frozen

RUN mkdir -p apps/auth/keys && \
    openssl genrsa -out apps/auth/keys/private_key.pem 2048 && \
    openssl rsa -in apps/auth/keys/private_key.pem \
                -pubout -out apps/auth/keys/public_key.pem

WORKDIR /app/apps/auth

EXPOSE 4001

CMD ["uv", "run", "dev"]
