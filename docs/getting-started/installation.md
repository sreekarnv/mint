# Installation Guide

This guide will help you install and set up Mint on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (v20.10 or higher) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (v2.0 or higher) - [Install Docker Compose](https://docs.docker.com/compose/install/)
- **Git** - [Install Git](https://git-scm.com/downloads)

!!! tip "Verify Installation"
    Check if Docker and Docker Compose are installed correctly:
    ```bash
    docker --version
    docker compose version
    ```

---

## Clone the Repository

1. **Clone the repository**

```bash
git clone https://github.com/sreekarnv/mint.git
cd mint
```

---

## Environment Configuration

Each service requires environment variables. Create `.env.docker` files for each service:

### Quick Setup (Copy from Examples)

```bash
# Auth Service
cp auth/.env.docker.example auth/.env.docker

# Wallet Service
cp wallet/.env.docker.example wallet/.env.docker

# Transactions Service
cp transactions/.env.docker.example transactions/.env.docker

# Notifications Service
cp notifications/.env.docker.example notifications/.env.docker
```

### Manual Configuration

If the example files don't exist, create `.env.docker` files manually:

#### Auth Service (`auth/.env.docker`)

```env
NODE_ENV=production
PORT=4001
DATABASE_URL=mongodb://root:example@mongodb:27017/mint_auth?authSource=admin
JWT_ISS="auth-service"
JWT_AUD="wallet-service transaction-service notification-service"
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

#### Wallet Service (`wallet/.env.docker`)

```env
NODE_ENV=production
PORT=4003
DATABASE_URL=mongodb://root:example@mongodb:27017/mint_wallet?authSource=admin
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
JWKS_ENDPOINT=http://auth:4001/.well-known/jwks.json
JWT_ISS="auth-service"
JWT_AUD="wallet-service"
```

#### Transactions Service (`transactions/.env.docker`)

```env
NODE_ENV=production
PORT=4004
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
DATABASE_URL=mongodb://root:example@mongodb:27017/mint_txns?authSource=admin
JWKS_ENDPOINT=http://auth:4001/.well-known/jwks.json
JWT_AUD=transaction-service
JWT_ISS=auth-service
```

#### Notifications Service (`notifications/.env.docker`)

```env
NODE_ENV=production
PORT=4002

SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-password

RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

!!! warning "Email Configuration"
    For the notifications service to send emails, you need to configure SMTP settings. For testing, use [Mailtrap](https://mailtrap.io/) or any SMTP service.

---

## Generate RSA Keys for JWT

The auth service requires RSA keys for JWT signing:

```bash
cd auth
mkdir -p keys
cd keys

# Generate private key
openssl genrsa -out private_key.pem 2048

# Generate public key
openssl rsa -in private_key.pem -pubout -out public_key.pem

cd ../..
```

!!! info "Key Location"
    The keys should be in `auth/keys/` directory. The Dockerfile will copy them during build.

---

## Build and Run

### Production Mode

Run the application in production mode:

```bash
docker compose up --build
```

This will:

- Build all service images
- Start MongoDB and RabbitMQ
- Launch all microservices
- Start the NGINX gateway

!!! success "Expected Output"
    You should see logs from all services indicating they've started successfully. Look for messages like:
    ```
    mint-auth       | Server running on port 4001
    mint-wallet     | Server running on port 4003
    mint-transactions | Server running on port 4004
    mint-notifications | Server running on port 4002
    ```

### Development Mode

For development with hot-reloading:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Development mode features:

- ✅ Volume mounts for source code
- ✅ Automatic restart on file changes
- ✅ Debug logging enabled
- ✅ Service stdout/stderr visible

---

## Verify Installation

Once all services are running, verify they're healthy:

### Check Gateway Health

```bash
curl http://localhost/health
```

**Expected Response:**
```json
{
  "status": "healthy"
}
```

### Check Auth Service

```bash
curl http://localhost/api/v1/auth/health
```

### Check JWKS Endpoint

```bash
curl http://localhost/.well-known/jwks.json
```

### Check Docker Containers

```bash
docker compose ps
```

All containers should show status as `healthy` or `running`.

---

## Access Services

Once running, the services are available at:

| Service | URL | Credentials |
|---------|-----|-------------|
| **API Gateway** | http://localhost | - |
| **Auth Service** | http://localhost:4001 (internal) | - |
| **Wallet Service** | http://localhost:4003 (internal) | - |
| **Transactions Service** | http://localhost:4004 (internal) | - |
| **Notifications Service** | http://localhost:4002 (internal) | - |
| **RabbitMQ Management** | http://localhost:15672 | guest/guest |
| **MongoDB** | mongodb://localhost:27017 | root/example |

!!! note "Gateway vs Direct Access"
    All client requests should go through the API Gateway at `http://localhost`. Direct service ports are for internal communication and debugging only.

---

## Troubleshooting

### Port Already in Use

**Error:** `Error: bind: address already in use`

**Solution:**
```bash
# Find process using the port
lsof -i :80  # or :4001, :5672, etc.

# Kill the process
kill -9 <PID>
```

### Services Won't Start

**Error:** Containers exit immediately

**Solution:**
```bash
# Check logs
docker compose logs <service-name>

# Rebuild containers
docker compose down -v
docker compose up --build
```

### Database Connection Issues

**Error:** `MongoServerError: Authentication failed`

**Solution:**

- Verify `DATABASE_URL` in `.env.docker` files
- Ensure MongoDB is healthy: `docker compose ps`
- Reset MongoDB: `docker compose down -v mongodb && docker compose up mongodb`

For more troubleshooting tips, see the [Troubleshooting Guide](../troubleshooting.md).

---

## Next Steps

Now that Mint is installed:

1. [Quick Start Guide](quick-start.md) - Complete your first transaction flow
2. [Configuration Guide](configuration.md) - Learn about advanced configuration options
3. [API Reference](../api/auth.md) - Explore the API endpoints

---

## Clean Up

To stop and remove all containers:

```bash
# Stop containers
docker compose down

# Remove containers and volumes
docker compose down -v

# Remove containers, volumes, and images
docker compose down --rmi all -v
```
