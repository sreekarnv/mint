# Testing Guide

This guide covers the testing infrastructure for the Mint microservices wallet system.

## Overview

Mint uses **Vitest** as the testing framework with **Supertest** for API integration testing. Each service has its own comprehensive test suite including:

- **Unit Tests**: Testing individual functions and services in isolation
- **Integration Tests**: Testing API endpoints end-to-end
- **Database Tests**: Using MongoDB Memory Server for isolated database testing
- **Mock Testing**: RabbitMQ and external dependencies are mocked

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

Each service has a `.env.test` file with test-specific configuration:

```env
NODE_ENV=test
PORT=4001
DATABASE_URL=mongodb://localhost:27017/mint-auth-test
RABBITMQ_URL=amqp://localhost:5672
```

Note: Database URL is overridden by MongoDB Memory Server in tests, so actual MongoDB connection is not required.

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

### Coverage Exclusions

The following are excluded from coverage:

- `node_modules/`
- `src/__tests__/`
- `*.config.ts`
- `*.d.ts`
- Type definition files

## Continuous Integration

Tests run automatically on every push via GitHub Actions. See `.github/workflows/test.yml` for CI configuration.

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Clean State**: Database is cleared after each test via `afterEach` hooks
3. **Descriptive Names**: Use clear, descriptive test names that explain what's being tested
4. **Arrange-Act-Assert**: Follow the AAA pattern in tests
5. **Mock External Services**: Always mock RabbitMQ, email services, and external APIs
6. **Coverage Goals**: Aim for 80%+ coverage on services and models

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
