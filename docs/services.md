# Services

## Web - port 3000

Next.js 15 app serving both the user-facing product and the admin console. Routed through nginx — the user app is at `/`, the admin console at `/app-admin`.

**User pages**

| Route | Description |
|-------|-------------|
| `/` | Dashboard — wallet balance, recent activity |
| `/wallet` | Wallet details, balance chart, transaction limits |
| `/transactions` | Transaction history with filtering |
| `/analytics` | Spend by category, top merchants, monthly budgets |
| `/social` | Contacts, money requests, bill splits |
| `/notifications` | Activity feed (SSE-backed real-time updates) |
| `/verification` | KYC tier status and document upload |

**Admin pages** (requires `role=ADMIN` JWT)

| Route | Description |
|-------|-------------|
| `/app-admin` | User search, freeze/unfreeze, role management |
| `/app-admin/kyc` | KYC review queue and user lookup |
| `/app-admin/fraud` | Fraud case review queue |
| `/app-admin/transactions` | Transaction list, reverse, force-complete |
| `/app-admin/system` | Global transaction limit configuration |
| `/app-admin/audit` | Audit log viewer |

**Stack:** Next.js 15, React, TanStack Query, Tailwind CSS, Shadcn UI  
**Notes:** All API calls are proxied through nginx at `http://localhost`. `NEXT_PUBLIC_API_URL` sets the API base URL.

---

## Auth - port 4001

