# Event Architecture

## Table of Contents

- [Overview](#overview)
- [RabbitMQ Setup](#rabbitmq-setup)
- [Exchanges](#exchanges)
- [Queues & Bindings](#queues--bindings)
- [Event Schemas](#event-schemas)
- [Event Flows](#event-flows)
- [Transaction Lifecycle](#transaction-lifecycle)
- [Best Practices](#best-practices)

---

## Overview

Mint uses **RabbitMQ** as the message broker for asynchronous, event-driven communication between microservices. This enables loose coupling, scalability, and resilience.

### Key Benefits

- **Decoupling**: Services don't need to know about each other
- **Reliability**: Messages are persisted until consumed
- **Scalability**: Multiple consumers can process events in parallel
- **Resilience**: Services can fail and recover without message loss
- **Flexibility**: Easy to add new consumers for existing events

### Messaging Pattern

The system uses **Topic Exchanges** with the **publish-subscribe** pattern:

1. **Publisher** sends events to an exchange with a routing key
2. **Exchange** routes messages to queues based on routing key patterns
3. **Consumer** processes messages from queues
4. **Acknowledgment** confirms successful processing

---

## RabbitMQ Setup

### Connection Configuration

All services connect to RabbitMQ using:

```env
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

### Management UI

Access RabbitMQ Management interface:
- **URL**: http://localhost:15672
- **Username**: `guest`
- **Password**: `guest`

Features:
- View exchanges, queues, and bindings
- Monitor message rates
- View message contents
- Purge queues
- Monitor connections and channels

---

## Exchanges

The system uses **two topic exchanges**:

### 1. `auth.events`

**Type**: Topic
**Durability**: Durable (survives broker restart)

**Purpose**: Authentication and user-related events

**Routing Keys**:
- `user.signup` - New user registration

**Publishers**:
- Auth Service

**Consumers**:
- Wallet Service (creates wallet)
- Notifications Service (sends welcome email)

---

### 2. `transaction.events`

**Type**: Topic
**Durability**: Durable

**Purpose**: Transaction lifecycle events

**Routing Keys**:
- `transaction.created` - New transaction initiated
- `transaction.completed` - Transaction succeeded
- `transaction.failed` - Transaction failed
- `wallet.transactionFinalized` - Wallet updates completed

**Publishers**:
- Transactions Service
- Wallet Service

**Consumers**:
- Transactions Service
- Wallet Service
- Notifications Service

---

## Queues & Bindings

### Queue Overview

| Queue | Exchange | Routing Key | Consumer | Description |
|-------|----------|-------------|----------|-------------|
| `email.signup.q` | `auth.events` | `user.signup` | Notifications | Welcome emails |
| `wallet.user.q` | `auth.events` | `user.signup` | Wallet | Wallet creation |
| `transaction.created.q` | `transaction.events` | `transaction.created` | Transactions | Transaction processing |
| `wallet.update.q` | `transaction.events` | `transaction.completed` | Wallet | Balance updates |
| `wallet.revert.q` | `transaction.events` | `transaction.failed` | Wallet | Rollback balances |
| `email.transactionCompleted.q` | `transaction.events` | `transaction.completed` | Notifications | Success emails |
| `email.transactionFailed.q` | `transaction.events` | `transaction.failed` | Notifications | Failure emails |
| `transaction.finalized.q` | `transaction.events` | `wallet.transactionFinalized` | Transactions | Finalize state |

### Queue Properties

All queues are configured with:
- **Durable**: `true` - Survives broker restart
- **Auto-delete**: `false` - Persists even if no consumers
- **Message TTL**: None - Messages never expire
- **Max Length**: None - No size limit

---

## Event Schemas

### 1. user.signup

Published by: **Auth Service**
Consumed by: **Wallet Service, Notifications Service**

```typescript
{
  userId: string;      // MongoDB ObjectId as string
  name: string;        // User's full name
  email: string;       // User's email address
  createdAt: Date;     // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

---

### 2. transaction.created

Published by: **Transactions Service**
Consumed by: **Transactions Service** (self-consumption)

```typescript
{
  transactionId: string;     // MongoDB ObjectId
  type: 'topup' | 'transfer';
  userId: string;            // Sender/initiator
  recipientId?: string;      // For transfers only
  amount: number;            // Transaction amount
  description?: string;      // Optional description
  createdAt: Date;
}
```

**Example (Top-up)**:
```json
{
  "transactionId": "507f1f77bcf86cd799439013",
  "type": "topup",
  "userId": "507f1f77bcf86cd799439011",
  "amount": 100.00,
  "description": "Adding funds",
  "createdAt": "2025-01-15T11:00:00Z"
}
```

**Example (Transfer)**:
```json
{
  "transactionId": "507f1f77bcf86cd799439014",
  "type": "transfer",
  "userId": "507f1f77bcf86cd799439011",
  "recipientId": "507f1f77bcf86cd799439020",
  "amount": 50.00,
  "description": "Payment for services",
  "createdAt": "2025-01-15T11:15:00Z"
}
```

---

### 3. transaction.completed

Published by: **Transactions Service**
Consumed by: **Wallet Service, Notifications Service**

```typescript
{
  transactionId: string;
  type: 'topup' | 'transfer';
  userId: string;
  recipientId?: string;
  amount: number;
  description?: string;
  completedAt: Date;
}
```

**Example**:
```json
{
  "transactionId": "507f1f77bcf86cd799439013",
  "type": "topup",
  "userId": "507f1f77bcf86cd799439011",
  "amount": 100.00,
  "description": "Adding funds",
  "completedAt": "2025-01-15T11:00:05Z"
}
```

---

### 4. transaction.failed

Published by: **Transactions Service**
Consumed by: **Wallet Service, Notifications Service**

```typescript
{
  transactionId: string;
  type: 'topup' | 'transfer';
  userId: string;
  recipientId?: string;
  amount: number;
  reason: string;          // Failure reason
  failedAt: Date;
}
```

**Example**:
```json
{
  "transactionId": "507f1f77bcf86cd799439014",
  "type": "transfer",
  "userId": "507f1f77bcf86cd799439011",
  "recipientId": "507f1f77bcf86cd799439020",
  "amount": 50.00,
  "reason": "Insufficient balance",
  "failedAt": "2025-01-15T11:15:03Z"
}
```

---

### 5. wallet.transactionFinalized

Published by: **Wallet Service**
Consumed by: **Transactions Service**

```typescript
{
  transactionId: string;
  userId: string;
  success: boolean;       // Whether wallet update succeeded
  finalizedAt: Date;
}
```

**Example**:
```json
{
  "transactionId": "507f1f77bcf86cd799439013",
  "userId": "507f1f77bcf86cd799439011",
  "success": true,
  "finalizedAt": "2025-01-15T11:00:06Z"
}
```

---

## Event Flows

### User Registration Flow

```mermaid
sequenceDiagram
    participant Client
    participant Auth
    participant RabbitMQ
    participant Wallet
    participant Notifications

    Client->>Auth: POST /api/v1/auth/signup
    Auth->>Auth: Create user in auth_db
    Auth->>RabbitMQ: Publish user.signup
    Auth->>Client: Return user info

    RabbitMQ->>Wallet: Consume user.signup
    Wallet->>Wallet: Create wallet in wallet_db

    RabbitMQ->>Notifications: Consume user.signup
    Notifications->>Notifications: Send welcome email
```

**Timeline**:
1. User submits registration (0ms)
2. Auth creates user and returns (50ms) ✅ **User sees response**
3. Wallet creates wallet (200ms)
4. Email sent (500ms)

**Benefits**: User gets immediate feedback. Wallet and email happen asynchronously.

---

### Top-Up Transaction Flow

```mermaid
sequenceDiagram
    participant Client
    participant Transactions
    participant RabbitMQ
    participant Wallet
    participant Notifications

    Client->>Transactions: POST /transactions/topup
    Transactions->>Transactions: Create PENDING transaction
    Transactions->>RabbitMQ: Publish transaction.created
    Transactions->>Client: Return transaction ID

    RabbitMQ->>Transactions: Consume transaction.created
    Transactions->>Transactions: Update to PROCESSING
    Transactions->>RabbitMQ: Publish transaction.completed

    RabbitMQ->>Wallet: Consume transaction.completed
    Wallet->>Wallet: Update balance
    Wallet->>RabbitMQ: Publish wallet.transactionFinalized

    RabbitMQ->>Transactions: Consume wallet.transactionFinalized
    Transactions->>Transactions: Update to COMPLETED

    RabbitMQ->>Notifications: Consume transaction.completed
    Notifications->>Notifications: Send success email
```

**States**:
1. `PENDING` - Transaction created
2. `PROCESSING` - Being processed
3. `COMPLETED` - Successfully completed

---

### Transfer Transaction Flow (Success)

```mermaid
sequenceDiagram
    participant Client
    participant Transactions
    participant RabbitMQ
    participant Wallet
    participant Notifications

    Client->>Transactions: POST /transactions/transfer
    Transactions->>Transactions: Create PENDING transaction
    Transactions->>RabbitMQ: Publish transaction.created
    Transactions->>Client: Return transaction ID

    RabbitMQ->>Transactions: Consume transaction.created
    Transactions->>Transactions: Validate sender balance
    Transactions->>Transactions: Update to PROCESSING
    Transactions->>RabbitMQ: Publish transaction.completed

    RabbitMQ->>Wallet: Consume transaction.completed
    Wallet->>Wallet: Deduct from sender
    Wallet->>Wallet: Add to recipient
    Wallet->>RabbitMQ: Publish wallet.transactionFinalized

    RabbitMQ->>Transactions: Consume wallet.transactionFinalized
    Transactions->>Transactions: Update to COMPLETED

    RabbitMQ->>Notifications: Consume transaction.completed
    Notifications->>Notifications: Send success email
```

---

### Transfer Transaction Flow (Failure)

```mermaid
sequenceDiagram
    participant Client
    participant Transactions
    participant RabbitMQ
    participant Wallet
    participant Notifications

    Client->>Transactions: POST /transactions/transfer
    Transactions->>Transactions: Create PENDING transaction
    Transactions->>RabbitMQ: Publish transaction.created
    Transactions->>Client: Return transaction ID

    RabbitMQ->>Transactions: Consume transaction.created
    Transactions->>Transactions: Validate sender balance
    Transactions->>Transactions: Insufficient balance!
    Transactions->>RabbitMQ: Publish transaction.failed

    RabbitMQ->>Wallet: Consume transaction.failed
    Wallet->>Wallet: Revert any changes (if any)

    Transactions->>Transactions: Update to FAILED

    RabbitMQ->>Notifications: Consume transaction.failed
    Notifications->>Notifications: Send failure email
```

---

## Transaction Lifecycle

### State Transitions

```
┌─────────┐
│ PENDING │  Transaction created, queued for processing
└────┬────┘
     │
     ▼
┌────────────┐
│ PROCESSING │  Being validated and processed
└─────┬──────┘
      │
      ├──────────────┐
      │              │
      ▼              ▼
┌───────────┐  ┌─────────┐
│ COMPLETED │  │ FAILED  │
└───────────┘  └─────────┘
```

### Processing Steps

1. **Create Transaction** (PENDING)
   - Validate request
   - Store in database
   - Publish `transaction.created`
   - Return to client

2. **Process Transaction** (PROCESSING)
   - Validate business rules
   - Check balances
   - Determine success/failure
   - Publish `transaction.completed` or `transaction.failed`

3. **Update Wallets**
   - Apply balance changes
   - Handle concurrency with optimistic locking
   - Publish `wallet.transactionFinalized`

4. **Finalize Transaction** (COMPLETED/FAILED)
   - Update final state
   - Store completion timestamp

5. **Notify User**
   - Send email notification
   - Log notification delivery

---

## Best Practices

### Message Publishing

```typescript
// ✅ Good: Include all necessary data
await publishEvent('transaction.completed', {
  transactionId,
  type,
  userId,
  recipientId,
  amount,
  description,
  completedAt: new Date()
});

// ❌ Bad: Missing data, consumers need to query
await publishEvent('transaction.completed', {
  transactionId
});
```

### Message Consumption

```typescript
// ✅ Good: Acknowledge after successful processing
channel.consume(queue, async (msg) => {
  try {
    const data = JSON.parse(msg.content.toString());
    await processEvent(data);
    channel.ack(msg); // Only ack on success
  } catch (error) {
    channel.nack(msg, false, true); // Requeue on error
  }
});

// ❌ Bad: Acknowledge immediately
channel.consume(queue, async (msg) => {
  channel.ack(msg); // Message lost if processing fails!
  await processEvent(msg);
});
```

### Idempotency

Events may be delivered more than once. Make consumers idempotent:

```typescript
// ✅ Good: Check if already processed
async function createWallet(event: UserSignupEvent) {
  const existing = await Wallet.findOne({ userId: event.userId });
  if (existing) {
    logger.info('Wallet already exists, skipping');
    return; // Idempotent
  }

  await Wallet.create({
    userId: event.userId,
    balance: INITIAL_BALANCE
  });
}

// ❌ Bad: Duplicate wallets possible
async function createWallet(event: UserSignupEvent) {
  await Wallet.create({
    userId: event.userId,
    balance: INITIAL_BALANCE
  }); // Will fail or create duplicate
}
```

### Error Handling

```typescript
// ✅ Good: Nack with requeue for transient errors
try {
  await processEvent(data);
  channel.ack(msg);
} catch (error) {
  if (isTransientError(error)) {
    channel.nack(msg, false, true); // Requeue
  } else {
    channel.nack(msg, false, false); // Don't requeue
    // Send to DLQ (future enhancement)
  }
}
```

### Event Schema Versioning

```typescript
// ✅ Good: Include version for future compatibility
{
  version: '1.0',
  transactionId: '...',
  // ... other fields
}

// Future: Handle multiple versions
if (event.version === '1.0') {
  // Handle v1
} else if (event.version === '2.0') {
  // Handle v2
}
```

---

## Monitoring & Debugging

### Key Metrics to Monitor

1. **Queue Depth**: Messages waiting to be processed
2. **Consumer Rate**: Messages processed per second
3. **Publish Rate**: Messages published per second
4. **Unacked Messages**: Messages awaiting acknowledgment
5. **Redelivery Rate**: Messages being redelivered (possible errors)

### RabbitMQ Management UI

View real-time metrics:

```bash
open http://localhost:15672
```

Check:
- Queues → Message rates
- Exchanges → Incoming message rate
- Connections → Active connections
- Channels → Open channels

### Debugging Events

View messages in a queue (without consuming):

1. Go to RabbitMQ Management UI
2. Click on Queues
3. Click on specific queue
4. Scroll to "Get messages"
5. Click "Get Message(s)"

### Purge Queue

To clear all messages (useful in development):

```bash
# Via Management UI: Queues → <queue-name> → Purge

# Or via CLI:
docker exec mint-rabbitmq rabbitmqadmin purge queue name=transaction.created.q
```

---

## Future Enhancements

### Dead Letter Queues (DLQ)

Handle permanently failed messages:

```typescript
// Messages that fail N times go to DLQ
queue.bind('transaction.events.dlq', 'transaction.failed');
```

### Message Priority

Prioritize critical transactions:

```typescript
channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)), {
  priority: 5 // Higher priority
});
```

### Message TTL

Expire old messages:

```typescript
channel.assertQueue(queue, {
  messageTtl: 3600000 // 1 hour
});
```

### Event Replay

Store events for replay/audit:

```typescript
// Store all events in event_store collection
await EventStore.create({
  eventType: 'user.signup',
  payload: data,
  publishedAt: new Date()
});
```

---

## Related Documentation

- [Architecture Overview](architecture.md) - System architecture
- [Transactions API](api/transactions.md) - Transaction endpoints
- [Wallet API](api/wallet.md) - Wallet endpoints
- [Troubleshooting](troubleshooting.md) - Common issues
