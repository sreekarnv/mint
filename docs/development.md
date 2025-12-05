# Development Guide

## Table of Contents

- [Local Development Setup](#local-development-setup)
- [Running Services](#running-services)
- [Code Quality](#code-quality)
- [Database Management](#database-management)
- [RabbitMQ Management](#rabbitmq-management)
- [Debugging](#debugging)
- [Testing](#testing)
- [Common Workflows](#common-workflows)

---

## Local Development Setup

### Prerequisites

- **Node.js** 20.x or higher
- **pnpm** 8.x or higher (recommended) or npm
- **Docker** & **Docker Compose** (for infrastructure)

### Installation

#### 1. Install Node.js

Download from [nodejs.org](https://nodejs.org/) or use nvm:

```bash
# Using nvm (recommended)
nvm install 20
nvm use 20
```

#### 2. Install pnpm

```bash
npm install -g pnpm
```

#### 3. Clone Repository

```bash
git clone https://github.com/yourusername/mint.git
cd mint
```

#### 4. Install Dependencies

Install dependencies for all services:

```bash
# Auth Service
cd auth
pnpm install
cd ..

# Wallet Service
cd wallet
pnpm install
cd ..

# Transactions Service
cd transactions
pnpm install
cd ..

# Notifications Service
cd notifications
pnpm install
cd ..
```

**Tip**: Create a script to install all at once:

```bash
#!/bin/bash
# install-all.sh

for service in auth wallet transactions notifications; do
  echo "Installing $service..."
  cd $service
  pnpm install
  cd ..
done
```

#### 5. Setup Environment Files

```bash
# Copy example files
for service in auth wallet transactions notifications; do
  cp $service/.env.example $service/.env.local
done
```

Edit `.env.local` files with local development settings:

```env
# Use localhost instead of Docker service names
DATABASE_URL=mongodb://root:example@localhost:27017/auth_db?authSource=admin
RABBITMQ_URL=amqp://guest:guest@localhost:5672
JWKS_URI=http://localhost:4001/.well-known/jwks.json
```

---

## Running Services

### Option 1: Full Docker (Recommended for Quick Start)

Run everything in Docker:

```bash
docker compose -f docker-compose.dev.yml up --build
```

**Pros**:
- Everything configured and working
- Hot-reload enabled
- Consistent environment

**Cons**:
- Slower to restart services
- Harder to debug

---

### Option 2: Hybrid (Infrastructure in Docker, Services Local)

Run infrastructure in Docker, services locally:

#### 1. Start Infrastructure

```bash
docker compose up mongodb rabbitmq
```

#### 2. Run Services Locally

Open 4 terminals and run:

```bash
# Terminal 1 - Auth Service
cd auth
pnpm dev

# Terminal 2 - Wallet Service
cd wallet
pnpm dev

# Terminal 3 - Transactions Service
cd transactions
pnpm dev

# Terminal 4 - Notifications Service
cd notifications
pnpm dev
```

**Pros**:
- Fast hot-reload
- Easy debugging with breakpoints
- Direct access to logs

**Cons**:
- More terminal windows
- Manual service management

---

### Development Scripts

Each service has these scripts:

```bash
# Development with hot-reload
pnpm dev

# Build TypeScript
pnpm build

# Run production build
pnpm start

# Lint code
pnpm lint

# Format code
pnpm format

# Type check (without building)
pnpm type-check
```

---

## Code Quality

### Linting

All services use ESLint with TypeScript rules:

```bash
# Lint code
pnpm lint

# Auto-fix issues
pnpm lint --fix
```

### Formatting

Format code with Prettier:

```bash
# Check formatting
pnpm format:check

# Auto-format
pnpm format
```

### Type Checking

```bash
# Type check without building
pnpm type-check
```

### Pre-commit Hook (Optional)

Install husky for automatic checks:

```bash
# In project root
pnpm install -D husky lint-staged

# Setup husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "pnpm lint-staged"
```

`.lintstagedrc.json`:
```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ]
}
```

---

## Database Management

### Access MongoDB

#### Via Docker

```bash
docker exec -it mint-mongodb mongosh -u root -p example
```

#### Via Local Client

```bash
mongosh mongodb://root:example@localhost:27017
```

### Common MongoDB Commands

```javascript
// List databases
show dbs

// Switch to database
use auth_db

// List collections
show collections

// View users
db.users.find().pretty()

// Find specific user
db.users.findOne({ email: "john@example.com" })

// Update user
db.users.updateOne(
  { email: "john@example.com" },
  { $set: { name: "John Updated" } }
)

// Delete user
db.users.deleteOne({ email: "test@example.com" })

// View wallets
use wallet_db
db.wallets.find().pretty()

// View transactions
use transactions_db
db.transactions.find().pretty()
```

### Reset Database

```bash
# Stop services
docker compose down

# Remove volumes (deletes all data)
docker compose down -v

# Restart
docker compose up
```

### Seed Test Data

Create a seed script:

```typescript
// scripts/seed.ts
import mongoose from 'mongoose';
import { User } from '../src/models/User';

async function seed() {
  await mongoose.connect('mongodb://root:example@localhost:27017/auth_db?authSource=admin');

  // Create test users
  await User.create([
    {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123' // Will be hashed by model
    },
    {
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password123'
    }
  ]);

  console.log('Seed data created');
  await mongoose.disconnect();
}

seed();
```

Run seed script:
```bash
cd auth
npx tsx scripts/seed.ts
```

---

## RabbitMQ Management

### Access Management UI

Open http://localhost:15672

**Credentials**:
- Username: `guest`
- Password: `guest`

### Management UI Features

1. **Queues**: View queue depths, message rates
2. **Exchanges**: View bindings and routing
3. **Connections**: Active connections from services
4. **Channels**: Open channels per connection

### Useful Operations

#### View Queue Messages

1. Go to "Queues" tab
2. Click on queue name
3. Scroll to "Get messages"
4. Click "Get Message(s)"

#### Purge Queue

```bash
# Via UI: Queues → Queue Name → Purge

# Via CLI
docker exec mint-rabbitmq rabbitmqadmin purge queue name=email.signup.q
```

#### Publish Test Message

```bash
# Via CLI
docker exec mint-rabbitmq rabbitmqadmin publish \
  exchange=auth.events \
  routing_key=user.signup \
  payload='{"userId":"123","email":"test@example.com"}'
```

### Monitor Events

Watch RabbitMQ logs to see event flow:

```bash
docker compose logs -f rabbitmq
```

---

## Debugging

### VS Code Debug Configuration

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Auth Service",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}/auth",
      "skipFiles": ["<node_internals>/**"],
      "envFile": "${workspaceFolder}/auth/.env.local"
    },
    {
      "name": "Debug Wallet Service",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}/wallet",
      "skipFiles": ["<node_internals>/**"],
      "envFile": "${workspaceFolder}/wallet/.env.local"
    }
  ]
}
```

### Debugging Tips

#### 1. Add Breakpoints

In VS Code, click left of line number to add breakpoint.

#### 2. Console Logging

```typescript
console.log('Variable value:', variable);

// Better: Use logger
import { logger } from './utils/logger';
logger.debug('Debugging info', { variable });
```

#### 3. Inspect Events

Log RabbitMQ events:

```typescript
// In consumer
channel.consume(queue, async (msg) => {
  const data = JSON.parse(msg.content.toString());
  console.log('Received event:', data); // Debug log
  await processEvent(data);
});
```

#### 4. Check Service Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f auth

# Filter by error
docker compose logs | grep ERROR
```

---

## Testing

### Manual API Testing

#### Using cURL

```bash
# Register user
curl -X POST http://localhost/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' \
  -c cookies.txt

# Get wallet
curl http://localhost/api/v1/wallet/user -b cookies.txt

# Top-up
curl -X POST http://localhost/api/v1/transactions/topup \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"amount": 100, "description": "Test"}'
```

#### Using Postman

1. Import collection from `postman/mint-collection.json` (create if needed)
2. Set environment variables
3. Use saved requests

#### Using httpie

```bash
# More readable than curl
http POST localhost/api/v1/auth/signup \
  name="Test User" \
  email="test@example.com" \
  password="password123"
```

### Integration Testing

Run end-to-end flow:

```bash
#!/bin/bash
# test-flow.sh

# 1. Register
RESPONSE=$(curl -s -X POST http://localhost/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"pass123"}')

echo "Register: $RESPONSE"

# 2. Login
curl -s -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}' \
  -c cookies.txt > /dev/null

# 3. Check wallet
WALLET=$(curl -s http://localhost/api/v1/wallet/user -b cookies.txt)
echo "Wallet: $WALLET"

# 4. Top-up
curl -s -X POST http://localhost/api/v1/transactions/topup \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"amount":100}' > /dev/null

# 5. Wait for processing
sleep 2

# 6. Check balance
UPDATED=$(curl -s http://localhost/api/v1/wallet/user -b cookies.txt)
echo "Updated wallet: $UPDATED"
```

---

## Common Workflows

### Adding a New Feature

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes** in appropriate service(s)

3. **Test locally**
   ```bash
   pnpm dev
   # Test feature
   ```

4. **Lint and format**
   ```bash
   pnpm lint
   pnpm format
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

### Adding a New Endpoint

1. **Define route** in `src/routers/`
   ```typescript
   router.get('/new-endpoint', authenticate, controller);
   ```

2. **Create controller** in `src/controllers/`
   ```typescript
   export const controller = async (req, res) => {
     // Implementation
   };
   ```

3. **Add validation schema** in `src/schemas/`
   ```typescript
   export const schema = z.object({
     field: z.string()
   });
   ```

4. **Test endpoint**
   ```bash
   curl http://localhost:4001/api/v1/new-endpoint
   ```

### Adding a New Event

1. **Define event publisher** in publishing service
   ```typescript
   await publishEvent('new.event', {
     field1: 'value',
     field2: 123
   });
   ```

2. **Add consumer** in consuming service
   ```typescript
   // src/consumers/newEventConsumer.ts
   export async function consumeNewEvent(data) {
     // Process event
   }
   ```

3. **Register consumer** in RabbitMQ setup
   ```typescript
   channel.consume('new.event.q', async (msg) => {
     await consumeNewEvent(JSON.parse(msg.content.toString()));
     channel.ack(msg);
   });
   ```

4. **Test event flow**
   - Trigger publisher
   - Check RabbitMQ UI
   - Verify consumer processes

### Fixing a Bug

1. **Reproduce the bug** locally

2. **Add debugging**
   ```typescript
   console.log('Debug info:', variable);
   ```

3. **Identify root cause**

4. **Fix and verify**

5. **Add test** to prevent regression

---

## Project Structure

### Service Structure

```
service/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, error handling
│   ├── models/          # Database models
│   ├── routers/         # Express routes
│   ├── schemas/         # Zod validation
│   ├── services/        # Business logic
│   ├── utils/           # Helpers (logger, jwt)
│   ├── rabbitmq/        # RabbitMQ setup
│   ├── consumers/       # Event consumers (if applicable)
│   ├── app.ts           # Express app setup
│   ├── env.ts           # Environment validation
│   └── server.ts        # Entry point
├── keys/                # JWT keys (auth only)
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env.example
```

### Adding New Files

Follow existing patterns:

- **Controllers**: Handle HTTP requests
- **Services**: Business logic
- **Models**: Database schemas
- **Schemas**: Input validation
- **Utils**: Shared utilities

---

## Useful Commands

### Docker

```bash
# View logs
docker compose logs -f <service>

# Restart service
docker compose restart <service>

# Rebuild service
docker compose up -d --build <service>

# Access service shell
docker exec -it mint-<service> sh
```

### Database

```bash
# Access MongoDB
docker exec -it mint-mongodb mongosh -u root -p example

# Backup database
docker exec mint-mongodb mongodump --uri="mongodb://root:example@localhost:27017" --out=/backup

# Restore database
docker exec mint-mongodb mongorestore --uri="mongodb://root:example@localhost:27017" /backup
```

### RabbitMQ

```bash
# List queues
docker exec mint-rabbitmq rabbitmqctl list_queues

# List exchanges
docker exec mint-rabbitmq rabbitmqctl list_exchanges

# Purge queue
docker exec mint-rabbitmq rabbitmqadmin purge queue name=<queue-name>
```

---

## Environment Variables Reference

Create `.env.local` for each service with these settings:

```env
# Common (all services)
NODE_ENV=development
PORT=<service-port>

# Database (auth, wallet, transactions)
DATABASE_URL=mongodb://root:example@localhost:27017/<db-name>?authSource=admin

# RabbitMQ (all services)
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# JWT (wallet, transactions)
JWT_ISSUER=mint-auth-service
JWT_AUDIENCE=mint-api
JWKS_URI=http://localhost:4001/.well-known/jwks.json

# SMTP (notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Related Documentation

- [Architecture Overview](architecture.md) - System design
- [Deployment Guide](deployment.md) - Production deployment
- [API Documentation](api/) - API reference
- [Troubleshooting](troubleshooting.md) - Common issues
