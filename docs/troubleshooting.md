# Troubleshooting Guide

## Table of Contents

- [Services Won't Start](#services-wont-start)
- [Database Issues](#database-issues)
- [RabbitMQ Connection Issues](#rabbitmq-connection-issues)
- [Authentication Problems](#authentication-problems)
- [Transaction Issues](#transaction-issues)
- [Wallet Issues](#wallet-issues)
- [Network & Port Conflicts](#network--port-conflicts)
- [Performance Issues](#performance-issues)
- [Docker Issues](#docker-issues)
- [General Debugging](#general-debugging)

---

## Services Won't Start

### Problem: Container exits immediately

**Symptoms**:
```bash
$ docker compose ps
NAME           STATUS
mint-auth      Exited (1)
```

**Diagnosis**:
```bash
docker compose logs auth
```

**Common Causes & Solutions**:

#### 1. Missing Environment Variables

**Error**:
```
Error: DATABASE_URL is required
```

**Solution**:
```bash
# Check .env.docker exists
ls auth/.env.docker

# Verify required variables
cat auth/.env.docker | grep DATABASE_URL
```

#### 2. Invalid Database URL

**Error**:
```
MongoServerError: Authentication failed
```

**Solution**:
```env
# Ensure correct format in .env.docker
DATABASE_URL=mongodb://root:example@mongodb:27017/auth_db?authSource=admin
#                     ^^^^        ^^^^^ Must match docker-compose.yml
```

#### 3. Missing JWT Keys

**Error**:
```
Error: ENOENT: no such file or directory, open '/app/keys/private_key.pem'
```

**Solution**:
```bash
cd auth
mkdir -p keys
cd keys
openssl genrsa -out private_key.pem 2048
openssl rsa -in private_key.pem -pubout -out public_key.pem
```

#### 4. Port Already in Use

**Error**:
```
Error: bind: address already in use
```

**Solution**:
```bash
# Find process using port
lsof -i :4001  # or netstat -ano | findstr :4001 on Windows

# Kill process or change port in docker-compose.yml
```

---

## Database Issues

### Problem: Cannot connect to MongoDB

**Symptoms**:
- Services exit with connection errors
- "MongoServerError: Authentication failed"
- "ECONNREFUSED 127.0.0.1:27017"

**Diagnosis**:
```bash
# Check MongoDB is running
docker compose ps mongodb

# Check MongoDB logs
docker compose logs mongodb

# Try connecting manually
docker exec -it mint-mongodb mongosh -u root -p example
```

**Solutions**:

#### MongoDB Not Started

```bash
# Start MongoDB
docker compose up mongodb -d

# Wait for it to be healthy
docker compose ps | grep mongodb
```

#### Wrong Credentials

```env
# Match these in .env.docker and docker-compose.yml
DATABASE_URL=mongodb://root:example@mongodb:27017/...
#                     ^^^^        ^^^^
#                     user        password
```

#### Service Name Resolution

When running services locally (not in Docker):

```env
# ❌ Won't work outside Docker
DATABASE_URL=mongodb://root:example@mongodb:27017/...

# ✅ Use localhost
DATABASE_URL=mongodb://root:example@localhost:27017/...
```

---

### Problem: Database is full or corrupted

**Symptoms**:
- Slow queries
- Random crashes
- "No space left on device"

**Solutions**:

#### Reset Database

```bash
# Stop all services
docker compose down

# Remove volumes (deletes all data)
docker compose down -v

# Restart
docker compose up -d
```

#### Repair Database

```bash
docker exec -it mint-mongodb mongosh -u root -p example

# In mongo shell
use auth_db
db.repairDatabase()
```

---

## RabbitMQ Connection Issues

### Problem: Cannot connect to RabbitMQ

**Symptoms**:
- "ECONNREFUSED ::1:5672"
- "Error: Channel closed"
- Events not being consumed

**Diagnosis**:
```bash
# Check RabbitMQ is running
docker compose ps rabbitmq

# Check logs
docker compose logs rabbitmq

# Check management UI
open http://localhost:15672
```

**Solutions**:

#### RabbitMQ Not Ready

```bash
# Wait for RabbitMQ to be fully started
docker compose logs rabbitmq | grep "Server startup complete"

# Takes 10-15 seconds on first start
# Services should retry connection
```

#### Wrong URL

```env
# ❌ Outside Docker
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# ✅ Use localhost when running locally
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

#### Connection Limits

```bash
# Check connection count
docker exec mint-rabbitmq rabbitmqctl list_connections

# Restart services if too many stale connections
docker compose restart auth wallet transactions
```

---

### Problem: Events not being consumed

**Symptoms**:
- Wallet not created after signup
- Balance not updated after transaction
- No emails sent

**Diagnosis**:
```bash
# Check RabbitMQ UI
open http://localhost:15672

# Look at:
# - Queue depths (should be 0 or low)
# - Consumer count (should be > 0)
# - Message rates
```

**Solutions**:

#### No Consumers Running

```bash
# Check service logs for errors
docker compose logs wallet
docker compose logs notifications

# Restart consumer service
docker compose restart wallet
```

#### Wrong Queue Bindings

```bash
# Check queue bindings in RabbitMQ UI
# Queues → <queue-name> → Bindings

# Should match routing key patterns
```

#### Message Stuck in Queue

```bash
# Purge queue (development only!)
docker exec mint-rabbitmq rabbitmqadmin purge queue name=wallet.user.q

# Or via UI: Queues → <queue-name> → Purge
```

---

## Authentication Problems

### Problem: Login fails with 401 Unauthorized

**Symptoms**:
- "Invalid email or password"
- User exists but cannot log in

**Diagnosis**:
```bash
# Check user exists
docker exec -it mint-mongodb mongosh -u root -p example

use auth_db
db.users.findOne({ email: "user@example.com" })
```

**Solutions**:

#### User Doesn't Exist

```bash
# Register user first
curl -X POST http://localhost/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"pass123"}'
```

#### Wrong Password

- Passwords are case-sensitive
- Ensure no extra spaces
- Minimum 8 characters

#### Password Hash Issue

If user was created without proper hashing:

```javascript
// In MongoDB shell
use auth_db
db.users.deleteOne({ email: "user@example.com" })
// Re-register through API
```

---

### Problem: JWT verification fails

**Symptoms**:
- "401 Unauthorized" on protected routes
- "Invalid signature"
- "Token expired"

**Diagnosis**:
```bash
# Check JWKS endpoint is accessible
curl http://localhost/.well-known/jwks.json

# Check wallet/transactions can reach auth service
docker compose exec wallet curl http://auth:4001/.well-known/jwks.json
```

**Solutions**:

#### JWKS Endpoint Not Accessible

```env
# In wallet/.env.docker and transactions/.env.docker
JWKS_URI=http://auth:4001/.well-known/jwks.json
#              ^^^^
#              Service name, not localhost
```

#### Token Expired

Tokens expire after 7 days. Login again:

```bash
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}' \
  -c cookies.txt
```

#### Key Mismatch

Auth service public/private keys don't match:

```bash
# Regenerate keys
cd auth/keys
rm *.pem
openssl genrsa -out private_key.pem 2048
openssl rsa -in private_key.pem -pubout -out public_key.pem

# Restart auth service
docker compose restart auth
```

---

## Transaction Issues

### Problem: Transaction stuck in PENDING

**Symptoms**:
- Transaction created but never completes
- Status stays "pending"

**Diagnosis**:
```bash
# Check transaction status
curl http://localhost/api/v1/transactions/<transaction-id> \
  -b cookies.txt

# Check RabbitMQ queue depths
open http://localhost:15672
# Look at transaction.created.q
```

**Solutions**:

#### Transaction Service Not Consuming

```bash
# Check logs
docker compose logs transactions

# Restart service
docker compose restart transactions
```

#### Event Not Published

```bash
# Check RabbitMQ exchange
# Exchanges → transaction.events → Publish message rate

# Manually trigger processing (development)
docker exec mint-rabbitmq rabbitmqadmin publish \
  exchange=transaction.events \
  routing_key=transaction.created \
  payload='{"transactionId":"<id>"}'
```

---

### Problem: Transfer fails with insufficient balance

**Symptoms**:
- Transaction status changes to FAILED
- "Insufficient balance" error

**Diagnosis**:
```bash
# Check wallet balance
curl http://localhost/api/v1/wallet/user -b cookies.txt
```

**Solutions**:

#### Add Funds First

```bash
# Top-up wallet
curl -X POST http://localhost/api/v1/transactions/topup \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"amount": 100}'

# Wait 1 second for processing
sleep 1

# Try transfer again
```

---

## Wallet Issues

### Problem: Wallet not created after signup

**Symptoms**:
- User registered but GET /wallet/user returns 404
- "Wallet not found"

**Diagnosis**:
```bash
# Check wallet exists
docker exec -it mint-mongodb mongosh -u root -p example

use wallet_db
db.wallets.findOne({ userId: ObjectId("<user-id>") })

# Check RabbitMQ for pending messages
open http://localhost:15672
# Check wallet.user.q depth
```

**Solutions**:

#### Wallet Service Not Running

```bash
# Check service status
docker compose ps wallet

# Start if stopped
docker compose up wallet -d
```

#### Event Not Consumed

```bash
# Check wallet service logs
docker compose logs wallet | grep "user.signup"

# Restart wallet service
docker compose restart wallet
```

#### Manually Trigger Wallet Creation

```bash
# Publish event manually
docker exec mint-rabbitmq rabbitmqadmin publish \
  exchange=auth.events \
  routing_key=user.signup \
  payload='{"userId":"<user-id>","email":"user@example.com"}'
```

---

### Problem: Balance not updating

**Symptoms**:
- Transaction completed but balance unchanged
- Balance updates slowly

**Diagnosis**:
```bash
# Check transaction status
curl http://localhost/api/v1/transactions/<id> -b cookies.txt

# Check wallet service logs
docker compose logs wallet
```

**Solutions**:

#### Wait for Processing

Transactions process asynchronously (100-500ms):

```bash
# Create transaction
curl -X POST http://localhost/api/v1/transactions/topup \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"amount": 100}'

# Wait
sleep 2

# Check balance
curl http://localhost/api/v1/wallet/user -b cookies.txt
```

#### Wallet Service Not Consuming

```bash
# Restart wallet service
docker compose restart wallet
```

---

## Network & Port Conflicts

### Problem: Port already in use

**Error**:
```
Error starting userland proxy: bind: address already in use
```

**Find Process Using Port**:

#### Linux/Mac
```bash
# Find process
lsof -i :80
lsof -i :4001

# Kill process
kill -9 <PID>
```

#### Windows
```bash
# Find process
netstat -ano | findstr :80

# Kill process
taskkill /PID <PID> /F
```

**Change Port**:

Edit `docker-compose.yml`:
```yaml
nginx:
  ports:
    - "8080:80"  # Change 80 to 8080
```

---

### Problem: Services can't reach each other

**Symptoms**:
- "ECONNREFUSED" between services
- Wallet can't reach auth service

**Diagnosis**:
```bash
# Check network
docker network ls
docker network inspect mint_default

# Test connectivity
docker compose exec wallet ping auth
docker compose exec wallet curl http://auth:4001/api/v1/auth/health
```

**Solutions**:

#### Use Service Names

Inside Docker, use service names (not localhost):

```env
# ✅ Correct
JWKS_URI=http://auth:4001/.well-known/jwks.json

# ❌ Wrong (won't work in Docker)
JWKS_URI=http://localhost:4001/.well-known/jwks.json
```

#### Restart Networking

```bash
docker compose down
docker compose up -d
```

---

## Performance Issues

### Problem: Slow API responses

**Diagnosis**:
```bash
# Check resource usage
docker stats

# Check service logs for slow queries
docker compose logs | grep "slow"
```

**Solutions**:

#### High CPU/Memory

```bash
# Add resource limits in docker-compose.yml
services:
  auth:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```

#### Database Indexes

Add indexes for frequently queried fields:

```javascript
// In MongoDB shell
use wallet_db
db.wallets.createIndex({ userId: 1 })

use transactions_db
db.transactions.createIndex({ userId: 1 })
db.transactions.createIndex({ createdAt: -1 })
```

---

## Docker Issues

### Problem: Out of disk space

**Error**:
```
no space left on device
```

**Solutions**:

```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Nuclear option - remove everything
docker system prune -a --volumes
```

---

### Problem: Build fails

**Error**:
```
failed to solve with frontend dockerfile
```

**Solutions**:

```bash
# Clear build cache
docker builder prune

# Rebuild without cache
docker compose build --no-cache

# Check Dockerfile syntax
docker compose config
```

---

## General Debugging

### Check Service Health

```bash
# All services
docker compose ps

# Gateway
curl http://localhost/health

# Individual services
curl http://localhost/api/v1/auth/health
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f auth

# Last 100 lines
docker compose logs --tail=100 wallet

# Filter errors
docker compose logs | grep ERROR
```

### Access Service Shell

```bash
# Access container
docker exec -it mint-auth sh

# Run commands inside
ls
env | grep DATABASE
```

### Check Environment Variables

```bash
# View service environment
docker compose exec auth env

# Check specific variable
docker compose exec auth printenv DATABASE_URL
```

### Reset Everything

When all else fails:

```bash
# Nuclear option - reset everything
docker compose down -v --rmi all

# Remove networks
docker network prune

# Rebuild and start
docker compose up --build
```

---

## Getting Help

If you're still stuck:

1. **Check logs** thoroughly:
   ```bash
   docker compose logs > logs.txt
   ```

2. **Gather information**:
   - Error messages
   - Docker compose ps output
   - Environment configuration
   - Steps to reproduce

3. **Search issues**: Check GitHub issues for similar problems

4. **Create issue**: Open a new issue with:
   - Clear description
   - Error messages
   - Logs
   - Environment details

---

## Related Documentation

- [Architecture Overview](architecture.md) - System design
- [Deployment Guide](deployment.md) - Setup instructions
- [Development Guide](development.md) - Local development
- [API Documentation](api/) - API reference