Handles user registration, login, JWT issuance, and RBAC. Built with FastAPI + SQLAlchemy, using [sreekarnv-fastauth](https://pypi.org/project/sreekarnv-fastauth/) for auth primitives.

**Key endpoints**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login, returns JWT |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Invalidate session |
| GET | `/.well-known/jwks.json` | Public key for JWT verification |

**Database:** `mint_auth` - users, roles, refresh tokens, JWKS  
**Kafka out:** `auth.events`  
**Notes:** RSA key pair at `./keys/` - mounted read-only in production. Email verification via SMTP (MailHog in dev).

---

## Wallet - port 4002, gRPC 50051

Manages user wallets and balance history. Exposes a gRPC interface for the transactions service to debit/credit funds atomically. Built with FastAPI + SQLAlchemy.

**Key endpoints**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/wallet/` | Get current balance |
| GET | `/api/v1/wallet/history` | Balance change history |
| POST | `/api/v1/wallet/freeze` | Freeze wallet (admin) |
| POST | `/api/v1/wallet/unfreeze` | Unfreeze wallet (admin) |

**gRPC methods:** `DebitWallet`, `CreditWallet`, `GetBalance`, `GetWallet`, `FreezeWallet`, `UnfreezeWallet`  
**Database:** `mint_wallet` - wallets, balance history  
**Kafka in:** `auth.events` (create wallet on signup), `transaction.events` (log changes)  
**Kafka out:** `wallet.events`  
**Notes:** Runs with `--workers 1` because the gRPC server binds inside the FastAPI lifespan.

---

## Transactions - port 4003

Core transaction engine. Validates, scores, and settles transfers and top-ups. Enforces idempotency and KYC limits.

**Key endpoints**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/transactions/transfer` | Transfer funds (idempotent) |
| POST | `/api/v1/transactions/topup` | Top up wallet |
| GET | `/api/v1/transactions/` | Transaction history |
| GET | `/api/v1/transactions/:id` | Get transaction |

**Database:** `mint_txns` - transactions, idempotency keys  
**gRPC clients:** fraud (score), kyc (limits), wallet (settle)  
**Kafka in:** `social.events` (accepted money request → auto-transfer)  
**Kafka out:** `transaction.events`  
**Notes:** Uses `Idempotency-Key` header; response cached in Redis for 24 h. State machine: PENDING → PROCESSING → COMPLETED / FAILED / CANCELLED / REVERSED.

---

## Fraud - gRPC only, port 50052

Rules-based fraud scoring engine. Called synchronously by transactions service before every settlement. No HTTP API.

**gRPC method:** `ScoreTransaction` → `{ decision: ALLOW|REVIEW|BLOCK, score: 0-100, rulesFired, reason }`

**Database:** `mint_fraud` - fraud cases, user transfer statistics  
**Notes:** Thresholds configured via `FRAUD_BLOCK_THRESHOLD` / `FRAUD_REVIEW_THRESHOLD` env vars. Blocked transactions never reach wallet settlement.

---

## KYC - port 4004, gRPC 50053

Identity verification tiers and document management. Enforces per-transaction and daily/monthly spend limits based on user tier.

**Key endpoints**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/kyc/` | Get KYC profile |
| GET | `/api/v1/kyc/limits` | Get tier limits |
| POST | `/api/v1/kyc/submit` | Submit documents |
| POST | `/api/v1/kyc/webhook` | Receive verification result (Persona) |

**gRPC methods:** `GetUserTier`, `GetLimits`, `GetProfile`, `ListPendingQueue`  
**Database:** `mint_kyc` - profiles, tiers, document metadata  
**Object storage:** MinIO bucket `mint-kyc-docs` (uploaded documents)  
**Kafka in:** `auth.events` (create profile on signup), `admin.events` (approve/reject KYC)  
**Kafka out:** `kyc.events`  
**Tiers:** UNVERIFIED → BASIC → VERIFIED. Tiers can be frozen by admin.

---

## Analytics - port 4005

Spend categorization and budget tracking. Powered entirely by Kafka events - no writes from HTTP clients.

**Key endpoints**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/analytics/insights` | Monthly spend by category |
| GET | `/api/v1/analytics/summary` | Transaction count and total spend |
| GET | `/api/v1/analytics/top-merchants` | Top merchants this month |
| GET | `/api/v1/analytics/budgets` | List budgets |
| POST | `/api/v1/analytics/budgets` | Create / update budget |
| DELETE | `/api/v1/analytics/budgets/:id` | Delete budget |

**Database:** `mint_analytics` - spend events, monthly aggregates, budgets  
**Kafka in:** `transaction.events` (completed non-topup transactions)  
**Kafka out:** `analytics.events` (budget threshold alerts)  
**Categories:** FOOD, TRANSPORT, ENTERTAINMENT, UTILITIES, OTHER — auto-classified from merchant name and description.

---

## Notifications - port 4006

Persistent in-app notifications with real-time delivery via Server-Sent Events.

**Key endpoints**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/notifications/` | List recent notifications |
| POST | `/api/v1/notifications/:id/read` | Mark as read |
| POST | `/api/v1/notifications/read-all` | Mark all as read |
| GET | `/api/v1/notifications/unread-count` | Unread count |
| GET | `/api/v1/notifications/stream` | SSE stream (real-time) |

**Database:** `mint_notifications` - notifications, read status  
**Kafka in:** all topics (`auth`, `wallet`, `transaction`, `kyc`, `social`, `analytics`, `webhook.events`)  
**Notes:** nginx disables proxy buffering for the SSE endpoint so events stream immediately.

---

## Social - port 4007

Contacts, money requests (with expiry), and bill splits.

**Key endpoints**

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/v1/social/contacts` | List / add contacts |
| DELETE | `/api/v1/social/contacts/:id` | Remove contact |
| GET/POST | `/api/v1/social/requests` | List / create money requests |
| POST | `/api/v1/social/requests/:id/accept` | Accept request |
| POST | `/api/v1/social/requests/:id/decline` | Decline request |
| DELETE | `/api/v1/social/requests/:id` | Cancel request |
| GET/POST | `/api/v1/social/splits` | List / create bill splits |
| POST | `/api/v1/social/splits/:id/pay` | Pay participant share |

**Database:** `mint_social` - contacts, money requests, splits, split participants  
**Kafka out:** `social.events`  
**Queue:** BullMQ (Redis) - scheduled jobs for request expiry (default 7 days).  
**Notes:** Accepting a money request publishes an event; the transactions service auto-initiates the transfer.

---

## Webhook - port 4008

User-registered webhooks with signed delivery and retry.

**Key endpoints**

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/v1/webhooks/` | List / register endpoints |
| GET/PATCH/DELETE | `/api/v1/webhooks/:id` | Manage endpoint |
| GET | `/api/v1/webhooks/:id/deliveries` | Delivery log |

**Database:** `mint_webhook` - endpoints (URL, subscribed events, signing key), deliveries  
**Kafka in:** `transaction.events`, `wallet.events`, `social.events`, `analytics.events`  
**Queue:** BullMQ (Redis) - delivery with exponential backoff retry.  
**Notes:** Payloads are HMAC-signed. Delivery log captures HTTP status and response body.

---

## Admin - port 4009

Privileged operational API. All endpoints require `role=ADMIN` in the JWT. Backs the admin console at `/app-admin`.

**Key endpoints**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users/search` | Search users by email |
| GET | `/admin/users/:id` | Get user profile (cross-service) |
| POST | `/admin/users/:id/freeze` | Freeze account + wallet |
| POST | `/admin/users/:id/unfreeze` | Unfreeze account |
| PATCH | `/admin/users/:id/role` | Update user role |
| GET | `/admin/kyc/queue` | Pending KYC review queue |
| GET | `/admin/kyc/user/:userId` | Get KYC profile by user |
| POST | `/admin/kyc/:profileId/approve` | Approve KYC submission |
| POST | `/admin/kyc/:profileId/reject` | Reject KYC submission |
| GET | `/admin/fraud/queue` | Pending fraud review queue |
| POST | `/admin/fraud/:caseId/approve` | Approve flagged transaction |
| POST | `/admin/fraud/:caseId/block` | Block flagged transaction |
| GET | `/admin/transactions` | List transactions (filterable) |
| POST | `/admin/transactions/:id/reverse` | Reverse a transaction |
| POST | `/admin/transactions/:id/force-complete` | Force-complete a stuck transaction |
| GET/PATCH | `/admin/system/limits` | View and update global limits |

**Kafka out:** `admin.events` (every action logged and consumed by kyc + audit)  
**Notes:** KYC approve/reject flow: admin emits a Kafka event → KYC service consumes it and updates the profile/tier.

---

## Audit - port 4010

Immutable, append-only audit log. Every event from every service lands here.

**Key endpoints**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/internal/audit` | Query log (actorId, action, date range, pagination) |

**Database:** `mint_audit` - append-only log table (PostgreSQL trigger prevents UPDATE/DELETE)  
**Kafka in:** all topics  
**Notes:** Preserves OpenTelemetry trace ID for cross-service correlation. Indexed on actorId, action, and createdAt.
