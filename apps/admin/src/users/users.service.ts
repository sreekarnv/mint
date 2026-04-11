import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc, ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

interface WalletResponse {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: string;
}

interface KycTierResponse {
  tier: string;
  isFrozen: boolean;
}

interface WalletServiceClient {
  getWallet(data: {
    userId: string;
  }): import('rxjs').Observable<WalletResponse>;
  freezeWallet(data: {
    walletId: string;
  }): import('rxjs').Observable<{ success: boolean }>;
  unfreezeWallet(data: {
    walletId: string;
  }): import('rxjs').Observable<{ success: boolean }>;
}

interface KycServiceClient {
  getUserTier(data: {
    userId: string;
  }): import('rxjs').Observable<KycTierResponse>;
}

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private walletClient: WalletServiceClient;
  private kycClient: KycServiceClient;

  constructor(
    @Inject('WALLET_GRPC') private readonly walletGrpc: ClientGrpc,
    @Inject('KYC_GRPC') private readonly kycGrpc: ClientGrpc,
    @Inject('KAFKA_PRODUCER') private readonly kafka: ClientKafka,
  ) {}

  async onModuleInit() {
    this.walletClient =
      this.walletGrpc.getService<WalletServiceClient>('WalletService');
    this.kycClient = this.kycGrpc.getService<KycServiceClient>('KycService');
    await this.kafka.connect();
  }

  private get authUrl(): string {
    return process.env.AUTH_SERVICE_URL ?? 'http://auth:4001';
  }

  async listUsers(adminId: string, authHeader: string, email?: string) {
    this.logger.log(`Admin ${adminId} searching users email=${email ?? '*'}`);
    const qs = email ? `?email=${encodeURIComponent(email)}` : '?email=';
    const res = await fetch(`${this.authUrl}/api/v1/auth/users/search${qs}`, {
      headers: { Authorization: authHeader },
    });
    if (!res.ok) throw new Error(`Auth search failed: ${res.status}`);
    return res.json();
  }

  async updateUserRole(userId: string, adminId: string, role: 'USER' | 'ADMIN', authHeader: string) {
    this.logger.warn(`Admin ${adminId} updating user ${userId} role to ${role}`);

    const res = await fetch(`${this.authUrl}/api/v1/auth/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error(`Auth role update failed: ${res.status}`);

    this.emitAuditEvent('admin.user_role_updated', adminId, {
      userId,
      role,
      updatedBy: adminId,
    });

    return res.json();
  }

  async getUserProfile(userId: string, adminId: string, authHeader: string) {
    this.logger.log(`Admin ${adminId} viewing user ${userId}`);

    const [wallet, kyc, identity] = await Promise.all([
      firstValueFrom(this.walletClient.getWallet({ userId })),
      firstValueFrom(this.kycClient.getUserTier({ userId })),
      fetch(`${this.authUrl}/api/v1/auth/users/${userId}`, {
        headers: { Authorization: authHeader },
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);

    this.emitAuditEvent('admin.user_viewed', adminId, {
      userId,
      viewedBy: adminId,
    });

    return {
      userId,
      email: identity?.email ?? null,
      name: identity?.name ?? null,
      wallet: {
        id: wallet.id,
        balance: wallet.balance ?? 0,
        currency: wallet.currency,
        status: wallet.status,
      },
      kyc: {
        tier: kyc.tier,
        isFrozen: kyc.isFrozen,
      },
    };
  }

  async freezeUser(userId: string, adminId: string, reason: string) {
    this.logger.warn(`Admin ${adminId} freezing user ${userId}: ${reason}`);

    const wallet = await firstValueFrom(
      this.walletClient.getWallet({ userId }),
    );
    await firstValueFrom(
      this.walletClient.freezeWallet({ walletId: wallet.id }),
    );

    this.emitAuditEvent('admin.user_frozen', adminId, {
      userId,
      walletId: wallet.id,
      frozenBy: adminId,
      reason,
    });

    return { success: true };
  }

  async unfreezeUser(userId: string, adminId: string) {
    this.logger.log(`Admin ${adminId} unfreezing user ${userId}`);

    const wallet = await firstValueFrom(
      this.walletClient.getWallet({ userId }),
    );
    await firstValueFrom(
      this.walletClient.unfreezeWallet({ walletId: wallet.id }),
    );

    this.emitAuditEvent('admin.user_unfrozen', adminId, {
      userId,
      walletId: wallet.id,
      unfrozenBy: adminId,
    });

    return { success: true };
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
