import { RedisService } from '@mint/common';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async addContact(ownerId: string, contactId: string) {
    if (ownerId === contactId) {
      throw new BadRequestException('Cannot add yourself as a contact');
    }

    const existing = await this.prisma.contact.findUnique({
      where: { ownerId_contactId: { ownerId, contactId } },
    });

    if (existing) {
      throw new BadRequestException('Contact already exists');
    }

    const contact = await this.prisma.contact.create({
      data: { ownerId, contactId },
    });

    await this.redis.sadd(`contact:${ownerId}`, contactId);
    await this.redis.expire(`contact:${ownerId}`, 3600); // 1h TTL

    this.logger.log(`User ${ownerId} added contact ${contactId}`);

    return contact;
  }

  async removeContact(ownerId: string, contactId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { ownerId_contactId: { ownerId, contactId } },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.contact.delete({
      where: { id: contact.id },
    });

    await this.redis.srem(`contact:${ownerId}`, contactId);

    this.logger.log(`User ${ownerId} removed contact ${contactId}`);
  }

  async listContacts(ownerId: string) {
    return this.prisma.contact.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
