import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DocType } from '../generated/prisma/enums';
import { KycService } from '../kyc/kyc.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  private readonly ALLOWED_SIZE: number = 10;
  private readonly ALLOWED_FILETYPES: string[] = [
    'image/jpeg',
    'image/png',
    'application/pdf',
  ];
  private readonly logger: Logger = new Logger(DocumentsService.name);

  constructor(
    private prismaService: PrismaService,
    private kycService: KycService,
  ) {}

  private async tryS3Upload(
    key: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const {
      S3_ENDPOINT,
      S3_BUCKET = 'mint-kyc-docs',
      S3_ACCESS_KEY,
      S3_SECRET_KEY,
    } = process.env;

    if (!S3_ENDPOINT || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
      this.logger.warn(
        `S3 not configured — skipping upload for ${key} (dev mode)`,
      );
      return;
    }

    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

      const client = new S3Client({
        endpoint: S3_ENDPOINT,
        region: 'us-east-1',
        forcePathStyle: true,
        credentials: {
          accessKeyId: S3_ACCESS_KEY,
          secretAccessKey: S3_SECRET_KEY,
        },
      });

      await client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (err: unknown) {
      console.log(err);
      throw new BadRequestException('Document upload failed — please retry');
    }
  }

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    docType: DocType,
    docName?: string,
  ) {
    if (!this.ALLOWED_FILETYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${this.ALLOWED_FILETYPES.join(', ')}`,
      );
    }

    if (file.size > this.ALLOWED_SIZE * 1024 * 1024) {
      throw new BadRequestException(`File exceeds ${10} MB limit`);
    }

    const profile = await this.kycService.getOrCreateProfile(userId);
    const ext = file.originalname.split('.').pop() ?? 'bin';
    const s3Key = `kyc/${userId}/${docType}/${Date.now()}.${ext}`;

    await this.tryS3Upload(s3Key, file);

    const doc = await this.prismaService.kycDocument.upsert({
      where: { profileId_type: { profileId: profile.id, type: docType } },
      create: {
        profileId: profile.id,
        type: docType,
        s3Key,
        status: 'PENDING',
        docName,
      },
      update: {
        s3Key,
        status: 'PENDING',
        docName,
        uploadedAt: new Date(),
      },
    });

    const { s3Key: _omit, ...safeDoc } = doc;
    return safeDoc;
  }
}
