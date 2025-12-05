# Configuration Guide

This guide covers advanced configuration options for Mint services.

## Environment Variables

Each service uses environment variables for configuration. All settings can be customized via `.env.docker` (production) or `.env.local` (development) files.

---

## Auth Service Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production`, `development` |
| `PORT` | Service port | `4001` |
| `DATABASE_URL` | MongoDB connection string | `mongodb://root:example@mongodb:27017/mint_auth?authSource=admin` |
| `RABBITMQ_URL` | RabbitMQ connection string | `amqp://guest:guest@rabbitmq:5672` |

### JWT Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_ISS` | JWT issuer | `"auth-service"` |
| `JWT_AUD` | JWT audience (space-separated) | `"wallet-service transaction-service notification-service"` |

### CORS Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `*` |

### Rate Limiting

| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_WINDOW_MS` | Time window in milliseconds | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

---

## Wallet Service Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Service port | `4003` |
| `DATABASE_URL` | MongoDB connection string | `mongodb://root:example@mongodb:27017/mint_wallet?authSource=admin` |
| `RABBITMQ_URL` | RabbitMQ connection string | `amqp://guest:guest@rabbitmq:5672` |
| `JWKS_ENDPOINT` | Auth service JWKS URL | `http://auth:4001/.well-known/jwks.json` |

### JWT Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_ISS` | Expected JWT issuer | `"auth-service"` |
| `JWT_AUD` | Expected JWT audience | `"wallet-service"` |

---

## Transactions Service Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Service port | `4004` |
| `DATABASE_URL` | MongoDB connection string | `mongodb://root:example@mongodb:27017/mint_txns?authSource=admin` |
| `RABBITMQ_URL` | RabbitMQ connection string | `amqp://guest:guest@rabbitmq:5672` |
| `JWKS_ENDPOINT` | Auth service JWKS URL | `http://auth:4001/.well-known/jwks.json` |

### JWT Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_ISS` | Expected JWT issuer | `"auth-service"` |
| `JWT_AUD` | Expected JWT audience | `"transaction-service"` |

---

## Notifications Service Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Service port | `4002` |
| `RABBITMQ_URL` | RabbitMQ connection string | `amqp://guest:guest@rabbitmq:5672` |

### SMTP Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `sandbox.smtp.mailtrap.io` |
| `SMTP_PORT` | SMTP server port | `2525` |
| `SMTP_USER` | SMTP username | `your-mailtrap-user` |
| `SMTP_PASS` | SMTP password | `your-mailtrap-password` |

