import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from '../notifications/notifications.service';

@Controller()
export class SocialEventsController {
  private readonly logger = new Logger(SocialEventsController.name);

  constructor(private readonly notifications: NotificationsService) {}

  @EventPattern('social.events')
  async handleSocialEvents(@Payload() envelope: any): Promise<void> {
    const event = envelope?.payload?.event;

    if (event === 'social.split_created') {
      await this.handleSplitCreated(envelope.payload);
    } else if (event === 'social.split_settled') {
      await this.handleSplitSettled(envelope.payload);
    } else if (event === 'social.money_request_sent') {
      await this.handleMoneyRequestSent(envelope.payload);
    } else if (event === 'social.money_request_accepted') {
      await this.handleMoneyRequestAccepted(envelope.payload);
    } else if (event === 'social.money_request_declined') {
      await this.handleMoneyRequestDeclined(envelope.payload);
    } else if (event === 'social.money_request_expired') {
      await this.handleMoneyRequestExpired(envelope.payload);
    }
  }

  private async handleSplitCreated(payload: any) {
    const amount = (payload.totalCents / 100).toFixed(2);

    const recipients = (payload.participants as string[]).filter(
      (userId) => userId !== payload.creatorId,
    );

    await Promise.all(
      recipients.map((userId) =>
        this.notifications.create({
          userId,
          type: 'social.split_created',
          title: 'Added to Bill Split',
          body: `You've been added to "${payload.title}" (${amount} ${payload.currency}).`,
          data: {
            splitId: payload.splitId,
            totalCents: payload.totalCents,
            currency: payload.currency,
          },
        }),
      ),
    );

    this.logger.log(
      `Processed social.split_created for split ${payload.splitId} (${recipients.length} participants notified)`,
    );
  }

  private async handleSplitSettled(payload: any) {
    const amount = (payload.totalCents / 100).toFixed(2);

    await Promise.all(
      (payload.participants as string[]).map((userId) =>
        this.notifications.create({
          userId,
          type: 'social.split_settled',
          title: 'Bill Split Settled',
          body: `"${payload.title}" has been fully settled (${amount} ${payload.currency}).`,
          data: {
            splitId: payload.splitId,
            totalCents: payload.totalCents,
          },
        }),
      ),
    );

    this.logger.log(
      `Processed social.split_settled for split ${payload.splitId} (${payload.participants.length} participants notified)`,
    );
  }

  private async handleMoneyRequestSent(payload: any) {
    const amount = (payload.amount / 100).toFixed(2);

    await this.notifications.create({
      userId: payload.recipientId,
      type: 'social.money_request_sent',
      title: 'Money Request',
      body: `Someone requested ${amount} ${payload.currency} from you.${payload.note ? ` "${payload.note}"` : ''}`,
      data: {
        requestId: payload.requestId,
        requesterId: payload.requesterId,
        amount: payload.amount,
        currency: payload.currency,
      },
    });

    this.logger.log(
      `Processed social.money_request_sent to ${payload.recipientId}`,
    );
  }

  private async handleMoneyRequestAccepted(payload: any) {
    const amount = (payload.amount / 100).toFixed(2);

    await this.notifications.create({
      userId: payload.requesterId,
      type: 'social.money_request_accepted',
      title: 'Money Request Accepted',
      body: `Your request for ${amount} ${payload.currency} was accepted. Funds are on the way.`,
      data: {
        requestId: payload.requestId,
        amount: payload.amount,
        currency: payload.currency,
      },
    });

    this.logger.log(
      `Processed social.money_request_accepted for requester ${payload.requesterId}`,
    );
  }

  private async handleMoneyRequestDeclined(payload: any) {
    const amount = (payload.amount / 100).toFixed(2);

    await this.notifications.create({
      userId: payload.requesterId,
      type: 'social.money_request_declined',
      title: 'Money Request Declined',
      body: `Your request for ${amount} ${payload.currency} was declined.`,
      data: {
        requestId: payload.requestId,
        amount: payload.amount,
        currency: payload.currency,
      },
    });

    this.logger.log(
      `Processed social.money_request_declined for requester ${payload.requesterId}`,
    );
  }

  private async handleMoneyRequestExpired(payload: any) {
    await this.notifications.create({
      userId: payload.requesterId,
      type: 'social.money_request_expired',
      title: 'Money Request Expired',
      body: 'A money request you sent has expired without a response.',
      data: { requestId: payload.requestId },
    });

    this.logger.log(
      `Processed social.money_request_expired for requester ${payload.requesterId}`,
    );
  }
}
