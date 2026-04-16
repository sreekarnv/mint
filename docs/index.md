# Mint

A production-style fintech platform built as a polyglot microservices monorepo. Covers authentication, multi-currency wallets, real-time payments, KYC, fraud detection, analytics, social features, webhooks, an admin console, and a tamper-proof audit log.

---

## What's Inside

**12 independently deployable services** communicating over HTTP, gRPC, and Kafka. Two are written in Python (FastAPI), nine in TypeScript (NestJS), plus a Next.js 15 web app.

| Layer | What's there |
|-------|-------------|
| **API gateway** | nginx — routing, rate limiting, SSE proxy |
| **Auth** | RSA-signed JWTs, JWKS endpoint, refresh tokens, RBAC |
| **Payments** | Idempotent transfers with a formal state machine |
| **Fraud** | Rules-based scoring engine, called synchronously on every transaction |
| **Wallets** | gRPC settlement interface with idempotent debit/credit |
| **KYC** | Document upload → tier promotion → spend limit enforcement |
| **Analytics** | Kafka-driven spend aggregation, category classification, budget alerts |
| **Social** | Contacts, money requests with expiry, bill splits |
| **Webhooks** | User-registered endpoints, HMAC-signed payloads, delivery retry |
| **Audit** | Immutable append-only log — PostgreSQL trigger prevents UPDATE/DELETE |
| **Observability** | End-to-end distributed traces across HTTP, gRPC, and Kafka |

---

## Key Design Properties

**Every transaction is safe to retry.** The transactions service accepts an `Idempotency-Key` header. Duplicate requests return the cached response from Redis rather than executing twice.

**Fraud scores every payment before any money moves.** The fraud service (gRPC-only) runs six rules in parallel and returns ALLOW / REVIEW / BLOCK. Blocked transactions never reach wallet settlement.

**KYC gates spend limits.** The kyc service exposes per-transaction, daily, and monthly caps via gRPC. Transactions that exceed the caller's tier are rejected before the fraud check.

**Audit trail is tamper-proof.** Every Kafka event from every service is written to an append-only PostgreSQL table. A database trigger rejects any UPDATE or DELETE.

**Traces span async boundaries.** OpenTelemetry trace context is forwarded in Kafka message headers via `KafkaTraceInterceptor`. A single transfer request produces one trace that spans fraud scoring, wallet debit/credit, analytics ingestion, notification delivery, and webhook dispatch.

**Database isolation.** Each service owns exactly one PostgreSQL database with its own credentials. No service can query another service's tables.

---

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

---

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
| Testing | Jest (NestJS), pytest + pytest-asyncio (Python) |
| CI | GitHub Actions |
