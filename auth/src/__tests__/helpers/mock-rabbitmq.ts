import { vi } from "vitest";

export const mockRabbitMQPublisher = {
  publish: vi.fn().mockResolvedValue(undefined),
};

export const mockRabbitMQConnection = {
  createChannel: vi.fn().mockResolvedValue({
    assertExchange: vi.fn().mockResolvedValue(undefined),
    assertQueue: vi.fn().mockResolvedValue(undefined),
    bindQueue: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockResolvedValue(true),
    consume: vi.fn().mockResolvedValue(undefined),
    ack: vi.fn().mockResolvedValue(undefined),
    nack: vi.fn().mockResolvedValue(undefined),
  }),
  close: vi.fn().mockResolvedValue(undefined),
};

export function resetRabbitMQMocks() {
  mockRabbitMQPublisher.publish.mockClear();
  mockRabbitMQConnection.createChannel.mockClear();
}
