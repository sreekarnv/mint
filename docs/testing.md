# Testing Guide

This guide covers the testing infrastructure for the Mint microservices wallet system.

## Overview

Mint includes **112 comprehensive tests** using **Vitest** as the testing framework with **Supertest** for API integration testing. Each service has its own test suite including:

- **Unit Tests** (59): Testing individual functions and services in isolation
- **Integration Tests** (45): Testing API endpoints end-to-end
- **Consumer Tests** (8): Testing RabbitMQ event handlers
- **Database Tests**: Using MongoDB Memory Server for isolated database testing
- **Mock Testing**: RabbitMQ and external dependencies are mocked

**All tests passing** | CI/CD integrated with GitHub Actions

## Test Stack

- **Vitest**: Fast, modern test framework with excellent TypeScript support
- **Supertest**: HTTP assertion library for API testing
- **MongoDB Memory Server**: In-memory MongoDB for isolated testing
- **Vitest UI**: Interactive test UI for development
- **V8 Coverage**: Built-in code coverage reports

## Running Tests

### Run all tests across all services

```bash
pnpm test
```

### Run tests for a specific service

```bash
# Auth service
pnpm test:auth

# Wallet service
pnpm test:wallet

# Transactions service
pnpm test:transactions

# Notifications service
pnpm test:notifications
```

### Run tests in watch mode

```bash
# All services (runs in parallel)
pnpm test:watch

# Single service
cd auth
pnpm test:watch
```

### Run tests with coverage

```bash
# All services
pnpm test:coverage

# Single service
cd auth
pnpm test:coverage
```

### Run tests with UI

```bash
cd auth
pnpm test:ui
```

## Test Structure

Each service follows a consistent test structure:

```
src/
├── __tests__/
│   ├── setup.ts              # Global test setup (MongoDB, mocks)
│   ├── helpers/
│   │   ├── test-helpers.ts   # Utility functions for creating test data
│   │   └── mock-rabbitmq.ts  # RabbitMQ mocks
│   ├── unit/                 # Unit tests
│   │   ├── *.service.test.ts
│   │   └── *.model.test.ts
│   └── integration/          # Integration/API tests
│       └── *.api.test.ts
└── ... (application code)
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from "vitest";
import * as authService from "~/services/auth.service";
import { createTestUser } from "../helpers/test-helpers";

describe("Auth Service", () => {
  describe("login", () => {
    it("should login user with correct credentials", async () => {
      await createTestUser({
        email: "test@example.com",
        password: "password123",
      });

      const result = await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result).toHaveProperty("id");
      expect(result.email).toBe("test@example.com");
    });
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "~/app";

// Mock RabbitMQ
vi.mock("~/rabbitmq/publisher", () => ({
  publishEvent: vi.fn().mockResolvedValue(undefined),
}));

describe("Auth API", () => {
  it("should register a new user", async () => {
    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
      })
      .expect(201);

    expect(response.body).toHaveProperty("user");
    expect(response.body).toHaveProperty("accessToken");
  });
});
```

## Test Environment

### Environment Configuration

Each service has a `.env.test` file with test-specific configuration:

```env
NODE_ENV=test
PORT=4001
DATABASE_URL=mongodb://localhost:27017/mint-auth-test
RABBITMQ_URL=amqp://localhost:5672
JWT_ISS=mint-auth
JWT_AUD=mint-services
JWKS_ENDPOINT=http://localhost:4001/.well-known/jwks.json
```

**Note**: Database URL is overridden by MongoDB Memory Server in tests, so actual MongoDB connection is not required.

### JWT Keys for Testing

The auth service automatically generates RSA key pairs for JWT signing during test setup:

```typescript
// auth/src/__tests__/setup.ts
function ensureJWTKeys() {
  const keysDir = path.join(__dirname, "..", "..", "keys");
  const publicKeyPath = path.join(keysDir, "public.pem");
  const privateKeyPath = path.join(keysDir, "private.pem");

  if (!fs.existsSync(publicKeyPath) || !fs.existsSync(privateKeyPath)) {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    fs.writeFileSync(publicKeyPath, publicKey);
    fs.writeFileSync(privateKeyPath, privateKey);
  }
}
```

This ensures JWT functionality works in tests without committing sensitive keys to version control. Keys are gitignored (`**/keys/*.pem`).

## Mocking External Dependencies

