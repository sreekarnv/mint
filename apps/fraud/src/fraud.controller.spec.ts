import { Test, TestingModule } from '@nestjs/testing';
import { FraudController } from './fraud.controller';
import { FraudService } from './fraud.service';

describe('FraudController', () => {
  let fraudController: FraudController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FraudController],
      providers: [FraudService],
    }).compile();

    fraudController = app.get<FraudController>(FraudController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(fraudController.getHello()).toBe('Hello World!');
    });
  });
});
