# Auth Service

The **Auth Service** handles all authentication and user management operations.

## Overview

- **Port**: 4001
- **Database**: `mint_auth` (MongoDB)
- **Events Published**: `user.signup`
- **Events Consumed**: None

## Features

### Authentication
- User registration with email validation
- Secure login with Argon2 password hashing
- JWT token generation using RS256 algorithm
- JWKS endpoint for public key distribution
- Session management with HTTP-only cookies

### User Management
- User profile CRUD operations
- User search functionality
- Current user information retrieval
- Profile updates

## Technology Stack

- **Express.js** - Web framework
- **MongoDB/Mongoose** - Database ORM
- **Argon2** - Password hashing
- **Jose** - JWT handling (RS256)
- **Zod** - Request validation
- **RabbitMQ** - Event publishing

## Key Endpoints

For detailed API documentation, see [Auth API Reference](../api/auth.md).

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/auth/signup` | POST | Register new user | No |
| `/api/v1/auth/login` | POST | Login user | No |
| `/api/v1/auth/logout` | POST | Logout user | Yes |
| `/api/v1/auth/user` | GET | Get current user | Yes |
| `/api/v1/users` | GET | List all users | Yes |
| `/api/v1/users/search` | GET | Search users | Yes |
| `/api/v1/users/:id` | GET | Get user profile | Yes |
| `/api/v1/users/me` | PUT | Update current user | Yes |
| `/.well-known/jwks.json` | GET | JWKS endpoint | No |

## Event Publishing

### user.signup

Published when a new user registers.

**Routing Key**: `user.signup`

**Payload**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "name": "John Doe"
}
```

**Consumers**:
- **Wallet Service** - Creates wallet
- **Notifications Service** - Sends welcome email

## Security

### JWT Implementation

- **Algorithm**: RS256 (asymmetric encryption)
- **Issuer**: `auth-service`
- **Audience**: Service-specific
- **Expiration**: 7 days
- **Storage**: HTTP-only cookies

### Password Security

- **Hashing**: Argon2 (industry standard)
- **Validation**: Minimum 8 characters
- **Storage**: Never returned in API responses

### Cookie Security

- **HttpOnly**: Prevents JavaScript access
- **Secure**: HTTPS only (production)
- **SameSite**: Strict (CSRF protection)
- **MaxAge**: 7 days

## Configuration

See [Configuration Guide](../getting-started/configuration.md#auth-service-configuration) for environment variables.

## Related Documentation

- [Auth API Reference](../api/auth.md)
- [Event Architecture](../events.md)
- [Getting Started](../getting-started/installation.md)
