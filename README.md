# Mint

A production-style fintech platform built as a polyglot microservices monorepo. Covers authentication, wallet management, payments, KYC, fraud detection, analytics, social features, webhooks, an admin console, and a tamper-proof audit log.

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

> Looking for the original version built with Express, MongoDB, RabbitMQ, and React? See the [v1 branch](https://github.com/sreekarnv/mint/tree/v1).

## Frontend

A Next.js 15 app serves both the user-facing product and the admin console through the same nginx gateway.

<table>
  <tr>
    <td align="center" width="50%">
      <img src=".github/assets/dashboard-user.png" alt="User dashboard showing wallet balance, recent transactions, and quick actions" />
      <br /><sub><b>Dashboard</b> — wallet balance, recent activity, quick deposit &amp; send</sub>
    </td>
    <td align="center" width="50%">
      <img src=".github/assets/analytics-user.png" alt="Analytics page showing spending by category, breakdown chart, and monthly budgets" />
      <br /><sub><b>Analytics</b> — category spend, breakdown, top merchants, budget tracking</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src=".github/assets/notifications-user.png" alt="Notifications feed showing transaction alerts and verification events" />
      <br /><sub><b>Notifications</b> — real-time activity feed via SSE</sub>
    </td>
    <td align="center" width="50%">
      <img src=".github/assets/kyc-verification-user.png" alt="Identity verification page showing tier progression and active limits" />
      <br /><sub><b>Identity Verification</b> — tier progression, document upload, active limits</sub>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <img src=".github/assets/kyc-verification-admin.png" alt="Admin KYC management page showing pending review queue and profile review panel" width="75%" />
      <br /><sub><b>Admin — KYC Management</b> — pending review queue, document inspection, approve / reject</sub>
    </td>
  </tr>
</table>

## Services

| Service       | Stack              | Port | Description                                  |
| ------------- | ------------------ | ---- | -------------------------------------------- |
| web           | Next.js 15         | 3000 | User app and admin console                   |
| auth          | Python / FastAPI   | 4001 | JWT issuance, refresh, RBAC                  |
| wallet        | Python / FastAPI   | 4002 | Balances, gRPC settlement interface          |
| transactions  | NestJS             | 4003 | Transfers, top-ups, idempotency              |
| fraud         | NestJS (gRPC only) | —    | Real-time fraud scoring on every transaction |
| kyc           | NestJS             | 4004 | Document upload, tier management             |
| analytics     | NestJS             | 4005 | Spend insights, category budgets             |
| notifications | NestJS             | 4006 | Persistent notifications + SSE stream        |
| social        | NestJS             | 4007 | Contacts, money requests, bill splits        |
| webhook       | NestJS             | 4008 | User-registered webhooks + delivery log      |
| admin         | NestJS             | 4009 | Admin console API                            |
| audit         | NestJS             | 4010 | Immutable append-only audit log              |

## Running

```bash
# Generate RSA keys (first time only)
sh scripts/generate-keys.sh

# Start everything
docker compose -f docker-compose.dev.yml up -d --build
```

The app is at **http://localhost**. The admin console is at **http://localhost/app-admin**.

Create an admin user:

```bash
docker exec -it mint-auth uv run python /app/apps/auth/src/create_admin.py \
  --email admin@mint.dev \
  --password adminpass \
  --name "Admin User"
```

Migrations run automatically on startup. Swagger UI is at `/api-docs` on every service.

## Observability

Every service exports OpenTelemetry traces to a local collector. Trace context is propagated across HTTP, gRPC, and Kafka — a single transfer produces one trace spanning fraud scoring, wallet settlement, analytics ingestion, notification delivery, and webhook dispatch.

Grafana is at **http://localhost:4000**.

![Grafana Tempo showing a distributed trace for a top-up request](.github/assets/grafana-traces.png)

## Docs

Full documentation at [sreekarnv.github.io/mint](https://sreekarnv.github.io/mint).

- [Architecture](https://sreekarnv.github.io/mint/architecture/) — service map, communication patterns, auth flow, transfer flow
- [Design Decisions](https://sreekarnv.github.io/mint/design-decisions/) — polyglot rationale, gRPC vs Kafka, idempotency, fraud scoring, audit immutability
- [Services](https://sreekarnv.github.io/mint/services/) — endpoints, databases, Kafka topics per service
- [Infrastructure](https://sreekarnv.github.io/mint/infrastructure/) — nginx, Kafka, Postgres, Redis, MinIO, observability
- [Running](https://sreekarnv.github.io/mint/running/) — dev and production setup
