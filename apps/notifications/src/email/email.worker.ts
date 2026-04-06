import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as ejs from 'ejs';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

export interface EmailJob {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
}

const TEMPLATE_DIR = path.join(
  process.cwd(),
  'apps/notifications/src/email/templates',
);

@Processor('email')
export class EmailWorker extends WorkerHost {
  private readonly logger = new Logger(EmailWorker.name);
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mailhog',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: false,
      ignoreTLS: true,
    });
  }

  async process(job: Job<EmailJob>): Promise<void> {
    const { to, subject, template, variables } = job.data;

    this.logger.log(`Sending email to ${to} [${template}]`);

    const html = await this.render(template, variables);

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'Mint <noreply@mint.dev>',
      to,
      subject,
      html,
    });

    this.logger.log(`Email sent to ${to}: ${subject}`);
  }

  private async render(
    template: string,
    variables: Record<string, any>,
  ): Promise<string> {
    const filePath = path.join(TEMPLATE_DIR, `${template}.ejs`);
    try {
      return await ejs.renderFile(filePath, variables, { async: true });
    } catch (err) {
      console.error(`[render] Failed on template "${template}":`, err);
      throw err;
    }
  }
}
