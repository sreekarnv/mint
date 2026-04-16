jest.mock(
  '../generated/prisma/client',
  () => ({
    PrismaClient: class {},
    KycTier: { UNVERIFIED: 'UNVERIFIED', BASIC: 'BASIC', VERIFIED: 'VERIFIED' },
    KycStatus: {
      APPROVED: 'APPROVED',
      PENDING_REVIEW: 'PENDING_REVIEW',
      REJECTED: 'REJECTED',
    },
    DocType: {
      PASSPORT: 'PASSPORT',
      DRIVERS_LICENSE: 'DRIVERS_LICENSE',
      SELFIE: 'SELFIE',
    },
  }),
  { virtual: true },
);
jest.mock(
  '../generated/prisma/enums',
  () => ({
    DocType: {
      PASSPORT: 'PASSPORT',
      DRIVERS_LICENSE: 'DRIVERS_LICENSE',
      SELFIE: 'SELFIE',
    },
  }),
  { virtual: true },
);
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }), {
  virtual: true,
});

import { BadRequestException } from '@nestjs/common';
import { DocType } from '../generated/prisma/enums';
import { DocumentsService } from './documents.service';

const mockPrisma = {
  kycDocument: { upsert: jest.fn() },
};

const mockKycService = {
  getOrCreateProfile: jest.fn(),
};

function makeFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'passport.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 512, // 0.5 MB
    buffer: Buffer.from(''),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
    ...overrides,
  };
}

describe('DocumentsService', () => {
  let service: DocumentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DocumentsService(mockPrisma as any, mockKycService as any);
    mockKycService.getOrCreateProfile.mockResolvedValue({ id: 'prof-1' });
    mockPrisma.kycDocument.upsert.mockResolvedValue({
      id: 'doc-1',
      profileId: 'prof-1',
      type: DocType.PASSPORT,
      status: 'PENDING',
      docName: null,
      uploadedAt: new Date(),
      s3Key: 'kyc/u-1/PASSPORT/123.jpg',
    });
  });

  describe('uploadDocument', () => {
    it('throws for disallowed MIME type', async () => {
      const file = makeFile({ mimetype: 'image/gif' });

      await expect(
        service.uploadDocument('u-1', file, DocType.PASSPORT),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when file exceeds 10 MB', async () => {
      const file = makeFile({ size: 11 * 1024 * 1024 });

      await expect(
        service.uploadDocument('u-1', file, DocType.PASSPORT),
      ).rejects.toThrow(BadRequestException);
    });

    it('upserts document record with correct profileId and docType', async () => {
      const file = makeFile();

      await service.uploadDocument('u-1', file, DocType.PASSPORT);

      expect(mockPrisma.kycDocument.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            profileId_type: { profileId: 'prof-1', type: DocType.PASSPORT },
          },
          create: expect.objectContaining({
            profileId: 'prof-1',
            type: DocType.PASSPORT,
          }),
        }),
      );
    });

    it('accepts image/png and application/pdf as valid MIME types', async () => {
      for (const mimetype of ['image/png', 'application/pdf'] as const) {
        jest.clearAllMocks();
        mockKycService.getOrCreateProfile.mockResolvedValue({ id: 'prof-1' });
        mockPrisma.kycDocument.upsert.mockResolvedValue({
          id: 'doc-1',
          profileId: 'prof-1',
          type: DocType.SELFIE,
          status: 'PENDING',
          docName: null,
          uploadedAt: new Date(),
        });

        await expect(
          service.uploadDocument('u-1', makeFile({ mimetype }), DocType.SELFIE),
        ).resolves.not.toThrow();
      }
    });

    it('strips s3Key from returned document', async () => {
      const result = await service.uploadDocument(
        'u-1',
        makeFile(),
        DocType.PASSPORT,
      );

      expect(result).not.toHaveProperty('s3Key');
      expect(result).toHaveProperty('id');
    });

    it('passes docName through to the upsert create payload', async () => {
      await service.uploadDocument(
        'u-1',
        makeFile(),
        DocType.PASSPORT,
        'My Passport',
      );

      expect(mockPrisma.kycDocument.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ docName: 'My Passport' }),
        }),
      );
    });
  });
});
