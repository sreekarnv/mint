jest.mock(
  '../generated/prisma/enums',
  () => ({
    TxnStatus: {
      PENDING: 'PENDING',
      PROCESSING: 'PROCESSING',
      COMPLETED: 'COMPLETED',
      FAILED: 'FAILED',
      CANCELLED: 'CANCELLED',
      REVERSED: 'REVERSED',
    },
  }),
  { virtual: true },
);

import { BadRequestException } from '@nestjs/common';
import { TxnStatus } from '../generated/prisma/enums';
import { StateMachineService } from './state-machine.service';

describe('StateMachineService', () => {
  let service: StateMachineService;

  beforeEach(() => {
    service = new StateMachineService();
  });

  describe('validateTransition', () => {
    it.each([
      [TxnStatus.PENDING, TxnStatus.PROCESSING],
      [TxnStatus.PENDING, TxnStatus.CANCELLED],
      [TxnStatus.PROCESSING, TxnStatus.COMPLETED],
      [TxnStatus.PROCESSING, TxnStatus.FAILED],
      [TxnStatus.COMPLETED, TxnStatus.REVERSED],
    ])('%s → %s is valid', (from, to) => {
      expect(() => service.validateTransition(from, to)).not.toThrow();
    });

    it.each([
      [TxnStatus.PENDING, TxnStatus.COMPLETED],
      [TxnStatus.PROCESSING, TxnStatus.PENDING],
      [TxnStatus.COMPLETED, TxnStatus.PENDING],
      [TxnStatus.FAILED, TxnStatus.COMPLETED],
      [TxnStatus.CANCELLED, TxnStatus.PROCESSING],
      [TxnStatus.REVERSED, TxnStatus.COMPLETED],
    ])('%s → %s throws BadRequestException', (from, to) => {
      expect(() => service.validateTransition(from, to)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('isTerminal', () => {
    it.each([
      [TxnStatus.FAILED, true],
      [TxnStatus.CANCELLED, true],
      [TxnStatus.REVERSED, true],
    ])('%s is terminal', (status, expected) => {
      expect(service.isTerminal(status)).toBe(expected);
    });

    it.each([
      [TxnStatus.PENDING, false],
      [TxnStatus.PROCESSING, false],
      [TxnStatus.COMPLETED, false],
    ])('%s is not terminal', (status, expected) => {
      expect(service.isTerminal(status)).toBe(expected);
    });
  });

  describe('getValidNextStates', () => {
    it('returns PROCESSING and CANCELLED from PENDING', () => {
      expect(service.getValidNextStates(TxnStatus.PENDING)).toEqual(
        expect.arrayContaining([TxnStatus.PROCESSING, TxnStatus.CANCELLED]),
      );
    });

    it('returns empty array for terminal states', () => {
      expect(service.getValidNextStates(TxnStatus.FAILED)).toEqual([]);
      expect(service.getValidNextStates(TxnStatus.CANCELLED)).toEqual([]);
    });
  });
});
