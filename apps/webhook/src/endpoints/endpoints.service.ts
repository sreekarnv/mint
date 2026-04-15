import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SigningService } from '../signing/signing.service';
import { validateWebhookUrl } from './url-validator';

@Injectable()
export class EndpointsService {
  private readonly logger = new Logger(EndpointsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly signing: SigningService,
  ) {}

  async create(data: {
    userId: string;
    url: string;
    events: string[];
    description?: string;
  }) {
    validateWebhookUrl(data.url);

    if (data.events.length === 0) {
      throw new BadRequestException('Must subscribe to at least one event');
    }

    const secret = this.signing.generateSecret();

    const endpoint = await this.prisma.webhookEndpoint.create({
      data: {
        userId: data.userId,
        url: data.url,
        secret,
        events: data.events,
        description: data.description,
        active: true,
      },
    });

    this.logger.log(
      `Webhook endpoint created: ${endpoint.id} for user ${data.userId}`,
    );

    return {
      id: endpoint.id,
      url: endpoint.url,
      secret: endpoint.secret,
      events: endpoint.events,
      description: endpoint.description,
      active: endpoint.active,
      createdAt: endpoint.createdAt,
    };
  }

  async list(userId: string) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        events: true,
        description: true,
        active: true,
        createdAt: true,
      },
    });

    return endpoints;
  }

  async get(id: string, userId: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id, userId },
    });

    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    return {
      id: endpoint.id,
      url: endpoint.url,
      events: endpoint.events,
      description: endpoint.description,
      active: endpoint.active,
      createdAt: endpoint.createdAt,
    };
  }

  async update(
    id: string,
    userId: string,
    data: {
      url?: string;
      events?: string[];
      description?: string;
      active?: boolean;
    },
  ) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id, userId },
    });

    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    if (data.url) {
      validateWebhookUrl(data.url);
    }

    if (data.events && data.events.length === 0) {
      throw new BadRequestException('Must subscribe to at least one event');
    }

    const updated = await this.prisma.webhookEndpoint.update({
      where: { id },
      data,
    });

    this.logger.log(`Webhook endpoint ${id} updated`);

    return {
      id: updated.id,
      url: updated.url,
      events: updated.events,
      description: updated.description,
      active: updated.active,
    };
  }

  async delete(id: string, userId: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id, userId },
    });

    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    await this.prisma.webhookEndpoint.delete({ where: { id } });

    this.logger.log(`Webhook endpoint ${id} deleted`);
  }

  async rotateSecret(id: string, userId: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id, userId },
    });

    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    const newSecret = this.signing.generateSecret();

    await this.prisma.webhookEndpoint.update({
      where: { id },
      data: { secret: newSecret },
    });

    this.logger.log(`Webhook endpoint ${id} secret rotated`);

    return { secret: newSecret };
  }

  async getDeliveries(endpointId: string, userId: string, limit = 50) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, userId },
    });

    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    const deliveries = await this.prisma.webhookDelivery.findMany({
      where: { endpointId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        eventType: true,
        eventId: true,
        status: true,
        responseStatus: true,
        attemptCount: true,
        createdAt: true,
        deliveredAt: true,
      },
    });

    return deliveries;
  }

  async deactivateEndpoint(endpointId: string) {
    await this.prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: { active: false },
    });

    this.logger.warn(
      `Webhook endpoint ${endpointId} auto-deactivated after repeated failures`,
    );
  }
}
