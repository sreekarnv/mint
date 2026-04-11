import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { v5 as uuidv5 } from 'uuid';
import { TransactionsService } from '../transactions.service';

@Controller()
export class SocialEventsController {
  private readonly MONEY_REQUEST_NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  private readonly logger = new Logger(SocialEventsController.name);

  constructor(private readonly transactions: TransactionsService) {}

  @EventPattern('social.events')
  async handleSocialEvents(@Payload() envelope: any): Promise<void> {
    const event = envelope?.payload?.event;

    if (event === 'social.money_request_accepted') {
      await this.handleMoneyRequestAccepted(envelope.payload);
    }
  }

  private async handleMoneyRequestAccepted(payload: any) {
    const senderId = payload.recipientId;
    const receiverId = payload.requesterId;

    const idempotencyKey = uuidv5(payload.requestId, this.MONEY_REQUEST_NS);

    this.logger.log(
      `Money request accepted: ${senderId} pays ${receiverId} ${payload.amount} ${payload.currency} (requestId: ${payload.requestId}, idempotencyKey: ${idempotencyKey})`,
    );

    try {
      await this.transactions.transfer(
        {
          recipientId: receiverId,
          amount: payload.amount,
          senderCurrency: payload.currency,
          recipientCurrency: payload.currency,
          description: payload.note || 'Money request',
        },
        senderId,
        idempotencyKey,
        '0.0.0.0',
      );

      this.logger.log(
        `Transfer completed for money request ${payload.requestId}`,
      );
    } catch (err) {
      this.logger.error(
        `Transfer failed for money request ${payload.requestId}: ${err.message}`,
        err.stack,
      );
    }
  }
}
