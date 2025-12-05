# Wallet API

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Get User Wallet](#get-user-wallet)
  - [Health Check](#health-check)
- [Wallet Object](#wallet-object)
- [Error Responses](#error-responses)
- [Integration Examples](#integration-examples)

---

## Overview

The Wallet API manages user wallet balances and transaction history. Wallets are automatically created when users register, and balances are updated through the event-driven transaction system.

### Key Features

- Automatic wallet creation on user signup
- Real-time balance updates via events
- Optimistic locking for concurrent transactions
- Automatic rollback on failed transactions
- Balance integrity guarantees

---

## Base URL

```
http://localhost/api/v1/wallet
```

All wallet endpoints are prefixed with `/api/v1/wallet`.

---

## Authentication

All wallet endpoints require authentication via HTTP-only cookie.

**Cookie Name**: `mint_session`

**Example**:
```http
Cookie: mint_session=<jwt-token>
```

The JWT token is obtained by logging in through the [Auth API](auth.md#login).

---

## Endpoints

### Get User Wallet

Retrieve the authenticated user's wallet information.

**Endpoint**: `GET /api/v1/wallet/user`

**Authentication**: Required

#### Example Request

```bash
curl http://localhost/api/v1/wallet/user \
  -b cookies.txt
```

#### Success Response

**Code**: `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "balance": 150.00,
  "createdAt": "2025-01-15T10:30:05.000Z",
  "updatedAt": "2025-01-15T12:45:30.000Z"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Wallet's unique identifier |
| `userId` | string | User who owns the wallet |
| `balance` | number | Current balance (always >= 0) |
| `createdAt` | string | ISO 8601 timestamp of creation |
| `updatedAt` | string | ISO 8601 timestamp of last update |

#### Balance Precision

- Stored as floating-point number
- 2 decimal places for currency
- Minimum: `0.00`
- Maximum: No limit (in practice, JavaScript safe integer limit)

#### Error Responses

**401 Unauthorized** - Not logged in
```json
{
  "error": "Unauthorized"
}
```

**404 Not Found** - Wallet not found (shouldn't happen if user exists)
```json
{
  "error": "Wallet not found"
}
```

---

### Health Check

Check if the wallet service is healthy.

**Endpoint**: `GET /api/v1/wallet/health`

**Authentication**: None required

#### Example Request

```bash
curl http://localhost/api/v1/wallet/health
```

#### Success Response

**Code**: `200 OK`

```json
{
  "status": "healthy",
  "service": "wallet-service",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## Wallet Object

### Wallet Schema

```typescript
{
  id: string;           // MongoDB ObjectId
  userId: string;       // Reference to User
  balance: number;      // Current balance
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
  version: number;      // For optimistic locking (internal)
}
```

### Wallet Lifecycle

1. **Creation**
   - Triggered by `user.signup` event
   - Initial balance: `0.00` (configurable via `INITIAL_WALLET_BALANCE`)
   - Happens asynchronously after user registration

2. **Updates**
   - Top-up: Balance increases
   - Transfer (sender): Balance decreases
   - Transfer (recipient): Balance increases
   - All updates are event-driven

3. **Constraints**
   - Balance cannot go negative
   - Concurrent updates handled with optimistic locking
   - Updates are atomic

---

## Balance Updates

Balance updates happen through the event system, not direct API calls.

### Update Flow

```
1. User creates transaction via Transactions API
2. Transaction service publishes transaction.completed
3. Wallet service consumes event
4. Wallet service updates balance(s)
5. Wallet service publishes wallet.transactionFinalized
```

### Concurrency Handling

The wallet service uses **optimistic locking** to handle concurrent transactions:

```typescript
// Pseudocode
async function updateBalance(userId, amount) {
  const wallet = await Wallet.findOne({ userId });

  // Update with version check
  const result = await Wallet.updateOne(
    { _id: wallet.id, version: wallet.version },
    {
      balance: wallet.balance + amount,
      version: wallet.version + 1
    }
  );

  if (result.modifiedCount === 0) {
    // Version conflict - retry
    throw new ConcurrencyError();
  }
}
```

### Balance Validation

- **Before Transfer**: Transaction service validates sender has sufficient balance
- **During Update**: Wallet service ensures balance >= 0
- **After Update**: Balance is never negative

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message"
}
```

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| `200` | OK | Request succeeded |
| `401` | Unauthorized | Missing/invalid authentication |
| `404` | Not Found | Wallet doesn't exist |
| `500` | Internal Server Error | Server error |

### Common Errors

**Wallet Not Found**:
```json
{
  "error": "Wallet not found"
}
```

**Unauthorized**:
```json
{
  "error": "Unauthorized"
}
```

---

## Integration Examples

### JavaScript (Fetch API)

```javascript
// Get wallet
const response = await fetch('http://localhost/api/v1/wallet/user', {
  credentials: 'include' // Include auth cookie
});

const wallet = await response.json();
console.log(`Balance: $${wallet.balance}`);

// Poll for balance updates (simple approach)
async function pollBalance() {
  const response = await fetch('http://localhost/api/v1/wallet/user', {
    credentials: 'include'
  });
  const wallet = await response.json();
  updateUI(wallet.balance);
}

// Poll every 5 seconds
setInterval(pollBalance, 5000);
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = async () => {
    try {
      const response = await fetch('http://localhost/api/v1/wallet/user', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wallet');
      }

      const data = await response.json();
      setWallet(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();

    // Poll every 5 seconds
    const interval = setInterval(fetchWallet, 5000);

    return () => clearInterval(interval);
  }, []);

  return { wallet, loading, error, refetch: fetchWallet };
}

// Usage
function WalletDisplay() {
  const { wallet, loading, error } = useWallet();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!wallet) return null;

  return (
    <div>
      <h2>Your Balance</h2>
      <p>${wallet.balance.toFixed(2)}</p>
    </div>
  );
}
```

### Python (Requests)

```python
import requests

session = requests.Session()

# Login first
session.post('http://localhost/api/v1/auth/login', json={
    'email': 'john@example.com',
    'password': 'SecurePass123!'
})

# Get wallet
response = session.get('http://localhost/api/v1/wallet/user')
wallet = response.json()

print(f"Balance: ${wallet['balance']:.2f}")
```

### cURL Complete Flow

```bash
# 1. Login
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt

# 2. Get wallet
curl http://localhost/api/v1/wallet/user \
  -b cookies.txt

# 3. Top-up wallet
curl -X POST http://localhost/api/v1/transactions/topup \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "amount": 100.00,
    "description": "Adding funds"
  }'

# 4. Wait a moment for async processing

# 5. Check updated balance
curl http://localhost/api/v1/wallet/user \
  -b cookies.txt
```

---

## Real-Time Updates

The wallet balance updates asynchronously. Here are strategies for keeping the UI in sync:

### 1. Polling (Simple)

```javascript
// Poll every 5 seconds
setInterval(async () => {
  const wallet = await fetchWallet();
  updateUI(wallet.balance);
}, 5000);
```

**Pros**: Simple, works everywhere
**Cons**: Delayed updates, unnecessary requests

### 2. Optimistic Updates (Recommended)

```javascript
async function topUp(amount) {
  // Update UI immediately
  setBalance(prevBalance => prevBalance + amount);

  // Create transaction
  await fetch('/api/v1/transactions/topup', {
    method: 'POST',
    body: JSON.stringify({ amount })
  });

  // Refresh after a delay
  setTimeout(async () => {
    const wallet = await fetchWallet();
    setBalance(wallet.balance); // Sync with server
  }, 2000);
}
```

**Pros**: Immediate feedback, better UX
**Cons**: Briefly out of sync

### 3. WebSockets (Future Enhancement)

```javascript
// Future: Real-time updates via WebSocket
const ws = new WebSocket('ws://localhost/wallet/updates');

ws.on('balance_updated', (data) => {
  setBalance(data.newBalance);
});
```

**Pros**: Real-time, efficient
**Cons**: Requires WebSocket support (future feature)

---

## Best Practices

### 1. Handle Loading States

```javascript
if (loading) {
  return <Spinner />;
}
```

### 2. Display Balance Correctly

```javascript
// Always format to 2 decimal places
const formatted = wallet.balance.toFixed(2);
```

### 3. Refresh After Transactions

```javascript
await createTransaction();
await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
await refreshWallet(); // Get updated balance
```

### 4. Handle Errors Gracefully

```javascript
try {
  const wallet = await fetchWallet();
} catch (error) {
  if (error.status === 401) {
    redirectToLogin();
  } else {
    showErrorMessage('Failed to load wallet');
  }
}
```

### 5. Cache Wallet Data

```javascript
// Don't fetch on every render
const { data: wallet } = useQuery('wallet', fetchWallet, {
  staleTime: 5000, // Cache for 5 seconds
  refetchInterval: 10000 // Refresh every 10 seconds
});
```

---

## Limitations

### Current Limitations

1. **No Transaction History**: Use [Transactions API](transactions.md) for history
2. **Single Currency**: Only one balance per user (no multi-currency)
3. **No Manual Balance Adjustment**: Balances only change via transactions
4. **No Balance Locks**: Cannot lock funds for pending transactions

### Future Enhancements

- [ ] Transaction history in wallet response
- [ ] Multi-currency support
- [ ] Balance holds for pending transactions
- [ ] WebSocket real-time updates
- [ ] Wallet statements/exports

---

## Security Considerations

### Authentication

- All endpoints require valid JWT token
- Tokens expire after 7 days
- Users can only access their own wallet

### Authorization

- No cross-user wallet access
- Admin endpoints not yet implemented
- Balance cannot be directly modified (only via transactions)

### Data Validation

- Balance is always non-negative
- Concurrent updates are handled safely
- Version conflicts are retried automatically

---

## Troubleshooting

### Wallet Not Found

**Problem**: `404 Wallet not found`

**Cause**: Wallet creation event may not have processed yet

**Solution**:
- Wait a few seconds after signup
- Check RabbitMQ for pending messages
- Verify wallet service is running

### Balance Not Updating

**Problem**: Balance hasn't changed after transaction

**Cause**: Async event processing delay

**Solution**:
- Wait 1-2 seconds for events to process
- Check transaction status via Transactions API
- Verify wallet service is consuming events

### Unauthorized Errors

**Problem**: `401 Unauthorized`

**Cause**: Missing or expired JWT token

**Solution**:
- Login again to get fresh token
- Ensure cookies are enabled
- Check token expiration (7 days)

---

## Related Documentation

- [Authentication API](auth.md) - Login and user management
- [Transactions API](transactions.md) - Create transactions
- [Event Architecture](../events.md) - How balance updates work
- [Architecture Overview](../architecture.md) - System design
