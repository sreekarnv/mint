import { UserModel, type UserSchemaType } from "~/models/user.model";
import * as argon2 from "argon2";

export async function createTestUser(overrides?: Partial<UserSchemaType>) {
  const hashedPassword = await argon2.hash("password123", { hashLength: 14 });

  const user = await UserModel.create({
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    password: hashedPassword,
    role: "user",
    isActive: true,
    emailVerifiedAt: null,
    ...overrides,
  });

  return user;
}

export const testUserData = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  password: "password123",
  passwordConfirm: "password123",
};

export const invalidEmails = ["notanemail", "@example.com", "test@", "test"];
