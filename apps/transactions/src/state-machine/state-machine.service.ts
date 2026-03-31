import { Injectable, BadRequestException } from '@nestjs/common';
import { TxnStatus } from '../generated/prisma/enums';

const VALID_TRANSITIONS: Record<TxnStatus, TxnStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['COMPLETED', 'FAILED'],
  COMPLETED: ['REVERSED'],
  FAILED: [],
  CANCELLED: [],
  REVERSED: [],
};

@Injectable()
export class StateMachineService {
  validateTransition(from: TxnStatus, to: TxnStatus): void {
    const allowedNextStates = VALID_TRANSITIONS[from];

    if (!allowedNextStates.includes(to)) {
      throw new BadRequestException(
        `Invalid state transition: cannot move from ${from} to ${to}. ` +
          `Allowed transitions from ${from}: ${allowedNextStates.join(', ')}`,
      );
    }
  }

  isTerminal(status: TxnStatus): boolean {
    return VALID_TRANSITIONS[status].length === 0;
  }

  getValidNextStates(current: TxnStatus): TxnStatus[] {
    return VALID_TRANSITIONS[current];
  }
}
