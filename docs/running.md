# Running Mint

## Prerequisites

- Docker and Docker Compose
- Node.js 22 + pnpm (for local development without Docker)
- Python 3.12 + uv (for local development without Docker)

---

## Development

Development uses `docker-compose.dev.yml`. Services run with hot reload. MailHog catches all emails locally.

**1. Generate RSA keys (first time only)**

```sh
sh scripts/generate-keys.sh
```

This creates `keys/private_key.pem` and `keys/public_key.pem` used by the auth service.

**2. Start everything**

```sh
docker compose -f docker-compose.dev.yml up -d
```

Services are available at the same ports as production (see below). MailHog UI is at `http://localhost:8025`.

**3. Rebuild a single service after code changes**

```sh
docker compose -f docker-compose.dev.yml up -d --build <service-name>
```

---

## Production

**1. Generate RSA keys (first time only)**

```sh
sh scripts/generate-keys.sh
```

**2. Create `.env`**

```sh
cp .env.example .env
```

Edit `.env` and set at minimum:

| Variable | Description |
|----------|-------------|
| `FASTAUTH_SECRET` | Secret for JWT session signing |
| `ADMIN_USER_IDS` | Comma-separated user IDs with admin access |
| `GRAFANA_PASSWORD` | Grafana admin password |
| `KYC_WEBHOOK_SECRET` | Shared secret for Persona webhook verification |

**3. Start everything**

```sh
docker compose up -d
```

Migrations run automatically before each service starts.

**4. Rebuild after a change**

```sh
docker compose up -d --build <service-name>
```

---

## Service Ports

| Service | HTTP | gRPC |
|---------|------|------|
| nginx (gateway) | 80 | — |
| auth | 4001 | — |
| wallet | 4002 | 50051 |
| transactions | 4003 | — |
| kyc | 4004 | 50053 |
| analytics | 4005 | — |
| notifications | 4006 | — |
| social | 4007 | — |
| webhook | 4008 | — |
| admin | 4009 | — |
| audit | 4010 | — |
| fraud | — | 50052 |
| Grafana | 3000 | — |
| MailHog UI | 8025 | — |

---

## API Docs (Swagger)

Each service exposes Swagger UI at `/api-docs`.

| Service | URL |
|---------|-----|
| auth | http://localhost:4001/api-docs |
| wallet | http://localhost:4002/api-docs |
| transactions | http://localhost:4003/api-docs |
| kyc | http://localhost:4004/api-docs |
| analytics | http://localhost:4005/api-docs |
| notifications | http://localhost:4006/api-docs |
| social | http://localhost:4007/api-docs |
| webhook | http://localhost:4008/api-docs |
| admin | http://localhost:4009/api-docs |
| audit | http://localhost:4010/api-docs |

---

## Database Migrations (manual)

Migrations run automatically on startup, but you can also run them manually:

**Python services (auth, wallet)**

```sh
# From the repo root
docker compose exec auth uv run migrate
docker compose exec wallet uv run migrate
```

**NestJS services**

```sh
docker compose exec transactions npx prisma migrate deploy
```

---

## Generating gRPC Stubs

After editing a `.proto` file in `libs/proto/`:

```sh
# Regenerate Python stubs (wallet service)
python scripts/generate_proto.py

# NestJS services read .proto files directly at runtime — no stub generation needed
```
