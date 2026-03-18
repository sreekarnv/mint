FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install -y openssl

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml .
COPY README.md .

RUN uv sync --no-install-project

COPY src/ src/
COPY .env .

RUN uv sync

EXPOSE 4002

CMD ["uv", "run", "dev"]
