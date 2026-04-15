import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JWTAuthGuard } from './jwt-auth.guard';

function makeCtx(headers: Record<string, string> = {}, cookies: Record<string, string> = {}) {
  const req: any = { headers, cookies };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    _req: req,
  } as unknown as ExecutionContext;
}

describe('JWTAuthGuard', () => {
  let guard: JWTAuthGuard;

  beforeEach(() => {
    process.env.AUTH_JWKS_URL = 'https://auth.example.com/.well-known/jwks.json';
    process.env.JWT_ISSUER = 'mint-auth';
    process.env.JWT_AUDIENCE = 'mint-services';
    guard = new JWTAuthGuard();
  });

  it('throws UnauthorizedException when no token is present', async () => {
    const ctx = makeCtx();
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException for a malformed bearer token', async () => {
    const ctx = makeCtx({ authorization: 'Bearer not.a.valid.jwt' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException for a cookie with invalid token', async () => {
    const ctx = makeCtx({}, { access_token: 'totally-invalid' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException and not an unhandled 500 for expired/bad tokens', async () => {
    const ctx = makeCtx({ authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyMSJ9.invalidsig' });
    const err = await guard.canActivate(ctx).catch((e) => e);
    expect(err).toBeInstanceOf(UnauthorizedException);
    expect(err.message).toBe('Invalid or expired token');
  });

  describe('extractToken', () => {
    it('extracts bearer token from Authorization header', () => {
      const req: any = { headers: { authorization: 'Bearer mytoken' }, cookies: {} };
      expect(guard.extractToken(req)).toBe('mytoken');
    });

    it('extracts token from cookie when no Authorization header', () => {
      const req: any = { headers: {}, cookies: { access_token: 'cookietoken' } };
      expect(guard.extractToken(req)).toBe('cookietoken');
    });

    it('returns null when neither header nor cookie present', () => {
      const req: any = { headers: {}, cookies: {} };
      expect(guard.extractToken(req)).toBeNull();
    });
  });
});
