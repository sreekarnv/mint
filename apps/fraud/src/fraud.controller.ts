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

@Controller()
export class FraudController {
  constructor(private fraudService: FraudService) {}

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

    console.log(request);

    return {
      decision: 'ALLOW',
      score: 0,
      rulesFired: [],
      reason: '',
    };
  }
}
