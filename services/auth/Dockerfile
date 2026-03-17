FROM python:3.11-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml .
COPY README.md .

RUN uv sync --no-install-project

COPY keys/ keys/
COPY src/ src/
COPY .env .

RUN uv sync

EXPOSE 4001

CMD ["uv", "run", "dev"]
