import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TransactionsService } from '../transactions.service';

@Controller()
export class SocialEventsController {
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

    this.logger.log(
      `Money request accepted: ${senderId} pays ${receiverId} ${payload.amount} ${payload.currency} (requestId: ${payload.requestId})`,
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
        payload.requestId,
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
