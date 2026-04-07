import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';

@Injectable()
export class SigningService {
  generateSecret(): string {
    return randomBytes(32).toString('hex');
  }

  sign(secret: string, payload: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  verify(secret: string, payload: string, signature: string): boolean {
    const expected = this.sign(secret, payload);

    if (expected.length !== signature.length) return false;

    let result = 0;
    for (let i = 0; i < expected.length; i++) {
      result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }

    return result === 0;
  }
}
