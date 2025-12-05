# Notifications Service

The **Notifications Service** handles all user notifications via email using event-driven architecture.

## Overview

- **Port**: 4002
- **Database**: None (stateless)
- **Events Published**: None
- **Events Consumed**: `user.signup`, `transaction.completed`, `transaction.failed`

## Features

### Email Notifications
- Welcome emails on user registration
- Transaction completion notifications
- Transaction failure alerts
- Event-driven notification delivery

### Email Templates
- Customizable HTML templates
- Dynamic content injection
- Professional formatting

## Technology Stack

- **Express.js** - Web framework
- **RabbitMQ** - Event consumption
- **Nodemailer** - Email sending (SMTP)
- **Winston** - Logging

## Notification Types

### Welcome Email

**Trigger**: User registration

**Template**:
```
Subject: Welcome to Mint!

Hi [Name],

Welcome to Mint! Your wallet has been created and is ready to use.

Your balance: $0.00

Get started by adding funds to your wallet.

Best regards,
Mint Team
```

### Transaction Completed

**Trigger**: Successful transaction

**Template**:
```
Subject: Transaction Completed

Hi [Name],

Your [transaction type] transaction has been completed successfully.

Amount: $[amount]
Description: [description]
New Balance: $[balance]

Transaction ID: [id]

Best regards,
Mint Team
```

### Transaction Failed

**Trigger**: Failed transaction

**Template**:
```
Subject: Transaction Failed

Hi [Name],

Your [transaction type] transaction has failed.

Amount: $[amount]
Reason: [failure reason]

Please try again or contact support if the issue persists.

Best regards,
Mint Team
```

## Event Consumption

### user.signup

Sends welcome email to new users.

**Expected Payload**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "name": "John Doe"
}
```

**Action**: Send welcome email

### transaction.completed

Sends success notification.

**Expected Payload**:
```json
{
  "transactionId": "507f1f77bcf86cd799439013",
  "type": "transfer",
  "senderId": "507f1f77bcf86cd799439011",
  "recipientId": "507f1f77bcf86cd799439020",
  "amount": 50.00,
  "description": "Payment for services"
}
```

**Action**: Send completion email to sender (and recipient for transfers)

### transaction.failed

Sends failure notification.

**Expected Payload**:
```json
{
  "transactionId": "507f1f77bcf86cd799439013",
  "type": "transfer",
  "senderId": "507f1f77bcf86cd799439011",
  "amount": 50.00,
  "reason": "Insufficient balance"
}
```

**Action**: Send failure email to sender

## SMTP Configuration

The service supports any SMTP server:

### Development (Mailtrap)

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-password
```

### Production (Gmail)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Production (SendGrid)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

!!! warning "Gmail App Passwords"
    For Gmail, you must use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password.

## Error Handling

### Failed Email Delivery

If an email fails to send:

1. Error is logged
2. Message is acknowledged (to prevent infinite retries)
3. Admin notification could be triggered (future enhancement)

### SMTP Connection Issues

- Connection timeout: 30 seconds
- Automatic retry: Not implemented (single attempt)
- Graceful failure: Service continues processing other messages

## Monitoring

### Email Sending Metrics

Monitor in application logs:

```json
{
  "level": "info",
  "message": "Email sent successfully",
  "type": "welcome",
  "recipient": "john@example.com",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Error Logs

```json
{
  "level": "error",
  "message": "Failed to send email",
  "type": "transaction_completed",
  "recipient": "john@example.com",
  "error": "SMTP connection timeout",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Testing

### Local Testing with Mailtrap

1. Sign up for [Mailtrap](https://mailtrap.io/)
2. Get SMTP credentials from your inbox
3. Configure `.env.docker` with Mailtrap credentials
4. All emails will be caught by Mailtrap (not sent to real addresses)

### Manual Testing

```bash
# Register user (triggers welcome email)
curl -X POST http://localhost/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Check Mailtrap inbox for welcome email
```

## Configuration

See [Configuration Guide](../getting-started/configuration.md#notifications-service-configuration) for environment variables.

## Future Enhancements

- **SMS Notifications** - Text message alerts
- **Push Notifications** - Mobile app notifications
- **Notification Preferences** - User-configurable notification settings
- **Email Templates** - Advanced template engine
- **Retry Logic** - Automatic retry on failures
- **Dead Letter Queue** - Handle persistent failures

## Related Documentation

- [Event Architecture](../events.md)
- [Getting Started](../getting-started/installation.md)
- [Configuration Guide](../getting-started/configuration.md)
