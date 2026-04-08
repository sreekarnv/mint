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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { SseService } from '../sse/sse.service';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sse: SseService,
  ) {}

  @Get()
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'List the 50 most recent notifications' })
  @ApiResponse({ status: 200, description: 'Notification list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(@Req() req: any) {
    return this.prisma.notification.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Get('unread-count')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Get count of unread notifications' })
  @ApiResponse({ status: 200, description: '{ count: number }' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unreadCount(@Req() req: any) {
    const count = await this.prisma.notification.count({
      where: { userId: req.user.sub, read: false },
    });
    return { count };
  }

  @Post(':id/read')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 201, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
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
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 201, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllRead(@Req() req: any) {
    await this.prisma.notification.updateMany({
      where: { userId: req.user.sub, read: false },
      data: { read: true, readAt: new Date() },
    });
    return { success: true };
  }

  @Sse('stream')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({
    summary: 'Server-Sent Events stream for real-time notifications',
  })
  @ApiResponse({ status: 200, description: 'SSE stream — text/event-stream' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  stream(@Req() req: any): Observable<MessageEvent> {
    return new Observable((observer) => {
      this.sse.register(req.user.sub, observer);
      return () => this.sse.deregister(req.user.sub, observer);
    });
  }
}
