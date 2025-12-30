import { describe, it, expect, vi, beforeEach } from "vitest";
import * as emailService from "~/services/email.service";
import { mailer } from "~/utils/mail";

vi.mock("~/utils/mail", () => ({
  mailer: {
    sendMail: vi.fn().mockResolvedValue({
      messageId: "test-message-id",
      accepted: ["test@example.com"],
      rejected: [],
      response: "250 Message accepted",
    }),
  },
}));

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendSignupEmail", () => {
    it("should send welcome email with correct data", async () => {
      const userData = {
        id: "user123",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        role: "user" as const,
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await emailService.sendSignupEmail(userData);

      expect(mailer.sendMail).toHaveBeenCalledTimes(1);
      expect(mailer.sendMail).toHaveBeenCalledWith({
        to: "john.doe@example.com",
        subject: "Welcome to Mint!",
        html: expect.stringContaining("John Doe"),
      });
    });

    it("should include welcome message in email", async () => {
      const userData = {
        id: "user123",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        role: "user" as const,
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await emailService.sendSignupEmail(userData);

      const callArgs = vi.mocked(mailer.sendMail).mock.calls[0]?.[0];
      expect(callArgs.html).toContain("welcome");
      expect(callArgs.html).toContain("Jane Smith");
    });

    it("should use correct email subject", async () => {
      const userData = {
        id: "user123",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        role: "user" as const,
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await emailService.sendSignupEmail(userData);

      const callArgs = vi.mocked(mailer.sendMail).mock.calls[0]?.[0];
      expect(callArgs?.subject).toBe("Welcome to Mint!");
    });

    it("should send to correct email address", async () => {
      const userData = {
        id: "user123",
        firstName: "Test",
        lastName: "User",
        email: "specific@example.com",
        role: "user" as const,
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await emailService.sendSignupEmail(userData);

      const callArgs = vi.mocked(mailer.sendMail).mock.calls[0]?.[0];
      expect(callArgs?.to).toBe("specific@example.com");
    });
  });
});
