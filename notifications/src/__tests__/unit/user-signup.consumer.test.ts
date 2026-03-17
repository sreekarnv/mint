import { describe, it, expect, vi, beforeEach } from "vitest";
import { userSignupConsumer } from "~/consumers/user-signup.consumer";
import * as rabbitmqConsumer from "~/rabbitmq/consumer";
import * as emailService from "~/services/email.service";
import { Queues } from "~/rabbitmq/topology";
import type { UserResType } from "~/schemas/http/user.schema";

vi.mock("~/rabbitmq/consumer", () => ({
  consume: vi.fn(),
}));

vi.mock("~/services/email.service", () => ({
  sendSignupEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("User Signup Consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set up consumer for EMAIL_SIGNUP queue", async () => {
    await userSignupConsumer();

    expect(rabbitmqConsumer.consume).toHaveBeenCalledTimes(1);
    expect(rabbitmqConsumer.consume).toHaveBeenCalledWith(Queues.EMAIL_SIGNUP, expect.any(Function));
  });

  it("should call sendSignupEmail when message is received", async () => {
    type MessageHandler = (data: UserResType) => Promise<void>;
    let messageHandler: MessageHandler | null = null;

    vi.mocked(rabbitmqConsumer.consume).mockImplementation(
      async <T>(_queue: string, handler: (data: T) => Promise<void>) => {
        messageHandler = handler as MessageHandler;
      },
    );

    await userSignupConsumer();

    const userData: UserResType = {
      id: "user123",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      role: "user",
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(messageHandler).toBeTruthy();
    if (messageHandler) {
      await messageHandler(userData);
      expect(emailService.sendSignupEmail).toHaveBeenCalledWith(userData);
    }
  });

  it("should handle multiple messages sequentially", async () => {
    type MessageHandler = (data: UserResType) => Promise<void>;
    let messageHandler: MessageHandler | null = null;

    vi.mocked(rabbitmqConsumer.consume).mockImplementation(
      async <T>(_queue: string, handler: (data: T) => Promise<void>) => {
        messageHandler = handler as MessageHandler;
      },
    );

    await userSignupConsumer();

    const users: UserResType[] = [
      {
        id: "user1",
        firstName: "User",
        lastName: "One",
        email: "user1@example.com",
        role: "user",
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "user2",
        firstName: "User",
        lastName: "Two",
        email: "user2@example.com",
        role: "user",
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    expect(messageHandler).toBeTruthy();
    if (messageHandler) {
      for (const user of users) {
        await messageHandler(user);
      }
      expect(emailService.sendSignupEmail).toHaveBeenCalledTimes(2);
    }
  });
});
