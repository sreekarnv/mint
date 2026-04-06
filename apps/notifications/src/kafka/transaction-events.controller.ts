import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from '../notifications/notifications.service';

// Transactions service emits:
//   transaction.completed      => TRANSFER or TOPUP succeeded
//   transaction.fraud_blocked  => blocked by fraud rules (payload.userId = sender)

@Controller()
export class TransactionEventsController {
  private readonly logger = new Logger(TransactionEventsController.name);

  constructor(private readonly notifications: NotificationsService) {}

  @EventPattern('transaction.events')
  async handleTransactionEvents(@Payload() envelope: any): Promise<void> {
    const event = envelope?.payload?.event;

    if (event === 'transaction.completed') {
      await this.handleTransactionCompleted(envelope.payload);
    } else if (event === 'transaction.fraud_blocked') {
      await this.handleFraudBlocked(envelope.payload);
    }
  }

  private async handleTransactionCompleted(payload: any) {
    const isTopup = payload.type === 'TOPUP';

    if (isTopup) {
      await this.notifications.create({
        userId: payload.senderId,
        type: 'transaction.topup_completed',
        title: 'Funds Added',
        body: `${(payload.senderAmount / 100).toFixed(2)} ${payload.senderCurrency} added to your wallet.`,
        data: { transactionId: payload.transactionId },
      });
    } else {
      const senderAmount = (payload.senderAmount / 100).toFixed(2);

      await this.notifications.create({
        userId: payload.senderId,
        type: 'transaction.completed',
        title: 'Transfer Sent',
        body: `You sent ${senderAmount} ${payload.senderCurrency}.`,
        data: { transactionId: payload.transactionId },
      });

      const senderEmail = await this.notifications.getUserEmail(
        payload.senderId,
      );

      if (senderEmail) {
        await this.notifications.enqueueEmail({
          to: senderEmail,
          subject: `Transfer Sent - ${senderAmount} ${payload.senderCurrency}`,
          template: 'transfer-sent',
          variables: {
            amount: senderAmount,
            currency: payload.senderCurrency,
            description: payload.description ?? '',
            transactionId: payload.transactionId,
          },
        });
      }

      if (payload.recipientId) {
        const recipientAmount = (
          (payload.recipientAmount ?? payload.senderAmount) / 100
        ).toFixed(2);
        const recipientCurrency =
          payload.recipientCurrency ?? payload.senderCurrency;

        await this.notifications.create({
          userId: payload.recipientId,
          type: 'transaction.completed',
          title: 'Transfer Received',
          body: `You received ${recipientAmount} ${recipientCurrency}.`,
          data: { transactionId: payload.transactionId },
        });

        const receiverEmail = await this.notifications.getUserEmail(
          payload.recipientId,
        );

        if (receiverEmail) {
          await this.notifications.enqueueEmail({
            to: receiverEmail,
            subject: `Transfer Received - ${recipientAmount} ${recipientCurrency}`,
            template: 'transfer-received',
            variables: {
              amount: recipientAmount,
              currency: recipientCurrency,
              description: payload.description ?? '',
              transactionId: payload.transactionId,
            },
          });
        }
      }
    }

    this.logger.log(
      `Processed transaction.completed [${payload.type}] for ${payload.transactionId}`,
    );
  }

  private async handleFraudBlocked(payload: any) {
    // fraud_blocked payload uses `userId` (the sender)
    await this.notifications.create({
      userId: payload.userId,
      type: 'transaction.fraud_blocked',
      title: 'Transaction Blocked',
      body: 'A transaction was blocked due to suspicious activity. Contact support if this was you.',
      data: {
        transactionId: payload.transactionId,
        score: payload.score,
        rulesFired: payload.rulesFired,
      },
    });

    this.logger.log(
      `Processed transaction.fraud_blocked for ${payload.userId}`,
    );
  }
}
