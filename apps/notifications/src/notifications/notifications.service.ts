import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { SseService } from '../sse/sse.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sse: SseService,
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  async create(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: any;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data,
      },
    });

    this.sse.broadcast(data.userId, notification);

    this.logger.log(
      `Created notification ${notification.id} for user ${data.userId}: ${data.type}`,
    );

    return notification;
  }

  async upsertUserProfile(data: {
    userId: string;
    email: string;
    name?: string;
  }) {
    await this.prisma.userProfile.upsert({
      where: { userId: data.userId },
      create: { userId: data.userId, email: data.email, name: data.name },
      update: { email: data.email, name: data.name },
    });
  }

  async getUserEmail(userId: string): Promise<string | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { email: true },
    });
    return profile?.email ?? null;
  }

  async enqueueEmail(data: {
    to: string;
    subject: string;
    template: string;
    variables: Record<string, any>;
  }) {
    await this.emailQueue.add('send', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    this.logger.log(
      `Enqueued email to ${data.to} with template ${data.template}`,
    );
  }
}
