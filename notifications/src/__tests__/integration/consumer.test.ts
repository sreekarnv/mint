import { describe, it, expect, vi, beforeEach } from "vitest";
import * as emailService from "~/services/email.service";
import { mailer } from "~/utils/mail";
import type { UserResType } from "~/schemas/http/user.schema";

// Mock the mailer
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

describe("Notification Consumers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("User Signup Event", () => {
    it("should send signup email when user signup event is received", async () => {
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

      await emailService.sendSignupEmail(userData);

      expect(mailer.sendMail).toHaveBeenCalledTimes(1);
      expect(mailer.sendMail).toHaveBeenCalledWith({
        to: userData.email,
        subject: "Welcome to Mint!",
        html: expect.stringContaining("John Doe"),
      });
    });

    it("should handle email sending failure gracefully", async () => {
      vi.mocked(mailer.sendMail).mockRejectedValueOnce(new Error("SMTP Error"));

      const userData: UserResType = {
        id: "user123",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        role: "user",
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(emailService.sendSignupEmail(userData)).rejects.toThrow("SMTP Error");
      expect(mailer.sendMail).toHaveBeenCalledTimes(1);
    });

    it("should send email with correct user information", async () => {
      const userData: UserResType = {
        id: "user456",
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice.johnson@example.com",
        role: "user",
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await emailService.sendSignupEmail(userData);

      const callArgs = vi.mocked(mailer.sendMail).mock.calls[0][0];
      expect(callArgs.to).toBe("alice.johnson@example.com");
      expect(callArgs.html).toContain("Alice Johnson");
      expect(callArgs.subject).toBe("Welcome to Mint!");
    });

    it("should include welcome message in email body", async () => {
      const userData: UserResType = {
        id: "user789",
        firstName: "Bob",
        lastName: "Wilson",
        email: "bob.wilson@example.com",
        role: "user",
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await emailService.sendSignupEmail(userData);

      const callArgs = vi.mocked(mailer.sendMail).mock.calls[0][0];
      expect(callArgs.html).toContain("welcome");
    });

    it("should send email for users with different roles", async () => {
      const adminUser: UserResType = {
        id: "admin123",
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        role: "admin",
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await emailService.sendSignupEmail(adminUser);

      expect(mailer.sendMail).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(mailer.sendMail).mock.calls[0][0];
      expect(callArgs.to).toBe("admin@example.com");
    });

    it("should handle multiple signup emails in sequence", async () => {
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
        {
          id: "user3",
          firstName: "User",
          lastName: "Three",
          email: "user3@example.com",
          role: "user",
          emailVerifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const user of users) {
        await emailService.sendSignupEmail(user);
      }

      expect(mailer.sendMail).toHaveBeenCalledTimes(3);
    });
  });
});
