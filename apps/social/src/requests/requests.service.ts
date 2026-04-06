import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { RequestStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('social-jobs') private readonly queue: Queue,
    @Inject('KAFKA_PRODUCER') private readonly kafka: ClientKafka,
  ) {}

  async create(data: {
    requesterId: string;
    recipientId: string;
    amount: number;
    currency?: string;
    note?: string;
  }) {
    if (data.requesterId === data.recipientId) {
      throw new BadRequestException('Cannot request money from yourself');
    }

    if (data.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    // Money requests expire after 48 hours
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const request = await this.prisma.moneyRequest.create({
      data: {
        requesterId: data.requesterId,
        recipientId: data.recipientId,
        amount: BigInt(data.amount),
        currency: data.currency || 'USD',
        note: data.note,
        status: RequestStatus.PENDING,
        expiresAt,
      },
    });

    const job = await this.queue.add(
      'expire-request',
      { requestId: request.id },
      { delay: 48 * 60 * 60 * 1000 }, // 48h in ms
    );

    await this.prisma.moneyRequest.update({
      where: { id: request.id },
      data: { bullmqJobId: job.id },
    });

    this.emitEvent('social.events', {
      event: 'social.money_request_sent',
      requestId: request.id,
      requesterId: data.requesterId,
      recipientId: data.recipientId,
      amount: data.amount,
      currency: data.currency || 'USD',
      note: data.note,
    });

    this.logger.log(
      `Money request ${request.id}: ${data.requesterId} => ${data.recipientId}, ${data.amount / 100} ${data.currency || 'USD'}`,
    );

    return {
      id: request.id,
      requesterId: request.requesterId,
      recipientId: request.recipientId,
      amount: Number(request.amount),
      currency: request.currency,
      note: request.note,
      status: request.status,
      expiresAt: request.expiresAt,
      createdAt: request.createdAt,
    };
  }

  async accept(requestId: string, recipientId: string) {
    const request = await this.prisma.moneyRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Money request not found');
    }

    if (request.recipientId !== recipientId) {
      throw new ForbiddenException('Not authorized to accept this request');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Request is ${request.status}, cannot accept`,
      );
    }

    if (request.bullmqJobId) {
      try {
        const job = await this.queue.getJob(request.bullmqJobId);
        await job?.remove();
      } catch (err) {
        this.logger.warn(`Failed to remove BullMQ job: ${err.message}`);
      }
    }

    const updated = await this.prisma.moneyRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });

    this.emitEvent('social.events', {
      event: 'social.money_request_accepted',
      requestId: updated.id,
      requesterId: updated.requesterId,
      recipientId: updated.recipientId,
      amount: Number(updated.amount),
      currency: updated.currency,
      note: updated.note,
    });

    this.logger.log(`Money request ${requestId} accepted by ${recipientId}`);

    return {
      id: updated.id,
      status: updated.status,
      acceptedAt: updated.acceptedAt,
    };
  }

  async decline(requestId: string, recipientId: string) {
    const request = await this.prisma.moneyRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Money request not found');
    }

    if (request.recipientId !== recipientId) {
      throw new ForbiddenException('Not authorized to decline this request');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Request is ${request.status}, cannot decline`,
      );
    }

    if (request.bullmqJobId) {
      try {
        const job = await this.queue.getJob(request.bullmqJobId);
        await job?.remove();
      } catch (err) {
        this.logger.warn(`Failed to remove BullMQ job: ${err.message}`);
      }
    }

    const updated = await this.prisma.moneyRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.DECLINED,
        declinedAt: new Date(),
      },
    });

    this.emitEvent('social.events', {
      event: 'social.money_request_declined',
      requestId: updated.id,
      requesterId: updated.requesterId,
      recipientId: updated.recipientId,
      amount: Number(updated.amount),
      currency: updated.currency,
    });

    this.logger.log(`Money request ${requestId} declined by ${recipientId}`);

    return {
      id: updated.id,
      status: updated.status,
      declinedAt: updated.declinedAt,
    };
  }

  async cancel(requestId: string, requesterId: string) {
    const request = await this.prisma.moneyRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Money request not found');
    }

    if (request.requesterId !== requesterId) {
      throw new ForbiddenException('Not authorized to cancel this request');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Request is ${request.status}, cannot cancel`,
      );
    }

    if (request.bullmqJobId) {
      try {
        const job = await this.queue.getJob(request.bullmqJobId);
        await job?.remove();
      } catch (err) {
        this.logger.warn(`Failed to remove BullMQ job: ${err.message}`);
      }
    }

    const updated = await this.prisma.moneyRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.CANCELLED },
    });

    this.logger.log(`Money request ${requestId} cancelled by ${requesterId}`);

    return {
      id: updated.id,
      status: updated.status,
    };
  }

  async list(userId: string, filter?: { status?: RequestStatus }) {
    const requests = await this.prisma.moneyRequest.findMany({
      where: {
        OR: [{ requesterId: userId }, { recipientId: userId }],
        ...(filter?.status && { status: filter.status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      requesterId: r.requesterId,
      recipientId: r.recipientId,
      amount: Number(r.amount),
      currency: r.currency,
      note: r.note,
      status: r.status,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      acceptedAt: r.acceptedAt,
      declinedAt: r.declinedAt,
    }));
  }

  async expire(requestId: string) {
    const request = await this.prisma.moneyRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      this.logger.warn(`Request ${requestId} not found for expiry`);
      return;
    }

    if (request.status !== RequestStatus.PENDING) {
      this.logger.log(
        `Request ${requestId} is ${request.status}, skipping expiry`,
      );
      return;
    }

    await this.prisma.moneyRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.EXPIRED,
        expiredAt: new Date(),
      },
    });

    this.emitEvent('social.events', {
      event: 'social.money_request_expired',
      requestId,
      requesterId: request.requesterId,
    });

    this.logger.log(`Money request ${requestId} expired`);
  }

  private emitEvent(topic: string, payload: Record<string, any>): void {
    this.kafka.emit(topic, {
      topic,
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1',
      service: 'social-service',
      actorId: payload.requesterId || payload.userId || 'system',
      payload,
    });
  }
}
