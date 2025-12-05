# Authentication API

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Register User](#register-user)
  - [Login](#login)
  - [Logout](#logout)
  - [Get Current User](#get-current-user)
  - [List All Users](#list-all-users)
  - [Search Users](#search-users)
  - [Get User Profile](#get-user-profile)
  - [Update Current User](#update-current-user)
  - [JWKS Endpoint](#jwks-endpoint)
  - [Health Check](#health-check)
- [Error Responses](#error-responses)

---

## Overview

The Authentication API handles user registration, login, session management, and user profile operations. It uses JWT tokens with RS256 asymmetric encryption, stored in HTTP-only cookies for security.

---

## Base URL

```
http://localhost/api/v1/auth
```

All authentication endpoints are prefixed with `/api/v1/auth`.

---

## Authentication

### Public Endpoints (No Auth Required)
- `POST /signup` - Register new user
- `POST /login` - Login user
- `GET /.well-known/jwks.json` - Public keys

### Protected Endpoints (Auth Required)
All other endpoints require authentication via HTTP-only cookie set during login.

**Cookie Name**: `mint_session`

**Headers**: Cookies are sent automatically by the browser. For manual testing:
```http
Cookie: mint_session=<jwt-token>
```

---

## Endpoints

### Register User

Create a new user account.

**Endpoint**: `POST /api/v1/auth/signup`

**Authentication**: None required

#### Request Body

```json
{
  "name": "string (required, min 2 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)"
}
```

#### Example Request

```bash
curl -X POST http://localhost/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

#### Success Response

**Code**: `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

#### Side Effects

1. User is created in the database
2. Password is hashed with Argon2
3. `user.signup` event is published to RabbitMQ
4. Wallet is created asynchronously
5. Welcome email is sent asynchronously

#### Error Responses

**400 Bad Request** - Validation error
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email"
    }
  ]
}
```

**409 Conflict** - Email already exists
```json
{
  "error": "User with this email already exists"
}
```

---

### Login

Authenticate a user and create a session.

**Endpoint**: `POST /api/v1/auth/login`

**Authentication**: None required

#### Request Body

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

#### Example Request

```bash
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt
```

#### Success Response

**Code**: `200 OK`

**Headers**:
```
Set-Cookie: mint_session=<jwt-token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

**Body**:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### JWT Token Details

- **Algorithm**: RS256 (asymmetric)
- **Issuer**: `mint-auth-service`
- **Audience**: `mint-api`
- **Expires**: 7 days
- **Claims**:
  ```json
  {
    "sub": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "iat": 1642248600,
    "exp": 1642853400,
    "iss": "mint-auth-service",
    "aud": "mint-api"
  }
  ```

#### Error Responses

**400 Bad Request** - Missing fields
```json
{
  "error": "Email and password are required"
}
```

**401 Unauthorized** - Invalid credentials
```json
{
  "error": "Invalid email or password"
}
```

---

### Logout

End the user's session.

**Endpoint**: `POST /api/v1/auth/logout`

**Authentication**: Required

#### Example Request

```bash
curl -X POST http://localhost/api/v1/auth/logout \
  -b cookies.txt
```

#### Success Response

**Code**: `200 OK`

**Headers**:
```
Set-Cookie: mint_session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0
```

**Body**:
```json
{
  "message": "Logged out successfully"
}
```

---

### Get Current User

Retrieve the authenticated user's information.

**Endpoint**: `GET /api/v1/auth/user`

**Authentication**: Required

#### Example Request

```bash
curl http://localhost/api/v1/auth/user \
  -b cookies.txt
```

#### Success Response

**Code**: `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

#### Error Responses

**401 Unauthorized** - Not logged in or token expired
```json
{
  "error": "Unauthorized"
}
```

---

### List All Users

Retrieve all users in the system.

**Endpoint**: `GET /api/v1/users`

**Authentication**: Required

#### Example Request

```bash
curl http://localhost/api/v1/users \
  -b cookies.txt
```

#### Success Response

**Code**: `200 OK`

```json
{
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ],
  "total": 2
}
```

**Note**: Passwords are never included in responses.

---

### Search Users

Search for users by name or email.

**Endpoint**: `GET /api/v1/users/search`

**Authentication**: Required

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (min 1 char) |

#### Example Request

```bash
curl "http://localhost/api/v1/users/search?q=john" \
  -b cookies.txt
```

#### Success Response

**Code**: `200 OK`

```json
{
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "total": 1
}
```

#### Search Behavior

- Case-insensitive
- Searches in both `name` and `email` fields
- Partial match (uses regex)

#### Error Responses

**400 Bad Request** - Missing query parameter
```json
{
  "error": "Search query is required"
}
```

---

### Get User Profile

Retrieve a specific user's profile by ID.

**Endpoint**: `GET /api/v1/users/:id`

**Authentication**: Required

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | User's MongoDB ObjectId |

#### Example Request

```bash
curl http://localhost/api/v1/users/507f1f77bcf86cd799439011 \
  -b cookies.txt
```

#### Success Response

**Code**: `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

#### Error Responses

**404 Not Found** - User doesn't exist
```json
{
  "error": "User not found"
}
```

---

### Update Current User

Update the authenticated user's profile.

**Endpoint**: `PUT /api/v1/users/me`

**Authentication**: Required

#### Request Body

```json
{
  "name": "string (optional, min 2 chars)",
  "email": "string (optional, valid email)"
}
```

**Note**: At least one field must be provided.

#### Example Request

```bash
curl -X PUT http://localhost/api/v1/users/me \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "John Smith"
  }'
```

#### Success Response

**Code**: `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Smith",
  "email": "john@example.com",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T14:30:00.000Z"
}
```

#### Error Responses

**400 Bad Request** - Validation error
```json
{
  "error": "Name must be at least 2 characters"
}
```

**409 Conflict** - Email already in use
```json
{
  "error": "Email already in use"
}
```

---

### JWKS Endpoint

Retrieve the JSON Web Key Set for JWT verification.

**Endpoint**: `GET /.well-known/jwks.json`

**Authentication**: None required (public endpoint)

#### Example Request

```bash
curl http://localhost/.well-known/jwks.json
```

#### Success Response

**Code**: `200 OK`

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "mint-auth-key-1",
      "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx...",
      "e": "AQAB",
      "alg": "RS256"
    }
  ]
}
```

#### Usage

Other services use this endpoint to:
1. Fetch the public key
2. Verify JWT signatures
3. Validate tokens without contacting auth service

#### JWK Fields

- `kty`: Key type (RSA)
- `use`: Key usage (sig = signature)
- `kid`: Key ID for rotation
- `n`: RSA modulus
- `e`: RSA exponent
- `alg`: Algorithm (RS256)

---

### Health Check

Check if the auth service is healthy.

**Endpoint**: `GET /api/v1/auth/health`

**Authentication**: None required

#### Example Request

```bash
curl http://localhost/api/v1/auth/health
```

#### Success Response

**Code**: `200 OK`

```json
{
  "status": "healthy",
  "service": "auth-service",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## Error Responses

### Standard Error Format

All errors follow this format:

```json
{
  "error": "Error message",
  "details": []  // Optional, for validation errors
}
```

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| `200` | OK | Request succeeded |
| `201` | Created | Resource created (signup) |
| `400` | Bad Request | Validation error, malformed request |
| `401` | Unauthorized | Missing/invalid authentication |
| `403` | Forbidden | Valid auth but insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Resource already exists (duplicate email) |
| `500` | Internal Server Error | Server error |

### Common Error Messages

**Validation Errors**:
- "Name is required"
- "Email must be a valid email"
- "Password must be at least 8 characters"

**Authentication Errors**:
- "Invalid email or password"
- "Unauthorized"
- "Token expired"

**Resource Errors**:
- "User not found"
- "User with this email already exists"
- "Email already in use"

---

## Security Considerations

### Password Requirements

- Minimum 8 characters
- Stored using Argon2 hashing
- Never returned in API responses
- Cannot be retrieved (only reset)

### Cookie Security

- `HttpOnly`: JavaScript cannot access
- `Secure`: Only sent over HTTPS (production)
- `SameSite=Strict`: CSRF protection
- `Max-Age=604800`: 7 days expiry

### Rate Limiting

The API Gateway enforces:
- **10 requests/second** per IP
- **Burst of 20** for occasional spikes

Exceeding limits returns:
```
HTTP 429 Too Many Requests
```

### Best Practices

1. **Always use HTTPS in production**
2. **Never log passwords or tokens**
3. **Validate email format on client side**
4. **Handle 401 errors by redirecting to login**
5. **Store cookies securely (browser handles this)**

---

## Integration Examples

### JavaScript (Fetch API)

```javascript
// Register
const response = await fetch('http://localhost/api/v1/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});

const user = await response.json();

// Login
const loginResponse = await fetch('http://localhost/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important: Include cookies
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});

const userData = await loginResponse.json();

// Get current user
const userResponse = await fetch('http://localhost/api/v1/auth/user', {
  credentials: 'include' // Important: Include cookies
});

const currentUser = await userResponse.json();
```

### Python (Requests)

```python
import requests

# Register
response = requests.post('http://localhost/api/v1/auth/signup', json={
    'name': 'John Doe',
    'email': 'john@example.com',
    'password': 'SecurePass123!'
})

user = response.json()

# Login
session = requests.Session()
login_response = session.post('http://localhost/api/v1/auth/login', json={
    'email': 'john@example.com',
    'password': 'SecurePass123!'
})

# Session automatically includes cookies
user_response = session.get('http://localhost/api/v1/auth/user')
current_user = user_response.json()
```

---

## Related Documentation

- [Architecture Overview](../architecture.md)
- [Wallet API](wallet.md)
- [Transactions API](transactions.md)
- [Event Architecture](../events.md)
