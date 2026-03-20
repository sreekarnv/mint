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

COPY services/auth/pyproject.toml services/auth/README.md services/auth/

RUN uv sync --package mint-auth --no-install-project --frozen

COPY services/auth/src/ services/auth/src/
COPY services/auth/.env.development services/auth/.env.development
COPY services/auth/alembic.ini services/auth/alembic.ini

RUN uv sync --package mint-auth --frozen

RUN mkdir -p services/auth/keys && \
    openssl genrsa -out services/auth/keys/private_key.pem 2048 && \
    openssl rsa -in services/auth/keys/private_key.pem \
                -pubout -out services/auth/keys/public_key.pem

WORKDIR /app/services/auth

EXPOSE 4001

CMD ["uv", "run", "dev"]
