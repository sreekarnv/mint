import { Injectable } from '@nestjs/common';

@Injectable()
export class SocialService {
  getHello(): string {
    return 'Hello World!';
  }
}
