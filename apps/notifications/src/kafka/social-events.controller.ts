import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from '../notifications/notifications.service';

@Controller()
export class SocialEventsController {
  private readonly logger = new Logger(SocialEventsController.name);

  constructor(private readonly notifications: NotificationsService) {}

  @EventPattern('social.events')
  async handleSocialEvents(@Payload() envelope: any): Promise<void> {
    const event = envelope?.payload?.event;

    if (event === 'social.friend_request_sent') {
      await this.handleFriendRequestSent(envelope.payload);
    } else if (event === 'social.friend_request_accepted') {
      await this.handleFriendRequestAccepted(envelope.payload);
    } else if (event === 'social.friend_joined') {
      await this.handleFriendJoined(envelope.payload);
    }
  }

  private async handleFriendRequestSent(payload: any) {
    await this.notifications.create({
      userId: payload.recipientId,
      type: 'social.friend_request_sent',
      title: 'Friend Request',
      body: `${payload.senderName ?? 'Someone'} sent you a friend request.`,
      data: { senderId: payload.senderId },
    });

    this.logger.log(
      `Processed social.friend_request_sent to ${payload.recipientId}`,
    );
  }

  private async handleFriendRequestAccepted(payload: any) {
    await this.notifications.create({
      userId: payload.senderId,
      type: 'social.friend_request_accepted',
      title: 'Friend Request Accepted',
      body: `${payload.recipientName ?? 'Someone'} accepted your friend request.`,
      data: { recipientId: payload.recipientId },
    });

    this.logger.log(
      `Processed social.friend_request_accepted for ${payload.senderId}`,
    );
  }

  private async handleFriendJoined(payload: any) {
    await this.notifications.create({
      userId: payload.inviterId,
      type: 'social.friend_joined',
      title: 'Friend Joined Mint',
      body: `${payload.friendName ?? 'A friend'} just joined Mint!`,
      data: { friendId: payload.friendId },
    });

    this.logger.log(
      `Processed social.friend_joined for inviter ${payload.inviterId}`,
    );
  }
}
