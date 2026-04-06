import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from '../notifications/notifications.service';

// NOTE: FastAuth handles transactional emails for auth flows (verification link,
// password-reset link) via its own email_transport config. This controller only
// creates in-app notifications so no email queuing for auth events.

@Controller()
export class AuthEventsController {
  private readonly logger = new Logger(AuthEventsController.name);

  constructor(private readonly notifications: NotificationsService) {}

  @EventPattern('auth.events')
  async handleAuthEvents(@Payload() envelope: any): Promise<void> {
    const event = envelope?.payload?.event;

    if (event === 'auth.user_registered') {
      await this.handleUserRegistered(envelope.payload);
    } else if (event === 'auth.user_verified') {
      await this.handleUserVerified(envelope.payload);
    }
  }

  private async handleUserRegistered(payload: any) {
    await this.notifications.upsertUserProfile({
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
    });

    // FastAuth already sent the verification-link email via SMTPTransport. No need to handle it here.
    await this.notifications.create({
      userId: payload.userId,
      type: 'auth.user_registered',
      title: 'Welcome to Mint!',
      body: 'Your account has been created. Check your email to verify your address.',
      data: { email: payload.email },
    });

    this.logger.log(`Processed auth.user_registered for ${payload.userId}`);
  }

  private async handleUserVerified(payload: any) {
    // FastAuth completes the verification flow -> in-app notification only.
    await this.notifications.create({
      userId: payload.userId,
      type: 'auth.user_verified',
      title: 'Email Verified',
      body: 'Your email has been verified. You now have full access to Mint.',
    });

    this.logger.log(`Processed auth.user_verified for ${payload.userId}`);
  }
}
