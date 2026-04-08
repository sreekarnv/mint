# Mint

A production-style fintech platform built as a polyglot microservices monorepo. Covers authentication, multi-currency wallets, payments, KYC, fraud detection, analytics, social features, webhooks, an admin console, and a tamper-proof audit log.

## Services

| Service | Stack | Port | Description |
|---------|-------|------|-------------|
| auth | Python / FastAPI | 4001 | JWT issuance, refresh, RBAC |
| wallet | Python / FastAPI | 4002 | Balances, gRPC settlement interface |
| transactions | NestJS | 4003 | Transfers, top-ups, idempotency |
| fraud | NestJS (gRPC only) | 50052 | Real-time fraud scoring |
| kyc | NestJS | 4004 | Document upload, tier management |
| analytics | NestJS | 4005 | Spend insights, category budgets |
| notifications | NestJS | 4006 | Persistent notifications + SSE stream |
| social | NestJS | 4007 | Contacts, money requests, bill splits |
| webhook | NestJS | 4008 | User-registered webhooks + delivery log |
| admin | NestJS | 4009 | Admin console — user management, fraud review |
| audit | NestJS | 4010 | Immutable append-only audit log |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API services | NestJS (TypeScript), FastAPI (Python) |
| Databases | PostgreSQL (one DB per service), Prisma, Alembic |
| Async messaging | Apache Kafka |
| Internal RPC | gRPC |
| Cache / queues | Redis, BullMQ |
| Object storage | MinIO (S3-compatible) |
| API gateway | nginx |
| Observability | OpenTelemetry, Grafana Tempo, Grafana |
| Containerisation | Docker, Docker Compose |
