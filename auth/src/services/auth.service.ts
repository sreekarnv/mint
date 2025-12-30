import * as argon2 from "argon2";
import z from "zod";
import { UserModel } from "~/models/user.model";
import {
  loginResBodySchema,
  signupResBodySchema,
  UserResType,
  type LoginReqBodyType,
  type LoginResBodyType,
  type SignupReqBodyType,
  type SignupResBodyType,
} from "~/schemas/auth.schema";
import { verifyAccessToken } from "~/utils/jwt";
import { UnauthorizedError } from "~/utils/errors";

async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { hashLength: 14 });
}

async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}

export async function signup(signupInput: SignupReqBodyType): Promise<SignupResBodyType> {
  const { password, ...rest } = signupInput;
  const hashedPassword = await hashPassword(password);
  const user = await UserModel.create({ password: hashedPassword, ...rest });

  return z.parse(signupResBodySchema, user);
}

export async function login(loginInput: LoginReqBodyType): Promise<LoginResBodyType> {
  const { email, password } = loginInput;

  const user = await UserModel.findOne({ email }).select("+password");

  if (!user || !(await verifyPassword(password, user.password))) {
    throw new UnauthorizedError("Invalid Credentials");
  }

  return z.parse(loginResBodySchema, user);
}

export async function getLoggedInUser(accessToken: string): Promise<UserResType | null> {
  if (!accessToken) {
    return null;
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    const user = payload.payload.user;

    if (!user || !((await UserModel.countDocuments({ email: user.email })) == 1)) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
