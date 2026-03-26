import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { KycProfile } from '../generated/prisma/client';

@Injectable()
export class KycService {
  constructor(private readonly prismaService: PrismaService) {}

  async getOrCreateProfile(userId: string): Promise<KycProfile> {
    let kycProfile = await this.prismaService.kycProfile.findUnique({
      where: { userId },
    });

    if (!kycProfile) {
      kycProfile = await this.prismaService.kycProfile.create({
        data: {
          userId,
        },
      });
    }

    return kycProfile;
  }
}