### RabbitMQ

RabbitMQ is mocked in all tests to prevent actual message publishing:

```typescript
vi.mock("~/rabbitmq/publisher", () => ({
  publishEvent: vi.fn().mockResolvedValue(undefined),
}));
```

### Email Service (Notifications)

The nodemailer transport is mocked:

```typescript
vi.mock("~/utils/mail", () => ({
  mailer: {
    sendMail: vi.fn().mockResolvedValue({
      messageId: "test-message-id",
      accepted: ["test@example.com"],
    }),
  },
}));
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory of each service:

- `coverage/index.html`: Interactive HTML coverage report
- `coverage/coverage-final.json`: JSON coverage data
- Console output shows coverage summary

### Coverage Metrics

Current test coverage across all services:

| Service | Tests | Coverage | Details |
|---------|-------|----------|---------|
| **Auth** | 35 | 59.31% | User authentication, JWT, password hashing |
| **Wallet** | 20 | 50.25% | Balance operations, transactions, event handlers |
| **Transactions** | 44 | 63.41% | Transaction lifecycle, state management, validation |
| **Notifications** | 13 | 15.91% | Email service, consumer handlers |
| **Total** | **112** | - | All passing ✓ |

**Coverage Breakdown by Test Type:**
- Unit Tests: 59 tests (models, services, utilities)
- Integration Tests: 45 tests (API endpoints, full request/response)
- Consumer Tests: 8 tests (RabbitMQ event handlers)

### Coverage Exclusions

The following are excluded from coverage:

- `node_modules/`
- `src/__tests__/`
- `*.config.ts`
- `*.d.ts`
- Type definition files
- Infrastructure code (server startup, RabbitMQ bootstrap)

## Continuous Integration

Tests run automatically on every push via GitHub Actions. See `.github/workflows/test.yml` for CI configuration.

## Test Coverage Details

### Auth Service (35 tests)
- **Unit Tests**: User model validation, password hashing, JWT generation
- **Integration Tests**: Signup, login, logout, token refresh, JWKS endpoint
- **Security Tests**: Rate limiting, invalid credentials, duplicate email
- **Features**: Auto-generated RSA keys for JWT signing in test environment

### Wallet Service (20 tests)
- **Unit Tests** (15): Wallet creation, balance updates, transaction processing
- **Integration Tests** (5): Get wallet, balance queries, user authorization
- **Features**: MongoDB Memory Server for isolated testing

### Transactions Service (44 tests)
- **Unit Tests** (27): Transaction model, service layer, validation logic
  - Transaction creation (TopUp, Transfer)
  - Self-transfer validation
  - Transaction state management
  - Event publishing
- **Integration Tests** (17): Full API endpoint testing
  - TopUp/Transfer creation
  - Transaction listing with pagination
  - Transaction retrieval and authorization
  - Input validation and error handling

### Notifications Service (13 tests)
- **Unit Tests** (7): Email service, consumer handlers
- **Integration Tests** (6): Email sending for various events
- **Features**: Nodemailer mocking, event-driven testing

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Clean State**: Database is cleared after each test via `afterEach` hooks in setup.ts
3. **Descriptive Names**: Use clear, descriptive test names that explain what's being tested
4. **Arrange-Act-Assert**: Follow the AAA pattern in tests
5. **Mock External Services**: Always mock RabbitMQ, email services, and external APIs
6. **Test Both Success and Failure**: Include tests for error cases, validation failures, and edge cases
7. **Use Type Safety**: Leverage TypeScript for type-safe test data
8. **Coverage Goals**: Aim for 60%+ overall coverage, 100% for critical business logic
9. **Integration > Unit**: Prefer integration tests for APIs to ensure full request/response cycle
10. **Mock Authentication**: Use helper functions to mock JWT middleware in integration tests

## Troubleshooting

### MongoDB Memory Server Issues

If MongoDB Memory Server fails to download:

```bash
# Set download mirror
export MONGOMS_DOWNLOAD_MIRROR=https://fastdl.mongodb.org
```

### Port Conflicts

If you see EADDRINUSE errors, ensure no services are running on test ports (4001-4004).

### Timeout Errors

Tests have a 30-second timeout. If tests are timing out:

- Check for unresolved promises
- Ensure async operations use `await`
- Verify MongoDB Memory Server is starting correctly

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
