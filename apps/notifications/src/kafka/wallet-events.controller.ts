import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from '../notifications/notifications.service';

// Wallet service (Python) currently only consumes events, it does not publish
// to wallet.events. This controller is a placeholder for when wallet starts
// emitting events (e.g. wallet.created, wallet.status_changed).

@Controller()
export class WalletEventsController {
  private readonly logger = new Logger(WalletEventsController.name);

  constructor(private readonly notifications: NotificationsService) {}

  @EventPattern('wallet.events')
  async handleWalletEvents(@Payload() envelope: any): Promise<void> {
    const event = envelope?.payload?.event;
    this.logger.debug(`Received unhandled wallet event: ${event}`);
  }
}
