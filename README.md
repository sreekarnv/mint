# Mint

A production-style fintech platform built with a microservices architecture. Covers authentication, wallet based payments, KYC, fraud detection, analytics, social features, webhooks, an admin console, and a tamper-proof audit log.

<p align="left">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  </a>
  <a href="https://fastapi.tiangolo.com/" target="_blank">
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  </a>
  <a href="https://www.typescriptlang.org/" target="_blank">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  </a>
  <a href="https://www.python.org/" target="_blank">
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  </a>
  <a href="https://www.postgresql.org/" target="_blank">
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  </a>
  <a href="https://kafka.apache.org/" target="_blank">
    <img src="https://img.shields.io/badge/Apache%20Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white" />
  </a>
  <a href="https://redis.io/" target="_blank">
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  </a>
  <a href="https://grpc.io/" target="_blank">
    <img src="https://img.shields.io/badge/gRPC-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  </a>
  <a href="https://min.io/" target="_blank">
    <img src="https://img.shields.io/badge/MinIO-C72E49?style=for-the-badge&logo=minio&logoColor=white" />
  </a>
  <a href="https://opentelemetry.io/" target="_blank">
    <img src="https://img.shields.io/badge/OpenTelemetry-000000?style=for-the-badge&logo=opentelemetry&logoColor=white" />
  </a>
  <a href="https://grafana.com/" target="_blank">
    <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white" />
  </a>
  <a href="https://www.docker.com/" target="_blank">
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  </a>
  <a href="https://www.prisma.io/" target="_blank">
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  </a>
  <a href="https://www.nginx.com/" target="_blank">
    <img src="https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white" />
  </a>
</p>

## Docs

- [Architecture](docs/architecture.md) - service map, communication patterns, JWT flow
- [Services](docs/services.md) - each service: endpoints, DB, Kafka topics
- [Infrastructure](docs/infrastructure.md) - nginx, Kafka, Postgres, Redis, MinIO, observability
- [Running](docs/running.md) - dev and production setup

## Services

| Service       | Stack            | Port | Description                                   |
| ------------- | ---------------- | ---- | --------------------------------------------- |
| auth          | Python / FastAPI | 4001 | JWT issuance, refresh, RBAC                   |
| wallet        | Python / FastAPI | 4002 | gRPC settlement interface                     |
| transactions  | NestJS           | 4003 | Transfers, top-ups, idempotency               |
| fraud         | NestJS (gRPC)    | \*   | Real-time fraud scoring on every transaction  |
| kyc           | NestJS           | 4004 | Document upload, tier management              |
| analytics     | NestJS           | 4005 | Spend insights, category budgets              |
| notifications | NestJS           | 4006 | Persistent notifications + SSE stream         |
| social        | NestJS           | 4007 | Contacts, money requests, bill splits         |
| webhook       | NestJS           | 4008 | User-registered webhooks + delivery log       |
| admin         | NestJS           | 4009 | Admin console (user management, fraud review) |
| audit         | NestJS           | 4010 | Immutable append-only audit log               |

\* fraud is gRPC-only, called internally by the transactions service.

## Running

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

### Admin User

Create an admin user in the auth service database.

```bash
docker exec -it mint-auth python /app/apps/auth/create_admin.py \
  --email admin@mint.dev \
  --password adminpass \
  --name "Admin User"
```

Migrations run automatically before each service starts. API docs are at `/api-docs` on every service.

## Observability

Every service ships OpenTelemetry traces to a local collector, stored in Tempo and visualised in Grafana at http://localhost:3000. Trace context is propagated across HTTP, gRPC, and Kafka so a single top-up request produces one trace spanning all downstream consumers.

![Grafana Tempo showing a distributed trace for a top-up request](.github/assets/grafana-traces.png)
