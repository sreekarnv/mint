import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JWTAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AdminGuard extends JWTAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const request = context.switchToHttp().getRequest();
    const adminUserIds = (process.env.ADMIN_USER_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!adminUserIds.includes(request.user.sub)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
