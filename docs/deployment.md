# Deployment Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [JWT Keys Generation](#jwt-keys-generation)
- [Docker Deployment](#docker-deployment)
- [Environment Configuration](#environment-configuration)
- [Service Ports](#service-ports)
- [Health Checks](#health-checks)
- [Production Considerations](#production-considerations)
- [Scaling](#scaling)

---

## Prerequisites

Before deploying Mint, ensure you have the following installed:

### Required Software

| Software | Minimum Version | Purpose |
|----------|----------------|---------|
| **Docker** | 20.10+ | Container runtime |
| **Docker Compose** | 2.0+ | Multi-container orchestration |
| **Git** | 2.0+ | Version control |

### Installation Links

- **Docker**: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
- **Docker Compose**: [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/)
- **Git**: [https://git-scm.com/downloads](https://git-scm.com/downloads)

### System Requirements

**Minimum**:
- CPU: 2 cores
- RAM: 4GB
- Disk: 10GB

**Recommended**:
- CPU: 4+ cores
- RAM: 8GB+
- Disk: 20GB+

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mint.git
cd mint
```

### 2. Create Environment Files

Each service requires an `.env.docker` file. Create them from examples:

```bash
# Auth Service
cp auth/.env.example auth/.env.docker

# Wallet Service
cp wallet/.env.example wallet/.env.docker

# Transactions Service
cp transactions/.env.example transactions/.env.docker

# Notifications Service
cp notifications/.env.example notifications/.env.docker
```

### 3. Configure Environment Variables

Edit each `.env.docker` file according to the [Environment Configuration](#environment-configuration) section below.

---

## JWT Keys Generation

The auth service requires RSA key pair for JWT signing.

### Generate Keys

```bash
cd auth
mkdir -p keys
cd keys

# Generate private key (2048-bit RSA)
openssl genrsa -out private_key.pem 2048

# Extract public key
openssl rsa -in private_key.pem -pubout -out public_key.pem

cd ../..
```

### Verify Keys

```bash
# Check private key
openssl rsa -in auth/keys/private_key.pem -check

# View public key
cat auth/keys/public_key.pem
```

### Key Security

**Important**:
- Never commit `private_key.pem` to version control
- Keep `private_key.pem` secure (only auth service needs it)
- `public_key.pem` can be shared (distributed via JWKS endpoint)
- Consider using secrets management in production (e.g., Vault, AWS Secrets Manager)

---

## Docker Deployment

### Production Mode

Start all services in production mode:

```bash
docker compose up --build
```

**Features**:
- Optimized builds
- No hot-reload
- Production environment variables
- Persistent volumes

### Development Mode

Start with hot-reloading for development:

```bash
docker compose -f docker-compose.dev.yml up --build
```

**Features**:
- Source code mounted as volumes
- Hot-reload on file changes
- Debug logging enabled
- Development environment variables

### Run in Background

```bash
# Production
docker compose up -d --build

# Development
docker compose -f docker-compose.dev.yml up -d --build
```

### Stop Services

```bash
# Stop containers (keeps data)
docker compose down

# Stop and remove volumes (deletes data)
docker compose down -v
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f auth

# Last 100 lines
docker compose logs --tail=100 wallet

# Follow logs from a specific time
docker compose logs --since 10m transactions
```

---

## Environment Configuration

### Auth Service (`.env.docker`)

```env
# Server
PORT=4001
NODE_ENV=production

# Database
DATABASE_URL=mongodb://root:example@mongodb:27017/auth_db?authSource=admin

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# JWT (RS256)
JWT_PRIVATE_KEY_PATH=/app/keys/private_key.pem
JWT_PUBLIC_KEY_PATH=/app/keys/public_key.pem
JWT_ISSUER=mint-auth-service
JWT_AUDIENCE=mint-api
JWT_EXPIRES_IN=7d

# Cookie
COOKIE_SECRET=CHANGE_THIS_IN_PRODUCTION_USE_LONG_RANDOM_STRING
COOKIE_NAME=mint_session
COOKIE_DOMAIN=localhost
COOKIE_MAX_AGE=604800000

# CORS
CORS_ORIGIN=http://localhost
```

**Security Notes**:
- Change `COOKIE_SECRET` to a strong random string (32+ characters)
- In production, set `COOKIE_DOMAIN` to your domain
- Use HTTPS in production (update CORS_ORIGIN)

---

### Wallet Service (`.env.docker`)

```env
# Server
PORT=4003
NODE_ENV=production

# Database
DATABASE_URL=mongodb://root:example@mongodb:27017/wallet_db?authSource=admin

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# JWT
JWT_ISSUER=mint-auth-service
JWT_AUDIENCE=mint-api
JWKS_URI=http://auth:4001/.well-known/jwks.json

# Wallet Configuration
INITIAL_WALLET_BALANCE=0
```

**Configuration Options**:
- `INITIAL_WALLET_BALANCE`: Default balance for new wallets (e.g., promotional credit)
- `JWKS_URI`: Must point to auth service JWKS endpoint

---

### Transactions Service (`.env.docker`)

```env
# Server
PORT=4004
NODE_ENV=production

# Database
DATABASE_URL=mongodb://root:example@mongodb:27017/transactions_db?authSource=admin

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# JWT
JWT_ISSUER=mint-auth-service
JWT_AUDIENCE=mint-api
JWKS_URI=http://auth:4001/.well-known/jwks.json
```

---

### Notifications Service (`.env.docker`)

```env
# Server
PORT=4002
NODE_ENV=production

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@mint.com
EMAIL_FROM_NAME=Mint Wallet
```

**Email Configuration**:

For **Gmail**:
1. Enable 2FA on your Google account
2. Generate App Password: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use App Password as `SMTP_PASS`

For **Other Providers**:
- **SendGrid**: `SMTP_HOST=smtp.sendgrid.net`, `SMTP_PORT=587`
- **Mailgun**: `SMTP_HOST=smtp.mailgun.org`, `SMTP_PORT=587`
- **AWS SES**: `SMTP_HOST=email-smtp.region.amazonaws.com`, `SMTP_PORT=587`

---

## Service Ports

### Internal Ports (Container-to-Container)

| Service | Port | Protocol | Access |
|---------|------|----------|--------|
| Auth | 4001 | HTTP | Internal |
| Notifications | 4002 | HTTP | Internal |
| Wallet | 4003 | HTTP | Internal |
| Transactions | 4004 | HTTP | Internal |
| MongoDB | 27017 | TCP | Internal |
| RabbitMQ | 5672 | AMQP | Internal |

### External Ports (Host Access)

| Service | Port | Access | Purpose |
|---------|------|--------|---------|
| NGINX Gateway | 80 | Public | API Gateway |
| RabbitMQ Management | 15672 | Admin | Queue monitoring |
| MongoDB | 27017 | Admin | Database access |

### Port Mapping

In `docker-compose.yml`:

```yaml
services:
  nginx:
    ports:
      - "80:80"  # Gateway

  rabbitmq:
    ports:
      - "5672:5672"    # AMQP
      - "15672:15672"  # Management UI

  mongodb:
    ports:
      - "27017:27017"  # Database
```

### Changing Ports

To change the gateway port (e.g., avoid conflicts):

```yaml
nginx:
  ports:
    - "8080:80"  # Access at http://localhost:8080
```

---

## Health Checks

### Verify Deployment

After starting services, verify health:

```bash
# Gateway health
curl http://localhost/health

# Auth service
curl http://localhost/api/v1/auth/health

# Check all containers
docker compose ps
```

Expected output:
```
NAME                   STATUS
mint-auth              Up (healthy)
mint-wallet            Up (healthy)
mint-transactions      Up (healthy)
mint-notifications     Up (healthy)
mint-mongodb           Up (healthy)
mint-rabbitmq          Up (healthy)
mint-nginx             Up (healthy)
```

### Health Check Endpoints

| Endpoint | Service | Returns |
|----------|---------|---------|
| `GET /health` | Gateway | Gateway status |
| `GET /api/v1/auth/health` | Auth | Service health |
| `GET /.well-known/jwks.json` | Auth | Public keys (also health indicator) |

### Troubleshooting Health Issues

If services are unhealthy:

1. **Check logs**: `docker compose logs <service>`
2. **Check environment**: Verify `.env.docker` files
3. **Check dependencies**: Ensure MongoDB and RabbitMQ are running
4. **Check ports**: Ensure no port conflicts
5. **Restart**: `docker compose restart <service>`

---

## Production Considerations

### Security Hardening

#### 1. Environment Variables

```env
# Change all defaults
COOKIE_SECRET=<64-char-random-string>
MONGO_ROOT_PASSWORD=<strong-password>
RABBITMQ_DEFAULT_USER=mint
RABBITMQ_DEFAULT_PASS=<strong-password>
```

Generate secure secrets:
```bash
# Linux/Mac
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 2. HTTPS Setup

Use a reverse proxy (Nginx, Traefik) with Let's Encrypt:

```yaml
# docker-compose.prod.yml
nginx:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.mint.rule=Host(`mint.yourdomain.com`)"
    - "traefik.http.routers.mint.tls.certresolver=letsencrypt"
```

#### 3. Database Security

```yaml
mongodb:
  environment:
    MONGO_INITDB_ROOT_USERNAME: mint_admin
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
  volumes:
    - mongodb_data:/data/db
  networks:
    - internal  # Isolate from public network
```

#### 4. Network Isolation

```yaml
networks:
  public:
    # Gateway only
  internal:
    # All services
    internal: true
```

#### 5. Resource Limits

```yaml
auth:
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 512M
      reservations:
        cpus: '0.5'
        memory: 256M
```

---

### Monitoring & Logging

#### 1. Centralized Logging

Use Docker logging drivers:

```yaml
services:
  auth:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

#### 2. Health Monitoring

Set up health check monitoring:

```yaml
auth:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:4001/api/v1/auth/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

#### 3. Application Metrics

Install Prometheus exporters (future enhancement):

```yaml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

---

### Backup Strategy

#### Database Backups

```bash
# Backup MongoDB
docker exec mint-mongodb mongodump \
  --uri="mongodb://root:example@localhost:27017" \
  --out=/backup

# Copy to host
docker cp mint-mongodb:/backup ./backups/$(date +%Y%m%d)
```

#### Automated Backups

```bash
#!/bin/bash
# backup.sh - Run via cron

BACKUP_DIR="/backups/mint"
DATE=$(date +%Y%m%d-%H%M%S)

# Backup all databases
docker exec mint-mongodb mongodump \
  --uri="mongodb://root:example@localhost:27017" \
  --gzip \
  --archive=/backup/mint-${DATE}.gz

# Copy to host
docker cp mint-mongodb:/backup/mint-${DATE}.gz ${BACKUP_DIR}/

# Keep only last 7 days
find ${BACKUP_DIR} -name "*.gz" -mtime +7 -delete
```

#### Restore from Backup

```bash
# Copy backup to container
docker cp ./backups/mint-20250115.gz mint-mongodb:/backup/

# Restore
docker exec mint-mongodb mongorestore \
  --uri="mongodb://root:example@localhost:27017" \
  --gzip \
  --archive=/backup/mint-20250115.gz
```

---

## Scaling

### Horizontal Scaling

Scale individual services:

```yaml
# docker-compose.scale.yml
services:
  auth:
    deploy:
      replicas: 3

  wallet:
    deploy:
      replicas: 5

  transactions:
    deploy:
      replicas: 3
```

Deploy with scaling:

```bash
docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

### Load Balancing

NGINX automatically load balances across replicas:

```nginx
upstream auth_backend {
  server auth:4001 max_fails=3 fail_timeout=10s;
  keepalive 32;
}
```

### Database Scaling

#### Read Replicas

```yaml
mongodb-replica:
  image: mongo:7
  command: mongod --replSet rs0
  depends_on:
    - mongodb
```

#### Sharding

For large-scale deployments, implement MongoDB sharding:

```yaml
mongos:
  image: mongo:7
  command: mongos --configdb configReplSet/config1:27019

config1:
  image: mongo:7
  command: mongod --configsvr --replSet configReplSet

shard1:
  image: mongo:7
  command: mongod --shardsvr --replSet shard1ReplSet
```

---

## Docker Compose Files

### Production (`docker-compose.yml`)

- Optimized builds
- Production environment
- Health checks enabled
- Resource limits
- Restart policies

### Development (`docker-compose.dev.yml`)

- Volume mounts for hot-reload
- Debug logging
- No resource limits
- Exposed ports for debugging

### Override Pattern

```bash
# Base + Production
docker compose up

# Base + Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Base + Production + Scaling
docker compose -f docker-compose.yml -f docker-compose.scale.yml up
```

---

## Useful Commands

```bash
# View running containers
docker compose ps

# View resource usage
docker stats

# Access service shell
docker exec -it mint-auth sh

# Access MongoDB
docker exec -it mint-mongodb mongosh -u root -p example

# Access RabbitMQ CLI
docker exec -it mint-rabbitmq rabbitmqctl list_queues

# Rebuild specific service
docker compose up -d --build auth

# Scale service
docker compose up -d --scale wallet=3

# View service config
docker compose config

# Remove everything (including volumes)
docker compose down -v --rmi all
```

---

## Related Documentation

- [Architecture Overview](architecture.md) - System design
- [Development Guide](development.md) - Local development
- [Troubleshooting](troubleshooting.md) - Common issues
- [API Documentation](api/) - API reference
