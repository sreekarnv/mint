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

RUN mkdir keys/
RUN cd keys/ && openssl genrsa -out private_key.pem 2048
RUN cd keys/ && openssl rsa -in private_key.pem -pubout -out public_key.pem

EXPOSE 4001

CMD ["uv", "run", "dev"]
