import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FraudService } from './fraud.service';

interface GrpcScoreRequest {
  transactionId: string;
  userId: string;
  recipientId: string;
  amountCents: number;
  currency: string;
  ipAddress: string;
  transactionType: string;
  userCountry: string;
  recipientIsContact: boolean;
  senderCurrency: string;
  recipientCurrency: string;
  usdEquivalentCents: number;
}

@Controller('api/v1/fraud')
export class FraudController {
  constructor(private fraudService: FraudService) {}

  @GrpcMethod('FraudService', 'ListReviewQueue')
  async listReviewQueue(req: { limit?: number; offset?: number }) {
    return this.fraudService.listReviewQueue(req.limit ?? 50, req.offset ?? 0);
  }

  @GrpcMethod('FraudService', 'ScoreTransaction')
  async scoreTransaction(req: GrpcScoreRequest) {
    const request = {
      transactionId: req.transactionId,
      userId: req.userId,
      recipientId: req.recipientId,
      amountCents: req.amountCents,
      currency: req.currency,
      ipAddress: req.ipAddress,
      transactionType: req.transactionType,
      userCountry: req.userCountry,
      recipientIsContact: req.recipientIsContact,
      senderCurrency: req.senderCurrency || req.currency,
      recipientCurrency: req.recipientCurrency || req.currency,
      usdEquivalentCents: req.usdEquivalentCents || req.amountCents,
    };

    const result = await this.fraudService.evalute(request);

    return {
      decision: result.decision,
      score: result.score,
      rulesFired: result.rulesFired,
      reason: result.reason,
    };
  }
}
