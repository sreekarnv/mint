import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { Observer } from 'rxjs';

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);
  private clients: Map<string, Set<Observer<MessageEvent>>> = new Map();

  register(userId: string, observer: Observer<MessageEvent>): void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(observer);
    this.logger.log(`SSE client connected for user ${userId}`);
  }

  deregister(userId: string, observer: Observer<MessageEvent>): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(observer);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
      this.logger.log(`SSE client disconnected for user ${userId}`);
    }
  }

  broadcast(userId: string, notification: any): void {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) return;

    const event: MessageEvent = { data: JSON.stringify(notification) };

    for (const observer of userClients) {
      try {
        observer.next(event);
      } catch (err) {
        this.logger.error(
          `Failed to broadcast to client for user ${userId}: ${err}`,
        );
      }
    }

    this.logger.log(
      `Broadcasted notification to ${userClients.size} client(s) for user ${userId}`,
    );
  }
}
