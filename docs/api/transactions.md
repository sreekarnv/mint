# Transactions API

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Create Top-Up Transaction](#create-top-up-transaction)
  - [Create Transfer Transaction](#create-transfer-transaction)
  - [List Transactions](#list-transactions)
  - [Get Transaction Details](#get-transaction-details)
  - [Health Check](#health-check)
- [Transaction Object](#transaction-object)
- [Transaction States](#transaction-states)
- [Transaction Lifecycle](#transaction-lifecycle)
- [Error Responses](#error-responses)
- [Integration Examples](#integration-examples)

---

## Overview

The Transactions API handles financial transactions including top-ups (adding funds) and transfers (sending money between users). Transactions are processed asynchronously through an event-driven workflow.

### Key Features

- Top-up transactions to add funds
- Transfer transactions between users
- Event-driven processing
- Automatic rollback on failures
- Transaction history with filtering
- Idempotency support

---

## Base URL

```
http://localhost/api/v1/transactions
```

All transaction endpoints are prefixed with `/api/v1/transactions`.

---

## Authentication

All transaction endpoints require authentication via HTTP-only cookie.

**Cookie Name**: `mint_session`

**Example**:
```http
Cookie: mint_session=<jwt-token>
```

---

## Endpoints

### Create Top-Up Transaction

Add funds to your wallet.

**Endpoint**: `POST /api/v1/transactions/topup`

**Authentication**: Required

#### Request Body

```json
{
  "amount": number,        // Required, > 0
  "description": string    // Optional
}
```

#### Validation Rules

- `amount`: Must be a positive number (> 0)
- `description`: Optional string, max 500 characters

#### Example Request

```bash
curl -X POST http://localhost/api/v1/transactions/topup \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "amount": 100.00,
    "description": "Adding funds to wallet"
  }'
```

#### Success Response

**Code**: `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439013",
  "type": "topup",
  "userId": "507f1f77bcf86cd799439011",
  "amount": 100.00,
  "description": "Adding funds to wallet",
  "status": "pending",
  "createdAt": "2025-01-15T11:00:00.000Z"
}
```

#### Processing Flow

1. Transaction created with `pending` status
2. `transaction.created` event published
3. Transaction validated and updated to `processing`
4. `transaction.completed` event published
5. Wallet balance updated
6. Transaction finalized to `completed`
7. Success email sent

**Typical processing time**: 100-500ms

#### Error Responses

**400 Bad Request** - Invalid amount
```json
{
  "error": "Amount must be greater than 0"
}
```

**401 Unauthorized** - Not logged in
```json
{
  "error": "Unauthorized"
}
```

---

### Create Transfer Transaction

Transfer money to another user.

**Endpoint**: `POST /api/v1/transactions/transfer`

**Authentication**: Required

#### Request Body

```json
{
  "recipientId": string,   // Required, valid user ID
  "amount": number,        // Required, > 0
  "description": string    // Optional
}
```

#### Validation Rules

- `recipientId`: Must be a valid MongoDB ObjectId of an existing user
- `amount`: Must be positive (> 0)
- `description`: Optional string, max 500 characters
- Sender must have sufficient balance

#### Example Request

```bash
curl -X POST http://localhost/api/v1/transactions/transfer \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "recipientId": "507f1f77bcf86cd799439020",
    "amount": 50.00,
    "description": "Payment for services"
  }'
```

#### Success Response

**Code**: `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439014",
  "type": "transfer",
  "userId": "507f1f77bcf86cd799439011",
  "recipientId": "507f1f77bcf86cd799439020",
  "amount": 50.00,
  "description": "Payment for services",
  "status": "pending",
  "createdAt": "2025-01-15T11:15:00.000Z"
}
```

#### Processing Flow

1. Transaction created with `pending` status
2. `transaction.created` event published
3. Sender balance validated
4. If sufficient:
   - Status updated to `processing`
   - `transaction.completed` event published
   - Sender balance decreased
   - Recipient balance increased
   - Status updated to `completed`
   - Success email sent
5. If insufficient:
   - `transaction.failed` event published
   - Status updated to `failed`
   - Failure email sent

#### Error Responses

**400 Bad Request** - Invalid recipient or amount
```json
{
  "error": "Recipient ID is required"
}
```

```json
{
  "error": "Amount must be greater than 0"
}
```

**404 Not Found** - Recipient doesn't exist
```json
{
  "error": "Recipient not found"
}
```

**400 Bad Request** - Insufficient balance (returned later after processing)
```json
{
  "error": "Insufficient balance",
  "details": {
    "required": 50.00,
    "available": 25.00
  }
}
```

**Note**: Insufficient balance is detected during async processing, not immediately.

---

### List Transactions

Retrieve transaction history for the authenticated user.

**Endpoint**: `GET /api/v1/transactions`

**Authentication**: Required

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Number of transactions to return (1-100) |
| `offset` | number | 0 | Number of transactions to skip |
| `type` | string | all | Filter by type: `topup`, `transfer`, or `all` |
| `status` | string | all | Filter by status: `pending`, `processing`, `completed`, `failed`, or `all` |

#### Example Request

```bash
# Get all transactions
curl http://localhost/api/v1/transactions \
  -b cookies.txt

# Get only completed transfers
curl "http://localhost/api/v1/transactions?type=transfer&status=completed" \
  -b cookies.txt

# Pagination
curl "http://localhost/api/v1/transactions?limit=10&offset=20" \
  -b cookies.txt
```

#### Success Response

**Code**: `200 OK`

```json
{
  "transactions": [
    {
      "id": "507f1f77bcf86cd799439014",
      "type": "transfer",
      "userId": "507f1f77bcf86cd799439011",
      "recipientId": "507f1f77bcf86cd799439020",
      "amount": 50.00,
      "description": "Payment for services",
      "status": "completed",
      "createdAt": "2025-01-15T11:15:00.000Z",
      "completedAt": "2025-01-15T11:15:02.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439013",
      "type": "topup",
      "userId": "507f1f77bcf86cd799439011",
      "amount": 100.00,
      "description": "Adding funds",
      "status": "completed",
      "createdAt": "2025-01-15T11:00:00.000Z",
      "completedAt": "2025-01-15T11:00:01.000Z"
    }
  ],
  "total": 2,
  "limit": 50,
  "offset": 0
}
```

#### Response Fields

| Field | Description |
|-------|-------------|
| `transactions` | Array of transaction objects |
| `total` | Total number of transactions (for pagination) |
| `limit` | Number of transactions returned |
| `offset` | Number of transactions skipped |

#### Sorting

Transactions are sorted by `createdAt` in descending order (newest first).

---

### Get Transaction Details

Retrieve details of a specific transaction.

**Endpoint**: `GET /api/v1/transactions/:id`

**Authentication**: Required

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Transaction's MongoDB ObjectId |

#### Example Request

```bash
curl http://localhost/api/v1/transactions/507f1f77bcf86cd799439013 \
  -b cookies.txt
```

#### Success Response

**Code**: `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439013",
  "type": "topup",
  "userId": "507f1f77bcf86cd799439011",
  "amount": 100.00,
  "description": "Adding funds",
  "status": "completed",
  "createdAt": "2025-01-15T11:00:00.000Z",
  "completedAt": "2025-01-15T11:00:01.000Z"
}
```

#### Authorization

Users can only view their own transactions (where they are sender or recipient).

#### Error Responses

**404 Not Found** - Transaction doesn't exist or user doesn't have access
```json
{
  "error": "Transaction not found"
}
```

---

### Health Check

Check if the transactions service is healthy.

**Endpoint**: `GET /api/v1/transactions/health`

**Authentication**: None required

#### Example Request

```bash
curl http://localhost/api/v1/transactions/health
```

#### Success Response

**Code**: `200 OK`

```json
{
  "status": "healthy",
  "service": "transactions-service",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## Transaction Object

### Transaction Schema

```typescript
{
  id: string;              // MongoDB ObjectId
  type: 'topup' | 'transfer';
  userId: string;          // Sender/initiator
  recipientId?: string;    // Only for transfers
  amount: number;          // Transaction amount
  description?: string;    // Optional description
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;      // When finalized
  failedAt?: Date;         // If failed
  failureReason?: string;  // Why it failed
}
```

### Field Details

**type**:
- `topup`: Add funds to own wallet
- `transfer`: Send funds to another user

**userId**:
- For top-up: The user adding funds
- For transfer: The sender

**recipientId**:
- Only present for transfers
- The user receiving funds

**status**:
- `pending`: Just created, queued
- `processing`: Being processed
- `completed`: Successfully finished
- `failed`: Failed (insufficient balance, etc.)

**amount**:
- Always positive
- Stored as number with 2 decimal precision
- Represents the transaction amount

---

## Transaction States

### State Diagram

```
┌─────────┐
│ PENDING │  Created and queued
└────┬────┘
     │
     ▼
┌────────────┐
│ PROCESSING │  Being validated
└─────┬──────┘
      │
      ├──────────────┐
      │              │
      ▼              ▼
┌───────────┐  ┌─────────┐
│ COMPLETED │  │ FAILED  │
└───────────┘  └─────────┘
```

### State Descriptions

**PENDING**
- Transaction just created
- Queued for processing
- Not yet validated
- User sees this immediately after creation

**PROCESSING**
- Being validated
- Balance checks happening
- Wallet updates in progress
- Typically lasts 100-500ms

**COMPLETED**
- Successfully processed
- Wallet balances updated
- Confirmation email sent
- Terminal state (won't change)

**FAILED**
- Validation or processing failed
- Common reasons:
  - Insufficient balance
  - Recipient doesn't exist
  - System error
- Failure email sent
- Terminal state (won't change)

---

## Transaction Lifecycle

### Top-Up Lifecycle

```
1. Client → POST /transactions/topup
2. Create transaction (PENDING)
3. Publish transaction.created event
4. Return to client ✅

--- Async Processing Begins ---

5. Consume transaction.created
6. Validate transaction
7. Update status (PROCESSING)
8. Publish transaction.completed
9. Wallet consumes event
10. Wallet increases balance
11. Wallet publishes wallet.transactionFinalized
12. Transaction consumes event
13. Update status (COMPLETED)
14. Notification service sends email
```

### Transfer Lifecycle (Success)

```
1. Client → POST /transactions/transfer
2. Create transaction (PENDING)
3. Publish transaction.created event
4. Return to client ✅

--- Async Processing Begins ---

5. Consume transaction.created
6. Validate sender balance
7. Sufficient balance ✓
8. Update status (PROCESSING)
9. Publish transaction.completed
10. Wallet consumes event
11. Wallet decreases sender balance
12. Wallet increases recipient balance
13. Wallet publishes wallet.transactionFinalized
14. Transaction consumes event
15. Update status (COMPLETED)
16. Notification service sends emails
```

### Transfer Lifecycle (Failure)

```
1. Client → POST /transactions/transfer
2. Create transaction (PENDING)
3. Publish transaction.created event
4. Return to client ✅

--- Async Processing Begins ---

5. Consume transaction.created
6. Validate sender balance
7. Insufficient balance ✗
8. Publish transaction.failed
9. Wallet consumes event (revert if needed)
10. Update status (FAILED)
11. Notification service sends failure email
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message",
  "details": {}  // Optional additional info
}
```

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| `200` | OK | List/get succeeded |
| `201` | Created | Transaction created |
| `400` | Bad Request | Validation error |
| `401` | Unauthorized | Not authenticated |
| `404` | Not Found | Transaction/recipient not found |
| `500` | Internal Server Error | Server error |

### Common Errors

**Validation Errors**:
```json
{
  "error": "Amount must be greater than 0"
}
```

```json
{
  "error": "Recipient ID is required"
}
```

**Not Found**:
```json
{
  "error": "Recipient not found"
}
```

**Insufficient Balance** (async, check transaction status):
```json
{
  "error": "Insufficient balance",
  "details": {
    "required": 50.00,
    "available": 25.00
  }
}
```

---

## Integration Examples

### JavaScript (Fetch API)

```javascript
// Top-up
async function topUp(amount, description) {
  const response = await fetch('http://localhost/api/v1/transactions/topup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ amount, description })
  });

  const transaction = await response.json();
  return transaction;
}

// Transfer
async function transfer(recipientId, amount, description) {
  const response = await fetch('http://localhost/api/v1/transactions/transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ recipientId, amount, description })
  });

  const transaction = await response.json();
  return transaction;
}

// List transactions
async function getTransactions(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(
    `http://localhost/api/v1/transactions?${params}`,
    { credentials: 'include' }
  );

  const data = await response.json();
  return data.transactions;
}

// Usage
const transaction = await topUp(100, 'Adding funds');
console.log(`Transaction ${transaction.id} created with status: ${transaction.status}`);

// Wait for completion
await new Promise(resolve => setTimeout(resolve, 1000));

// Check status
const updated = await fetch(`http://localhost/api/v1/transactions/${transaction.id}`, {
  credentials: 'include'
}).then(r => r.json());

console.log(`Status: ${updated.status}`);
```

### React Component Example

```typescript
import { useState } from 'react';

function TransferForm() {
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost/api/v1/transactions/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipientId,
          amount: parseFloat(amount),
          description
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const transaction = await response.json();
      alert(`Transaction created: ${transaction.id}`);

      // Reset form
      setRecipientId('');
      setAmount('');
      setDescription('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Recipient ID"
        value={recipientId}
        onChange={(e) => setRecipientId(e.target.value)}
        required
      />

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="0.01"
        step="0.01"
        required
      />

      <input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Send Money'}
      </button>

      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

### Python (Requests)

```python
import requests
import time

session = requests.Session()

# Login
session.post('http://localhost/api/v1/auth/login', json={
    'email': 'john@example.com',
    'password': 'SecurePass123!'
})

# Top-up
response = session.post('http://localhost/api/v1/transactions/topup', json={
    'amount': 100.00,
    'description': 'Adding funds'
})

transaction = response.json()
print(f"Created transaction: {transaction['id']}")
print(f"Status: {transaction['status']}")

# Wait for processing
time.sleep(1)

# Check status
updated = session.get(f"http://localhost/api/v1/transactions/{transaction['id']}")
print(f"Updated status: {updated.json()['status']}")

# List transactions
transactions = session.get('http://localhost/api/v1/transactions').json()
print(f"Total transactions: {transactions['total']}")
```

---

## Best Practices

### 1. Wait for Completion

```javascript
// ✅ Good: Wait and check status
const transaction = await createTransaction();
await new Promise(resolve => setTimeout(resolve, 1000));
const updated = await getTransaction(transaction.id);

if (updated.status === 'completed') {
  showSuccess();
} else if (updated.status === 'failed') {
  showError(updated.failureReason);
}

// ❌ Bad: Assume immediate completion
const transaction = await createTransaction();
showSuccess(); // Transaction might still be pending!
```

### 2. Handle Async Nature

```javascript
// Poll for status
async function waitForCompletion(transactionId) {
  for (let i = 0; i < 10; i++) {
    const tx = await getTransaction(transactionId);

    if (tx.status === 'completed' || tx.status === 'failed') {
      return tx;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error('Transaction timeout');
}
```

### 3. Validate Before Sending

```javascript
// Check balance before transfer
const wallet = await getWallet();

if (wallet.balance < amount) {
  alert('Insufficient balance');
  return;
}

await createTransfer(recipientId, amount);
```

### 4. Display Amount Correctly

```javascript
// Always format to 2 decimal places
const formatted = `$${transaction.amount.toFixed(2)}`;
```

### 5. Handle Errors Gracefully

```javascript
try {
  await createTransaction();
} catch (error) {
  if (error.message.includes('Insufficient balance')) {
    alert('You don't have enough funds');
  } else if (error.message.includes('Recipient not found')) {
    alert('Invalid recipient ID');
  } else {
    alert('Transaction failed. Please try again.');
  }
}
```

---

## Security Considerations

- **Authorization**: Users can only create transactions for themselves
- **Balance Validation**: Checked before transfers
- **Idempotency**: Duplicate submissions create separate transactions (future: add idempotency keys)
- **Rate Limiting**: Enforced at API gateway level

---

## Related Documentation

- [Authentication API](auth.md) - Login and user management
- [Wallet API](wallet.md) - Check balance
- [Event Architecture](../events.md) - Transaction processing flow
- [Architecture Overview](../architecture.md) - System design
