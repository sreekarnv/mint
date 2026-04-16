jest.mock('../generated/prisma/client', () => ({ PrismaClient: class {} }), {
  virtual: true,
});
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContactsService } from './contacts.service';

const mockPrisma = {
  contact: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockRedis = {
  sadd: jest.fn(),
  expire: jest.fn(),
  srem: jest.fn(),
};

describe('ContactsService', () => {
  let service: ContactsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ContactsService(mockPrisma as any, mockRedis as any);
  });

  // ─── addContact ─────────────────────────────────────────────────────────────

  describe('addContact', () => {
    it('throws when owner tries to add themselves', async () => {
      await expect(service.addContact('u-1', 'u-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when contact already exists', async () => {
      mockPrisma.contact.findUnique.mockResolvedValue({ id: 'c-1' });

      await expect(service.addContact('u-1', 'u-2')).rejects.toThrow(
        'Contact already exists',
      );
    });

    it('creates contact and updates Redis set', async () => {
      mockPrisma.contact.findUnique.mockResolvedValue(null);
      const contact = { id: 'c-1', ownerId: 'u-1', contactId: 'u-2' };
      mockPrisma.contact.create.mockResolvedValue(contact);

      const result = await service.addContact('u-1', 'u-2');

      expect(mockPrisma.contact.create).toHaveBeenCalledWith({
        data: { ownerId: 'u-1', contactId: 'u-2' },
      });
      expect(mockRedis.sadd).toHaveBeenCalledWith('contact:u-1', 'u-2');
      expect(mockRedis.expire).toHaveBeenCalledWith('contact:u-1', 3600);
      expect(result).toEqual(contact);
    });
  });

  // ─── removeContact ───────────────────────────────────────────────────────────

  describe('removeContact', () => {
    it('throws when contact not found', async () => {
      mockPrisma.contact.findUnique.mockResolvedValue(null);

      await expect(service.removeContact('u-1', 'u-2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes contact by id and removes from Redis set', async () => {
      mockPrisma.contact.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.contact.delete.mockResolvedValue({});

      await service.removeContact('u-1', 'u-2');

      expect(mockPrisma.contact.delete).toHaveBeenCalledWith({
        where: { id: 'c-1' },
      });
      expect(mockRedis.srem).toHaveBeenCalledWith('contact:u-1', 'u-2');
    });
  });

  // ─── listContacts ────────────────────────────────────────────────────────────

  describe('listContacts', () => {
    it('returns contacts ordered by createdAt desc', async () => {
      const contacts = [{ id: 'c-1' }, { id: 'c-2' }];
      mockPrisma.contact.findMany.mockResolvedValue(contacts);

      const result = await service.listContacts('u-1');

      expect(mockPrisma.contact.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'u-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(contacts);
    });
  });
});
