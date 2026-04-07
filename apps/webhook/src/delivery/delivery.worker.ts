import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { EndpointsService } from '../endpoints/endpoints.service';
import { PrismaService } from '../prisma/prisma.service';
import { SigningService } from '../signing/signing.service';

interface DeliveryJob {
  deliveryId: string;
  endpointId: string;
  eventType: string;
  eventId: string;
  payload: Record<string, any>;
}

@Processor('webhook-delivery')
export class DeliveryWorker extends WorkerHost {
  private readonly logger = new Logger(DeliveryWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly signing: SigningService,
    private readonly endpoints: EndpointsService,
  ) {
    super();
  }

  async process(job: Job<DeliveryJob>): Promise<void> {
    const { deliveryId, endpointId, eventType, eventId, payload } = job.data;

    this.logger.log(
      `Delivering ${eventType} to endpoint ${endpointId} (attempt ${job.attemptsMade + 1}/5)`,
    );

    const endpoint = await this.prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
    });

    if (!endpoint) {
      this.logger.warn(`Endpoint ${endpointId} not found, skipping delivery`);
      return;
    }

    if (!endpoint.active) {
      this.logger.warn(`Endpoint ${endpointId} is inactive, skipping delivery`);
      return;
    }

    const webhookPayload = {
      id: uuidv4(),
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    const body = JSON.stringify(webhookPayload);
    const signature = this.signing.sign(endpoint.secret, body);

    const startTime = Date.now();

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Mint-Signature': `sha256=${signature}`,
          'X-Mint-Event': eventType,
          'X-Mint-Delivery-Id': deliveryId,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });

      const latency = Date.now() - startTime;
      const responseBody = await response.text();

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: response.ok ? 'SUCCESS' : 'FAILED',
          responseStatus: response.status,
          responseBody: responseBody.slice(0, 1000),
          attemptCount: job.attemptsMade + 1,
          deliveredAt: response.ok ? new Date() : null,
        },
      });

      if (response.ok) {
        this.logger.log(
          `Delivery ${deliveryId} succeeded: ${response.status} (${latency}ms)`,
        );
      } else {
        this.logger.warn(
          `Delivery ${deliveryId} failed: ${response.status} (${latency}ms)`,
        );
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      const latency = Date.now() - startTime;

      this.logger.error(
        `Delivery ${deliveryId} error: ${error.message} (${latency}ms)`,
      );

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'FAILED',
          attemptCount: job.attemptsMade + 1,
          nextRetry:
            job.attemptsMade < 4
              ? new Date(Date.now() + this.getNextDelay(job.attemptsMade))
              : null,
        },
      });

      if (job.attemptsMade >= 4) {
        await this.endpoints.deactivateEndpoint(endpointId);
      }

      throw error;
    }
  }

  private getNextDelay(attemptsMade: number): number {
    const delays = [5000, 30000, 300000, 1800000, 7200000];
    return delays[attemptsMade] || delays[delays.length - 1];
  }
}
