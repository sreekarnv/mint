import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DeliveryService } from '../delivery/delivery.service';

interface KafkaEnvelope<T> {
  topic: string;
  eventId: string;
  timestamp: string;
  version: string;
  service: string;
  actorId: string;
  payload: T;
}

@Controller()
export class WalletEventsController {
  constructor(private readonly delivery: DeliveryService) {}

  @EventPattern('wallet.events')
  async handleWalletEvent(@Payload() message: KafkaEnvelope<any>) {
    const { payload, eventId, actorId } = message;
    const eventType = payload.event;

    if (!eventType) return;

    await this.delivery.enqueueForEvent(eventType, eventId, actorId, payload);
  }
}
