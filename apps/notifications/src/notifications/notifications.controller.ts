import { JWTAuthGuard } from '@mint/common';
import {
  Controller,
  Get,
  MessageEvent,
  NotFoundException,
  Param,
  Post,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { SseService } from '../sse/sse.service';

@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sse: SseService,
  ) {}

  @Get()
  @UseGuards(JWTAuthGuard)
  async list(@Req() req: any) {
    return this.prisma.notification.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Get('unread-count')
  @UseGuards(JWTAuthGuard)
  async unreadCount(@Req() req: any) {
    const count = await this.prisma.notification.count({
      where: { userId: req.user.sub, read: false },
    });
    return { count };
  }

  @Post(':id/read')
  @UseGuards(JWTAuthGuard)
  async markRead(@Param('id') id: string, @Req() req: any) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== req.user.sub) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
  }

  @Post('read-all')
  @UseGuards(JWTAuthGuard)
  async markAllRead(@Req() req: any) {
    await this.prisma.notification.updateMany({
      where: { userId: req.user.sub, read: false },
      data: { read: true, readAt: new Date() },
    });
    return { success: true };
  }

  @Sse('stream')
  @UseGuards(JWTAuthGuard)
  stream(@Req() req: any): Observable<MessageEvent> {
    return new Observable((observer) => {
      this.sse.register(req.user.sub, observer);
      return () => this.sse.deregister(req.user.sub, observer);
    });
  }
}
