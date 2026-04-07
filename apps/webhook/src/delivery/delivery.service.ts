import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('webhook-delivery') private readonly queue: Queue,
  ) {}

  async enqueueForEvent(
    eventType: string,
    eventId: string,
    actorId: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: {
        userId: actorId,
        active: true,
        events: { has: eventType },
      },
    });

    if (endpoints.length === 0) {
      this.logger.debug(
        `No endpoints subscribed to ${eventType} for user ${actorId}`,
      );
      return;
    }

    this.logger.log(
      `Enqueueing ${eventType} to ${endpoints.length} endpoint(s) for user ${actorId}`,
    );

    for (const endpoint of endpoints) {
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          eventType,
          eventId,
          payload,
          status: 'PENDING',
        },
      });

      await this.queue.add(
        'deliver',
        {
          deliveryId: delivery.id,
          endpointId: endpoint.id,
          eventType,
          eventId,
          payload,
        },
        {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
    }
  }
}
