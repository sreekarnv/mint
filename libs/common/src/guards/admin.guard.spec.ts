import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

function makeCtx(token: string | null, userId: string | null) {
  const req: any = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    cookies: {},
    user: userId ? { sub: userId } : undefined,
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    _req: req,
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    process.env.AUTH_JWKS_URL = 'https://auth.example.com/.well-known/jwks.json';
    process.env.JWT_ISSUER = 'mint-auth';
    process.env.JWT_AUDIENCE = 'mint-services';
    guard = new AdminGuard();
  });

  it('throws UnauthorizedException when no token', async () => {
    const ctx = makeCtx(null, null);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws ForbiddenException when user is not in ADMIN_USER_IDS', async () => {
    process.env.ADMIN_USER_IDS = 'admin1,admin2';
    const ctx = makeCtx('ignored', 'regular-user');

    jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate').mockResolvedValue(true);

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows access when user is in ADMIN_USER_IDS', async () => {
    process.env.ADMIN_USER_IDS = 'admin1,admin2';
    const ctx = makeCtx('ignored', 'admin1');

    jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate').mockResolvedValue(true);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws ForbiddenException when ADMIN_USER_IDS is empty', async () => {
    process.env.ADMIN_USER_IDS = '';
    const ctx = makeCtx('ignored', 'any-user');

    jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate').mockResolvedValue(true);

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
