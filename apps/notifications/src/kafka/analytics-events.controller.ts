import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from '../notifications/notifications.service';

@Controller()
export class AnalyticsEventsController {
  private readonly logger = new Logger(AnalyticsEventsController.name);

  constructor(private readonly notifications: NotificationsService) {}

  @EventPattern('analytics.events')
  async handleAnalyticsEvents(@Payload() envelope: any): Promise<void> {
    const event = envelope?.payload?.event;

    if (event === 'analytics.budget_warning') {
      await this.handleBudgetWarning(envelope.payload);
    } else if (event === 'analytics.budget_exceeded') {
      await this.handleBudgetExceeded(envelope.payload);
    }
  }

  private async handleBudgetWarning(payload: any) {
    const pct = ((payload.ratio ?? 0.8) * 100).toFixed(0);

    await this.notifications.create({
      userId: payload.userId,
      type: 'analytics.budget_warning',
      title: 'Budget Warning',
      body: `You've used ${pct}% of your ${payload.category} budget this month.`,
      data: {
        category: payload.category,
        used: payload.used,
        limit: payload.limit,
      },
    });

    const email = await this.notifications.getUserEmail(payload.userId);
    if (email) {
      await this.notifications.enqueueEmail({
        to: email,
        subject: `Budget Warning - ${payload.category}`,
        template: 'budget-warning',
        variables: {
          ratio: pct,
          category: payload.category,
          used: (payload.used / 100).toFixed(2),
          limit: (payload.limit / 100).toFixed(2),
        },
      });
    }

    this.logger.log(
      `Processed analytics.budget_warning for ${payload.userId} (${payload.category})`,
    );
  }

  private async handleBudgetExceeded(payload: any) {
    await this.notifications.create({
      userId: payload.userId,
      type: 'analytics.budget_exceeded',
      title: 'Budget Exceeded',
      body: `You've exceeded your ${payload.category} budget for this month.`,
      data: {
        category: payload.category,
        used: payload.used,
        limit: payload.limit,
      },
    });

    const email = await this.notifications.getUserEmail(payload.userId);
    if (email) {
      await this.notifications.enqueueEmail({
        to: email,
        subject: `Budget Exceeded - ${payload.category}`,
        template: 'budget-exceeded',
        variables: {
          category: payload.category,
          used: (payload.used / 100).toFixed(2),
          limit: (payload.limit / 100).toFixed(2),
        },
      });
    }

    this.logger.log(
      `Processed analytics.budget_exceeded for ${payload.userId} (${payload.category})`,
    );
  }
}
