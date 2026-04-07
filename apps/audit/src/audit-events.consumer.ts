import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AuditService } from './audit.service';

@Controller()
export class AuditEventsConsumer {
  constructor(private readonly auditService: AuditService) {}

  @EventPattern('auth.events')
  async handleAuthEvents(@Payload() message: any) {
    await this.auditService.appendEntry(message);
  }

  @EventPattern('wallet.events')
  async handleWalletEvents(@Payload() message: any) {
    await this.auditService.appendEntry(message);
  }

  @EventPattern('transaction.events')
  async handleTransactionEvents(@Payload() message: any) {
    await this.auditService.appendEntry(message);
  }

  @EventPattern('kyc.events')
  async handleKycEvents(@Payload() message: any) {
    await this.auditService.appendEntry(message);
  }

  @EventPattern('social.events')
  async handleSocialEvents(@Payload() message: any) {
    await this.auditService.appendEntry(message);
  }

  @EventPattern('analytics.events')
  async handleAnalyticsEvents(@Payload() message: any) {
    await this.auditService.appendEntry(message);
  }

  @EventPattern('webhook.events')
  async handleWebhookEvents(@Payload() message: any) {
    await this.auditService.appendEntry(message);
  }

  @EventPattern('admin.events')
  async handleAdminEvents(@Payload() message: any) {
    await this.auditService.appendEntry(message);
  }

  @EventPattern('audit.events')
  async handleAuditEvents(@Payload() message: any) {
    await this.auditService.appendEntry(message);
  }
}
