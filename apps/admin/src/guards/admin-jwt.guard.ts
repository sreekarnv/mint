import { JWTAuthGuard } from '@mint/common';
import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class AdminJwtGuard extends JWTAuthGuard {
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