!!! tip "Email Testing"
    For development, use [Mailtrap](https://mailtrap.io/) to test email notifications without sending real emails.

---

## Docker Environment

### Development vs Production

**Development** (`docker-compose.dev.yml`):
- Hot-reloading enabled
- Volume mounts for source code
- Debug logging
- Service ports exposed

**Production** (`docker-compose.yml`):
- Optimized builds
- No volume mounts
- Production logging
- Only gateway port exposed

### Service Dependencies

Services start in this order:

1. **Infrastructure** (MongoDB, RabbitMQ)
2. **Auth Service** (provides JWT keys)
3. **Wallet, Transactions, Notifications** (consume events)
4. **NGINX Gateway** (routes to all services)

---

## NGINX Gateway Configuration

The NGINX gateway is configured in `nginx/nginx.conf`:

### Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req zone=api_limit burst=20 nodelay;
```

- **Rate**: 10 requests/second
- **Burst**: Allow up to 20 requests in a burst
- **Zone Size**: 10MB (stores ~160K IP addresses)

### Routes

| Path | Backend Service | Port |
|------|----------------|------|
| `/api/v1/auth/*` | Auth Service | 4001 |
| `/api/v1/users/*` | Auth Service | 4001 |
| `/api/v1/wallet/*` | Wallet Service | 4003 |
| `/api/v1/transactions/*` | Transactions Service | 4004 |
| `/.well-known/*` | Auth Service | 4001 |

### Timeouts

- **Proxy Connect Timeout**: 60s
- **Proxy Send Timeout**: 60s
- **Proxy Read Timeout**: 60s

---

## MongoDB Configuration

### Database Names

| Service | Database Name |
|---------|---------------|
| Auth | `mint_auth` |
| Wallet | `mint_wallet` |
| Transactions | `mint_txns` |

### Connection String Format

```
mongodb://<username>:<password>@<host>:<port>/<database>?authSource=admin
```

**Example:**
```
mongodb://root:example@mongodb:27017/mint_auth?authSource=admin
```

### Indexes

Each service automatically creates indexes on startup:

- **Auth**: `users.email` (unique)
- **Wallet**: `wallets.userId` (unique)
- **Transactions**: `transactions.userId`, `transactions.type`

---

## RabbitMQ Configuration

### Exchanges

| Exchange | Type | Description |
|----------|------|-------------|
| `auth.events` | topic | User and auth events |
| `transaction.events` | topic | Transaction lifecycle events |

### Queue Configuration

All queues are:
- **Durable**: Survive broker restarts
- **Auto-delete**: No
- **Exclusive**: No

### Connection Settings

Default connection string:
```
amqp://guest:guest@rabbitmq:5672
```

!!! warning "Production Security"
    Change the default RabbitMQ credentials in production!

---

## Security Best Practices

### Production Checklist

- [ ] Change MongoDB credentials
- [ ] Change RabbitMQ credentials
- [ ] Use strong JWT secrets
- [ ] Configure real SMTP server
- [ ] Set proper CORS origins
- [ ] Enable HTTPS in NGINX
- [ ] Use environment-specific `.env` files
- [ ] Never commit `.env` files to Git
- [ ] Use Docker secrets for sensitive data
- [ ] Enable MongoDB authentication
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerts

### Cookie Security

In production, ensure cookies are:
- `HttpOnly`: Yes (prevent XSS)
- `Secure`: Yes (HTTPS only)
- `SameSite`: Strict (CSRF protection)
- `MaxAge`: 7 days (604800 seconds)

---

## Logging Configuration

### Log Levels

Set `LOG_LEVEL` in environment:

- `error`: Only errors
- `warn`: Warnings and errors
- `info`: General information (default)
- `debug`: Detailed debugging

### Winston Logger

Each service uses Winston for structured logging:

```typescript
{
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
}
```

---

## Performance Tuning

### MongoDB

- Enable connection pooling
- Create indexes for frequent queries
- Use lean queries when possible
- Limit result sets with pagination

### RabbitMQ

- Use prefetch count to limit concurrent messages
- Enable message acknowledgments
- Set appropriate TTL for messages
- Monitor queue depths

### NGINX

- Adjust worker processes based on CPU cores
- Enable keepalive connections
- Configure buffer sizes appropriately
- Enable gzip compression

---

## Monitoring

### Health Checks

All services expose `/health` endpoints:

```bash
curl http://localhost/api/v1/auth/health
curl http://localhost/api/v1/wallet/health  # Through gateway
curl http://localhost/api/v1/transactions/health
```

### RabbitMQ Monitoring

Access the management UI at http://localhost:15672

Monitor:
- Queue depths
- Message rates
- Consumer status
- Connection health

### Docker Health Checks

Each service has built-in Docker health checks:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## Advanced Topics

### Custom Environment Files

Create service-specific environment files:

```bash
# Local development
auth/.env.local

# Docker development
auth/.env.docker

# Production
auth/.env.production
```

### Override Docker Compose

Create `docker-compose.override.yml` for local customizations:

```yaml
services:
  auth:
    ports:
      - "4001:4001"  # Expose auth port locally
    environment:
      LOG_LEVEL: debug
```

### Volume Mounts

In development, mount source code for hot-reloading:

```yaml
volumes:
  - ./auth/src:/app/src
  - ./auth/tsconfig.json:/app/tsconfig.json:ro
  - /app/node_modules
```

---

## Next Steps

- [Development Guide](../development.md) - Local development setup
- [Deployment Guide](../deployment.md) - Production deployment
- [Troubleshooting](../troubleshooting.md) - Common issues and solutions
