# Wallet Service

The **Wallet Service** manages user wallet balances and processes wallet updates through event-driven architecture.

## Overview

- **Port**: 4003
- **Database**: `mint_wallet` (MongoDB)
- **Events Published**: `wallet.transactionFinalized`
- **Events Consumed**: `user.signup`, `transaction.completed`, `transaction.failed`

## Features

### Wallet Management
- Automatic wallet creation on user signup
- Real-time balance updates from transaction events
- Wallet balance retrieval
- Transaction history tracking

### Concurrency Handling
- Optimistic locking for concurrent transactions
- Atomic balance updates
- Automatic wallet reversal on failed transactions

## Technology Stack

- **Express.js** - Web framework
- **MongoDB/Mongoose** - Database ORM
- **RabbitMQ** - Event consumption & publishing
- **Jose** - JWT verification

## Key Endpoints

For detailed API documentation, see [Wallet API Reference](../api/wallet.md).

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/wallet/user` | GET | Get current user's wallet | Yes |

## Event Consumption

### user.signup

Creates a new wallet for the user.

**Action**: Creates wallet with initial balance (default: $0)

### transaction.completed

Updates wallet balances based on transaction type.

**Actions**:
- **Top-up**: Add amount to wallet
- **Transfer**: Deduct from sender, add to recipient

### transaction.failed

Reverts any wallet changes from failed transactions.

**Action**: Rollback balance changes

## Event Publishing

### wallet.transactionFinalized

Published after successfully updating wallet balances.

**Routing Key**: `wallet.transactionFinalized`

**Payload**:
```json
{
  "transactionId": "507f1f77bcf86cd799439013",
  "status": "completed"
}
```

**Consumers**:
- **Transactions Service** - Finalizes transaction state

## Database Schema

### Wallet Model

```typescript
{
  userId: ObjectId,      // Unique user reference
  balance: Number,       // Current balance
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `userId` (unique)

## Concurrency Control

### Optimistic Locking

Uses Mongoose versioning to prevent race conditions:

```typescript
wallet.balance += amount;
await wallet.save(); // Throws error if version mismatch
```

### Atomic Updates

All balance updates are atomic operations:

```typescript
await Wallet.updateOne(
  { userId, __v: currentVersion },
  { $inc: { balance: amount }, $inc: { __v: 1 } }
);
```

## Configuration

See [Configuration Guide](../getting-started/configuration.md#wallet-service-configuration) for environment variables.

## Related Documentation

- [Wallet API Reference](../api/wallet.md)
- [Event Architecture](../events.md)
- [Transactions Service](transactions.md)
