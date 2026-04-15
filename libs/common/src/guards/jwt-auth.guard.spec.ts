import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JWTAuthGuard } from './jwt-auth.guard';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'mock-jwks'),
  jwtVerify: jest.fn(),
}));

import { jwtVerify } from 'jose';
const mockJwtVerify = jwtVerify as jest.Mock;

function makeCtx(
  headers: Record<string, string> = {},
  cookies: Record<string, string> = {},
) {
  const req: any = { headers, cookies };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    _req: req,
  } as unknown as ExecutionContext;
}

describe('JWTAuthGuard', () => {
  let guard: JWTAuthGuard;

  beforeEach(() => {
    process.env.AUTH_JWKS_URL =
      'https://auth.example.com/.well-known/jwks.json';
    process.env.JWT_ISSUER = 'mint-auth';
    process.env.JWT_AUDIENCE = 'mint-services';
    mockJwtVerify.mockReset();
    guard = new JWTAuthGuard();
  });

  it('throws UnauthorizedException when no token is present', async () => {
    const ctx = makeCtx();
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException for a malformed bearer token', async () => {
    mockJwtVerify.mockRejectedValueOnce(new Error('JWSInvalid'));
    const ctx = makeCtx({ authorization: 'Bearer not.a.valid.jwt' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException for a cookie with invalid token', async () => {
    mockJwtVerify.mockRejectedValueOnce(new Error('JWSInvalid'));
    const ctx = makeCtx({}, { access_token: 'totally-invalid' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException and not an unhandled 500 for expired/bad tokens', async () => {
    mockJwtVerify.mockRejectedValueOnce(new Error('JWTExpired'));
    const ctx = makeCtx({
      authorization:
        'Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyMSJ9.invalidsig',
    });
    const err = await guard.canActivate(ctx).catch((e) => e);
    expect(err).toBeInstanceOf(UnauthorizedException);
    expect(err.message).toBe('Invalid or expired token');
  });

  it('throws UnauthorizedException when issuer does not match', async () => {
    mockJwtVerify.mockRejectedValueOnce(
      new Error('JWTClaimValidationFailed: issuer claim check failed'),
    );
    const ctx = makeCtx({ authorization: 'Bearer sometoken' });
    const err = await guard.canActivate(ctx).catch((e) => e);
    expect(err).toBeInstanceOf(UnauthorizedException);
    expect(err.message).toBe('Invalid or expired token');
  });

  it('throws UnauthorizedException when audience does not match', async () => {
    mockJwtVerify.mockRejectedValueOnce(
      new Error('JWTClaimValidationFailed: audience claim check failed'),
    );
    const ctx = makeCtx({ authorization: 'Bearer sometoken' });
    const err = await guard.canActivate(ctx).catch((e) => e);
    expect(err).toBeInstanceOf(UnauthorizedException);
    expect(err.message).toBe('Invalid or expired token');
  });

  it('attaches payload to request on valid token', async () => {
    const fakePayload = {
      sub: 'user123',
      iss: 'mint-auth',
      aud: 'mint-services',
    };
    mockJwtVerify.mockResolvedValueOnce({ payload: fakePayload });
    const ctx = makeCtx({ authorization: 'Bearer validtoken' });
    const req = ctx.switchToHttp().getRequest();
    await guard.canActivate(ctx);
    expect(req.user).toEqual(fakePayload);
  });

  it('passes issuer and audience from env to jwtVerify', async () => {
    mockJwtVerify.mockResolvedValueOnce({ payload: { sub: 'u1' } });
    const ctx = makeCtx({ authorization: 'Bearer tok' });
    await guard.canActivate(ctx);
    expect(mockJwtVerify).toHaveBeenCalledWith(
      'tok',
      'mock-jwks',
      expect.objectContaining({
        issuer: 'mint-auth',
        audience: 'mint-services',
      }),
    );
  });

  describe('extractToken', () => {
    it('extracts bearer token from Authorization header', () => {
      const req: any = {
        headers: { authorization: 'Bearer mytoken' },
        cookies: {},
      };
      expect(guard.extractToken(req)).toBe('mytoken');
    });

    it('extracts token from cookie when no Authorization header', () => {
      const req: any = {
        headers: {},
        cookies: { access_token: 'cookietoken' },
      };
      expect(guard.extractToken(req)).toBe('cookietoken');
    });

    it('returns null when neither header nor cookie present', () => {
      const req: any = { headers: {}, cookies: {} };
      expect(guard.extractToken(req)).toBeNull();
    });
  });
});
