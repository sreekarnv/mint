import { of } from 'rxjs';
import { UsersService } from './users.service';

const mockWalletClient = {
  getWallet: jest.fn(),
  freezeWallet: jest.fn(),
  unfreezeWallet: jest.fn(),
};

const mockKycClient = {
  getUserTier: jest.fn(),
};

const mockWalletGrpc = {
  getService: jest.fn(() => mockWalletClient),
};

const mockKycGrpc = {
  getService: jest.fn(() => mockKycClient),
};

const mockKafka = {
  connect: jest.fn(),
  emit: jest.fn(),
};

const AUTH_HEADER = 'Bearer admin-token';
const ADMIN_ID = 'admin-1';
const USER_ID = 'user-1';
const WALLET_ID = 'wallet-1';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    service = new UsersService(
      mockWalletGrpc as any,
      mockKycGrpc as any,
      mockKafka as any,
    );
    await service.onModuleInit();
    process.env.AUTH_SERVICE_URL = 'http://auth:4001';
  });

  describe('listUsers', () => {
    it('calls auth service with email query and returns result', async () => {
      const users = [{ id: USER_ID, email: 'a@b.com' }];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(users),
      } as any);

      const result = await service.listUsers(ADMIN_ID, AUTH_HEADER, 'a@b.com');

      expect(fetch).toHaveBeenCalledWith(
        'http://auth:4001/api/v1/auth/users/search?email=a%40b.com',
        expect.objectContaining({ headers: { Authorization: AUTH_HEADER } }),
      );
      expect(result).toEqual(users);
    });

    it('throws when auth service returns non-ok', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue({ ok: false, status: 500 } as any);
      await expect(service.listUsers(ADMIN_ID, AUTH_HEADER)).rejects.toThrow(
        'Auth search failed: 500',
      );
    });
  });

  describe('getUserProfile', () => {
    it('aggregates wallet, kyc, and identity into a single profile', async () => {
      mockWalletClient.getWallet.mockReturnValue(
        of({ id: WALLET_ID, balance: 1000, currency: 'USD', status: 'ACTIVE' }),
      );
      mockKycClient.getUserTier.mockReturnValue(
        of({ tier: 'VERIFIED', isFrozen: false }),
      );
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ email: 'a@b.com', name: 'Alice' }),
      } as any);

      const result = await service.getUserProfile(
        USER_ID,
        ADMIN_ID,
        AUTH_HEADER,
      );

      expect(result).toEqual({
        userId: USER_ID,
        email: 'a@b.com',
        name: 'Alice',
        wallet: {
          id: WALLET_ID,
          balance: 1000,
          currency: 'USD',
          status: 'ACTIVE',
        },
        kyc: { tier: 'VERIFIED', isFrozen: false },
      });
    });

    it('sets email and name to null if identity fetch fails', async () => {
      mockWalletClient.getWallet.mockReturnValue(
        of({ id: WALLET_ID, balance: 0, currency: 'USD', status: 'ACTIVE' }),
      );
      mockKycClient.getUserTier.mockReturnValue(
        of({ tier: 'UNVERIFIED', isFrozen: false }),
      );
      global.fetch = jest
        .fn()
        .mockResolvedValue({ ok: false, status: 404 } as any);

      const result = await service.getUserProfile(
        USER_ID,
        ADMIN_ID,
        AUTH_HEADER,
      );

      expect(result.email).toBeNull();
      expect(result.name).toBeNull();
    });

    it('emits audit event after viewing profile', async () => {
      mockWalletClient.getWallet.mockReturnValue(
        of({ id: WALLET_ID, balance: 0, currency: 'USD', status: 'ACTIVE' }),
      );
      mockKycClient.getUserTier.mockReturnValue(
        of({ tier: 'BASIC', isFrozen: false }),
      );
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ email: 'x@y.com', name: 'X' }),
      } as any);

      await service.getUserProfile(USER_ID, ADMIN_ID, AUTH_HEADER);

      expect(mockKafka.emit).toHaveBeenCalledWith(
        'audit.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'admin.user_viewed',
            userId: USER_ID,
          }),
        }),
      );
    });
  });

  describe('freezeUser', () => {
    it('gets wallet then freezes it and emits audit event', async () => {
      mockWalletClient.getWallet.mockReturnValue(
        of({ id: WALLET_ID, balance: 0, currency: 'USD', status: 'ACTIVE' }),
      );
      mockWalletClient.freezeWallet.mockReturnValue(of({ success: true }));

      const result = await service.freezeUser(USER_ID, ADMIN_ID, 'suspicious');

      expect(mockWalletClient.getWallet).toHaveBeenCalledWith({
        userId: USER_ID,
      });
      expect(mockWalletClient.freezeWallet).toHaveBeenCalledWith({
        walletId: WALLET_ID,
      });
      expect(result).toEqual({ success: true });
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'audit.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'admin.user_frozen',
            userId: USER_ID,
          }),
        }),
      );
    });
  });

  describe('unfreezeUser', () => {
    it('gets wallet then unfreezes it and emits audit event', async () => {
      mockWalletClient.getWallet.mockReturnValue(
        of({ id: WALLET_ID, balance: 0, currency: 'USD', status: 'ACTIVE' }),
      );
      mockWalletClient.unfreezeWallet.mockReturnValue(of({ success: true }));

      const result = await service.unfreezeUser(USER_ID, ADMIN_ID);

      expect(mockWalletClient.unfreezeWallet).toHaveBeenCalledWith({
        walletId: WALLET_ID,
      });
      expect(result).toEqual({ success: true });
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'audit.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'admin.user_unfrozen',
            userId: USER_ID,
          }),
        }),
      );
    });
  });

  describe('updateUserRole', () => {
    it('patches role on auth service and emits audit event', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as any);

      await service.updateUserRole(USER_ID, ADMIN_ID, 'ADMIN', AUTH_HEADER);

      expect(fetch).toHaveBeenCalledWith(
        `http://auth:4001/api/v1/auth/users/${USER_ID}/role`,
        expect.objectContaining({ method: 'PATCH' }),
      );
      expect(mockKafka.emit).toHaveBeenCalledWith(
        'audit.events',
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'admin.user_role_updated',
            role: 'ADMIN',
          }),
        }),
      );
    });

    it('throws when auth service returns non-ok', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue({ ok: false, status: 422 } as any);
      await expect(
        service.updateUserRole(USER_ID, ADMIN_ID, 'ADMIN', AUTH_HEADER),
      ).rejects.toThrow('Auth role update failed: 422');
    });
  });
});
