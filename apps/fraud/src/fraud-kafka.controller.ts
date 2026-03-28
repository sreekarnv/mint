import { Controller, Logger } from '@nestjs/common';
import { FraudService } from './fraud.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class FraudKafkaController {
  private readonly logger = new Logger(FraudKafkaController.name);

  constructor(private readonly fraudService: FraudService) {}

  @EventPattern('transaction.events')
  async handleTransactionEvents(@Payload() envelope: any): Promise<void> {
    const event = envelope?.payload?.event as string | undefined;
    if (event !== 'transaction.completed') return;

    const { senderId, senderAmount } = envelope.payload;
    if (!senderId || senderAmount == null) return;

    // Normalise to USD cents for consistent stats
    const amountCents: number =
      envelope.payload.usdEquivalentCents ?? Number(senderAmount);

    try {
      await this.fraudService.updateUserStats(senderId, amountCents);
    } catch (err) {
      this.logger.error(`updateUserStats failed for ${senderId}: ${err}`);
    }
  }
}
