import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc, ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

interface KycProfileResponse {
  profileId: string;
  tier: string;
  status: string;
  isFrozen: boolean;
}

interface KycServiceClient {
  getProfile(data: {
    userId: string;
  }): import('rxjs').Observable<KycProfileResponse>;
}

@Injectable()
export class KycService implements OnModuleInit {
  private readonly logger = new Logger(KycService.name);
  private kycClient: KycServiceClient;

  constructor(
    @Inject('KYC_GRPC') private readonly kycGrpc: ClientGrpc,
    @Inject('KAFKA_PRODUCER') private readonly kafka: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kycClient = this.kycGrpc.getService<KycServiceClient>('KycService');
    await this.kafka.connect();
  }

  async getKycProfile(userId: string, adminId: string) {
    this.logger.log(`Admin ${adminId} viewing KYC profile for ${userId}`);
    const profile = await firstValueFrom(
      this.kycClient.getProfile({ userId }),
    );
    this.emitAuditEvent('admin.kyc_viewed', adminId, {
      userId,
      viewedBy: adminId,
    });
    return profile;
  }

  async approveKyc(profileId: string, adminId: string) {
    this.logger.log(`Admin ${adminId} approving KYC profile ${profileId}`);

    this.kafka.emit('admin.events', {
      topic: 'admin.events',
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1',
      service: 'admin-service',
      actorId: adminId,
      payload: {
        event: 'admin.kyc_approved',
        profileId,
        approvedBy: adminId,
      },
    });

    this.emitAuditEvent('admin.kyc_approved', adminId, {
      profileId,
      approvedBy: adminId,
    });

    return { success: true, profileId };
  }

  async rejectKyc(profileId: string, adminId: string, reason: string) {
    this.logger.warn(
      `Admin ${adminId} rejecting KYC profile ${profileId}: ${reason}`,
    );

    this.kafka.emit('admin.events', {
      topic: 'admin.events',
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1',
      service: 'admin-service',
      actorId: adminId,
      payload: {
        event: 'admin.kyc_rejected',
        profileId,
        rejectedBy: adminId,
        reason,
      },
    });

    this.emitAuditEvent('admin.kyc_rejected', adminId, {
      profileId,
      rejectedBy: adminId,
      reason,
    });

    return { success: true, profileId };
  }

  private emitAuditEvent(
    action: string,
    adminId: string,
    data: Record<string, any>,
  ): void {
    this.kafka.emit('audit.events', {
      topic: 'audit.events',
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1',
      service: 'admin-service',
      actorId: adminId,
      payload: {
        event: action,
        ...data,
      },
    });
  }
}
