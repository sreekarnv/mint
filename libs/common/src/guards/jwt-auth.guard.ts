import { Request } from 'express';
import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export class JWTAuthGuard implements CanActivate {
  private jwks = createRemoteJWKSet(new URL(process.env.AUTH_JWKS_URL!));

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const issuer = process.env.JWT_ISSUER || 'mint-auth';
      const audience = process.env.JWT_AUDIENCE || 'mint-services';
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer,
        audience,
      });
      req.user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  extractToken(req: Request): string | null {
    const auth = req.headers['authorization'];
    if (auth?.startsWith('Bearer ')) return auth.slice(7);

    return req.cookies?.access_token ?? null;
  }
}
