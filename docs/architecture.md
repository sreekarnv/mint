# Architecture Overview

## Table of Contents

- [System Architecture](#system-architecture)
- [Services](#services)
- [Communication Patterns](#communication-patterns)
- [Database Architecture](#database-architecture)
- [Security Architecture](#security-architecture)
- [Scalability Considerations](#scalability-considerations)

---

## System Architecture

Mint follows a **microservices architecture** with **event-driven communication** using RabbitMQ. Each service is independently deployable, scalable, and maintains its own database following the "Database per Service" pattern.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NGINX API Gateway (Port 80)                  │
│                  Rate Limiting │ Load Balancing                  │
└─────────────────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
    ┌────▼────┐          ┌──────▼───────┐      ┌───────▼────────┐
    │  Auth   │          │  Wallet      │      │ Transactions   │
    │ Service │          │  Service     │      │   Service      │
    │:4001    │          │  :4003       │      │   :4004        │
    └────┬────┘          └──────┬───────┘      └───────┬────────┘
         │                      │                      │
         │    ┌─────────────────┼──────────────────────┤
         │    │                 │                      │
    ┌────▼────▼─────────────────▼──────────────────────▼────────┐
    │              RabbitMQ Message Broker (:5672)               │
    │         Exchanges: auth.events, transaction.events         │
    └───────────────────────────┬────────────────────────────────┘
                                │
                        ┌───────▼────────┐
                        │ Notifications  │
                        │    Service     │
                        │    :4002       │
                        └────────────────┘

         ┌──────────────────────────────────────────┐
         │    MongoDB (Port 27017)                  │
         │  - auth_db (Users)                       │
         │  - wallet_db (Wallets)                   │
         │  - transactions_db (Transactions)        │
         └──────────────────────────────────────────┘
```

### Communication Patterns

1. **Synchronous (HTTP/REST)**: Client → NGINX → Microservices
2. **Asynchronous (Events)**: Service → RabbitMQ → Consumer Services
3. **Service-to-Service**: Via RabbitMQ events (no direct HTTP calls between services)

---

## Services

### 🔐 Auth Service

**Port**: 4001
**Database**: `auth_db`

#### Responsibilities
- User registration and authentication
- JWT token generation and validation
- JWKS endpoint for public key distribution
- User profile management
- Session management

#### Tech Stack
- **Express.js** - Web framework
- **MongoDB/Mongoose** - Database
- **Argon2** - Password hashing
- **Jose** - JWT handling with RS256
- **Zod** - Request validation
- **RabbitMQ** - Event publishing

#### Key Features
- RS256 asymmetric JWT encryption
- HTTP-only cookie sessions
- JWKS endpoint for key rotation
- Secure password hashing with Argon2
- User search functionality

#### Events Published
- `user.signup` - When a new user registers

---

### 💰 Wallet Service

**Port**: 4003
**Database**: `wallet_db`

#### Responsibilities
- Wallet creation for new users
- Balance management
- Transaction application to wallets
- Wallet history tracking
- Balance integrity maintenance

#### Tech Stack
- **Express.js** - Web framework
- **MongoDB/Mongoose** - Database with optimistic locking
- **RabbitMQ** - Event consumption & publishing
- **Jose** - JWT verification

#### Key Features
- Automatic wallet creation on user signup
- Optimistic locking for concurrent transactions
- Event-driven balance updates
- Automatic rollback on failed transactions
- Balance consistency guarantees

#### Events Consumed
- `user.signup` - Creates wallet with initial balance
- `transaction.completed` - Updates wallet balances
- `transaction.failed` - Reverts wallet changes

#### Events Published
- `wallet.transactionFinalized` - Confirms transaction completion

---

### 🔁 Transactions Service

**Port**: 4004
**Database**: `transactions_db`

#### Responsibilities
- Transaction creation (top-up, transfer)
- Transaction state management
- Transaction validation
- Transaction history
- Orchestrating transaction workflow

#### Tech Stack
- **Express.js** - Web framework
- **MongoDB/Mongoose** - Database
- **RabbitMQ** - Event consumption & publishing
- **Zod** - Request validation
- **Jose** - JWT verification

#### Key Features
- Multi-state transaction lifecycle (PENDING → PROCESSING → COMPLETED/FAILED)
- Balance validation before transfers
- Idempotency support
- Event-driven workflow orchestration
- Automatic failure handling

#### Transaction Types
1. **Top-Up**: Add funds to user wallet
2. **Transfer**: Send funds between users

#### Events Consumed
- `transaction.created` - Begins processing
- `wallet.transactionFinalized` - Finalizes state

#### Events Published
- `transaction.created` - Initiates workflow
- `transaction.completed` - Success notification
- `transaction.failed` - Failure notification

---

### 📨 Notifications Service

**Port**: 4002
**Database**: None (stateless)

#### Responsibilities
- Welcome email on user registration
- Transaction success notifications
- Transaction failure alerts
- Email template management

#### Tech Stack
- **Express.js** - Web framework
- **RabbitMQ** - Event consumption
- **Nodemailer** - Email sending
- **Winston** - Logging

#### Key Features
- Event-driven email delivery
- Template-based emails
- SMTP integration
- Async processing (doesn't block transactions)

#### Events Consumed
- `user.signup` - Sends welcome email
- `transaction.completed` - Sends success notification
- `transaction.failed` - Sends failure alert

---

### 🔗 API Gateway (NGINX)

**Port**: 80

#### Responsibilities
- Single entry point for all client requests
- Request routing to services
- Rate limiting
- Load balancing
- Health monitoring

#### Key Features
- Rate limiting: 10 req/s, burst 20
- Keepalive connections
- Automatic backend failover
- Health check monitoring
- Request/response buffering
- Graceful error handling

#### Route Configuration
- `/api/v1/auth/*` → Auth Service (4001)
- `/api/v1/users/*` → Auth Service (4001)
- `/api/v1/wallet/*` → Wallet Service (4003)
- `/api/v1/transactions/*` → Transactions Service (4004)
- `/.well-known/*` → Auth Service (4001)
- `/health` → Gateway health check

---

## Communication Patterns

### 1. Synchronous Communication (REST API)

Used for client-facing operations that require immediate responses.

```
Client → NGINX Gateway → Service → Response
```

**Characteristics:**
- HTTP/REST protocol
- Request-response pattern
- Immediate feedback to client
- Used for queries and commands

**Examples:**
- User login
- Get wallet balance
- Create transaction
- Search users

### 2. Asynchronous Communication (Events)

Used for inter-service communication and decoupling.

```
Service → RabbitMQ → Consumer Service(s)
```

**Characteristics:**
- Publish-subscribe pattern
- Eventual consistency
- Loose coupling
- Resilient to service failures
- Enables multiple consumers

**Examples:**
- User signup triggers wallet creation and welcome email
- Transaction completion updates wallet and sends notification
- Transaction failure triggers rollback

---

## Database Architecture

### Database per Service Pattern

Each service owns its data and database:

| Service | Database | Collections |
|---------|----------|-------------|
| Auth | `auth_db` | `users` |
| Wallet | `wallet_db` | `wallets` |
| Transactions | `transactions_db` | `transactions` |
| Notifications | None | Stateless |

### Benefits
- **Loose coupling**: Services are independent
- **Technology flexibility**: Each service can use appropriate database
- **Scalability**: Scale databases independently
- **Fault isolation**: Database issues don't cascade

### Challenges
- **Data consistency**: Eventual consistency via events
- **Joins**: Cannot join across services (denormalization needed)
- **Transactions**: Distributed transactions require Saga pattern

### Data Consistency

The system uses **eventual consistency** through events:

1. **Optimistic Locking**: Wallet service uses version fields
2. **Event Ordering**: RabbitMQ preserves message order per queue
3. **Idempotency**: Events can be replayed safely
4. **Compensation**: Failed transactions trigger reversal events

---

## Security Architecture

### Authentication Flow

```
1. User → POST /api/v1/auth/signup
2. Auth Service → Hash password with Argon2
3. Auth Service → Store user in auth_db
4. Auth Service → Publish user.signup event
5. Auth Service → Return user info

Login:
1. User → POST /api/v1/auth/login
2. Auth Service → Verify password with Argon2
3. Auth Service → Generate JWT (RS256)
4. Auth Service → Set HTTP-only cookie
5. Auth Service → Return user info
```

### Authorization Flow

```
1. Client → Request with cookie
2. NGINX → Forward to service
3. Service → Extract JWT from cookie
4. Service → Fetch public key from JWKS endpoint
5. Service → Verify JWT signature
6. Service → Validate issuer, audience, expiry
7. Service → Extract user ID from claims
8. Service → Process request
```

### Security Features

1. **Password Security**
   - Argon2 hashing (memory-hard, resistant to GPU attacks)
   - No plaintext password storage
   - Secure random salts

2. **JWT Security**
   - RS256 asymmetric encryption
   - Private key only on auth service
   - Public key distribution via JWKS
   - Short expiration (7 days)
   - Issuer and audience validation

3. **Cookie Security**
   - HTTP-only (no JavaScript access)
   - Secure flag in production
   - SameSite protection
   - Signed cookies

4. **API Security**
   - Rate limiting at gateway
   - Request validation with Zod
   - Error messages don't leak info
   - CORS configuration

---

## Scalability Considerations

### Horizontal Scaling

Each service can be scaled independently:

```yaml
# docker-compose.yml
auth:
  replicas: 3  # Scale auth service

wallet:
  replicas: 5  # Scale wallet service more if needed
```

### Database Scaling

1. **Read Replicas**: Add MongoDB replicas for read-heavy services
2. **Sharding**: Shard by userId for large-scale deployments
3. **Caching**: Add Redis for frequently accessed data (future)

### Message Queue Scaling

1. **Multiple Consumers**: Scale consumers horizontally
2. **Queue Partitioning**: Use routing keys for load distribution
3. **Dead Letter Queues**: Handle failures gracefully (future)

### Load Balancing

NGINX provides:
- Round-robin load balancing
- Health check-based routing
- Keepalive connection pooling
- Automatic failover

### Bottlenecks to Monitor

1. **Database Connections**: Monitor connection pool usage
2. **RabbitMQ Queue Depth**: Watch for consumer lag
3. **JWT Verification**: Cache JWKS keys
4. **Network I/O**: Monitor service-to-service latency

---

## System Qualities

### Reliability
- Automatic transaction rollback on failures
- Event replay capability
- Health monitoring for all services
- Graceful degradation

### Availability
- Stateless services (easy to replicate)
- No single point of failure (with scaling)
- Health checks and automatic restart
- Circuit breaker pattern (via NGINX retry)

### Maintainability
- Clear service boundaries
- Consistent code structure across services
- Comprehensive logging
- Type-safe with TypeScript

### Performance
- Async processing for non-critical paths
- Connection pooling
- Efficient database queries
- Rate limiting prevents overload

---

## Design Decisions

### Why RabbitMQ?
- Reliable message delivery
- Message persistence
- Flexible routing
- Wide ecosystem support

### Why MongoDB?
- Schema flexibility
- JSON-native (matches TypeScript objects)
- Good performance for read-heavy workloads
- Horizontal scaling support

### Why RS256 JWT?
- More secure than HS256 (asymmetric)
- Public key can be distributed safely
- Enables key rotation
- Industry standard

### Why NGINX?
- Battle-tested reverse proxy
- Excellent performance
- Built-in rate limiting
- Comprehensive configuration options

---

## Related Documentation

- [Event Architecture](events.md) - Detailed event flows
- [Deployment Guide](deployment.md) - Production deployment
- [Development Guide](development.md) - Local development
- [API Reference](api/) - API documentation
