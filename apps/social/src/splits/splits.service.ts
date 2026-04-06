import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { ParticipantStatus, SplitStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SplitsService {
  private readonly logger = new Logger(SplitsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('KAFKA_PRODUCER') private readonly kafka: ClientKafka,
  ) {}

  async create(data: {
    creatorId: string;
    title: string;
    totalCents: number;
    currency?: string;
    participants: Array<{ userId: string; amountCents: number }>;
  }) {
    if (data.totalCents <= 0) {
      throw new BadRequestException('Total must be positive');
    }

    if (data.participants.length === 0) {
      throw new BadRequestException('At least one participant required');
    }

    // Validate: sum of participant amounts must equal total
    const sum = data.participants.reduce((acc, p) => acc + p.amountCents, 0);

    if (sum !== data.totalCents) {
      throw new BadRequestException(
        `Participant amounts (${sum}) must equal total (${data.totalCents})`,
      );
    }

    const userIds = data.participants.map((p) => p.userId);
    const uniqueUserIds = new Set(userIds);
    if (userIds.length !== uniqueUserIds.size) {
      throw new BadRequestException('Duplicate participants detected');
    }

    const split = await this.prisma.billSplit.create({
      data: {
        creatorId: data.creatorId,
        title: data.title,
        totalCents: BigInt(data.totalCents),
        currency: data.currency || 'USD',
        status: SplitStatus.OPEN,
        participants: {
          create: data.participants.map((p) => ({
            userId: p.userId,
            amountCents: BigInt(p.amountCents),
            status: ParticipantStatus.PENDING,
          })),
        },
      },
      include: { participants: true },
    });

    this.emitEvent('social.events', {
      event: 'social.split_created',
      splitId: split.id,
      creatorId: data.creatorId,
      title: data.title,
      totalCents: data.totalCents,
      currency: data.currency || 'USD',
      participants: data.participants.map((p) => p.userId),
    });

    this.logger.log(
      `Bill split ${split.id} created: ${data.title}, ${data.totalCents / 100} ${data.currency || 'USD'}`,
    );

    return {
      id: split.id,
      creatorId: split.creatorId,
      title: split.title,
      totalCents: Number(split.totalCents),
      currency: split.currency,
      status: split.status,
      participants: split.participants.map((p) => ({
        userId: p.userId,
        amountCents: Number(p.amountCents),
        status: p.status,
      })),
      createdAt: split.createdAt,
    };
  }

  async get(splitId: string, userId: string) {
    const split = await this.prisma.billSplit.findUnique({
      where: { id: splitId },
      include: { participants: true },
    });

    if (!split) {
      throw new NotFoundException('Split not found');
    }

    const isParticipant =
      split.creatorId === userId ||
      split.participants.some((p) => p.userId === userId);

    if (!isParticipant) {
      throw new ForbiddenException('Not authorized to view this split');
    }

    return {
      id: split.id,
      creatorId: split.creatorId,
      title: split.title,
      totalCents: Number(split.totalCents),
      currency: split.currency,
      status: split.status,
      settledAt: split.settledAt,
      participants: split.participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        amountCents: Number(p.amountCents),
        status: p.status,
        transactionId: p.transactionId,
        paidAt: p.paidAt,
      })),
      createdAt: split.createdAt,
    };
  }

  async list(userId: string) {
    const splits = await this.prisma.billSplit.findMany({
      where: {
        OR: [{ creatorId: userId }, { participants: { some: { userId } } }],
      },
      include: { participants: true },
      orderBy: { createdAt: 'desc' },
    });

    return splits.map((split) => ({
      id: split.id,
      creatorId: split.creatorId,
      title: split.title,
      totalCents: Number(split.totalCents),
      currency: split.currency,
      status: split.status,
      settledAt: split.settledAt,
      participantCount: split.participants.length,
      paidCount: split.participants.filter(
        (p) => p.status === ParticipantStatus.PAID,
      ).length,
      createdAt: split.createdAt,
    }));
  }

  async pay(splitId: string, userId: string, transactionId: string) {
    const split = await this.prisma.billSplit.findUnique({
      where: { id: splitId },
      include: { participants: true },
    });

    if (!split) {
      throw new NotFoundException('Split not found');
    }

    const participant = split.participants.find((p) => p.userId === userId);

    if (!participant) {
      throw new ForbiddenException('Not a participant in this split');
    }

    if (participant.status === ParticipantStatus.PAID) {
      // Idempotent => already paid
      return {
        id: participant.id,
        status: participant.status,
        paidAt: participant.paidAt,
      };
    }

    const updated = await this.prisma.splitParticipant.update({
      where: { id: participant.id },
      data: {
        status: ParticipantStatus.PAID,
        transactionId,
        paidAt: new Date(),
      },
    });

    this.logger.log(
      `Split ${splitId}: ${userId} paid ${Number(participant.amountCents) / 100} ${split.currency}`,
    );

    const allParticipants = await this.prisma.splitParticipant.findMany({
      where: { splitId },
    });

    const allPaid = allParticipants.every(
      (p) => p.status === ParticipantStatus.PAID,
    );

    if (allPaid) {
      await this.prisma.billSplit.update({
        where: { id: splitId },
        data: {
          status: SplitStatus.SETTLED,
          settledAt: new Date(),
        },
      });

      this.emitEvent('social.events', {
        event: 'social.split_settled',
        splitId,
        title: split.title,
        totalCents: Number(split.totalCents),
        currency: split.currency,
        participants: [
          split.creatorId,
          ...allParticipants.map((p) => p.userId),
        ],
      });

      this.logger.log(`Split ${splitId} settled - all participants paid`);
    }

    return {
      id: updated.id,
      status: updated.status,
      paidAt: updated.paidAt,
    };
  }

  private emitEvent(topic: string, payload: Record<string, any>): void {
    this.kafka.emit(topic, {
      topic,
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1',
      service: 'social-service',
      actorId: payload.userId || 'system',
      payload,
    });
  }
}
