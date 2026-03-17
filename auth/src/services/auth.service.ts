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
import { cacheGet, cacheSet, cacheDelete } from "~/utils/cache";

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

  await cacheDelete(`auth:user:email:${user.email}`);
  await cacheDelete(`auth:user:exists:${user.email}`);

  return z.parse(signupResBodySchema, user);
}

export async function login(loginInput: LoginReqBodyType): Promise<LoginResBodyType> {
  const { email, password } = loginInput;

  const cacheKey = `auth:user:email:${email}`;
  const cachedUser = await cacheGet<UserResType & { password: string }>(cacheKey);

  let userToCache: UserResType | null;

  if (!cachedUser) {
    const userDoc = await UserModel.findOne({ email }).select("+password");

    if (!userDoc) {
      throw new UnauthorizedError("Invalid Credentials");
    }

    const userJson = userDoc.toJSON();
    userToCache = {
      ...userJson,
      id: userDoc._id.toString(),
      password: userDoc.password,
    };

    await cacheSet(cacheKey, userToCache, 300);
  } else {
    userToCache = cachedUser;
  }

  if (!(await verifyPassword(password, userToCache.password))) {
    throw new UnauthorizedError("Invalid Credentials");
  }

  return z.parse(loginResBodySchema, userToCache);
}

export async function getLoggedInUser(accessToken: string): Promise<UserResType | null> {
  if (!accessToken) {
    return null;
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    const user = payload.payload.user;

    if (!user) {
      return null;
    }

    const cacheKey = `auth:user:exists:${user.email}`;
    const cachedExists = await cacheGet<boolean>(cacheKey);

    if (cachedExists === null) {
      const exists = (await UserModel.countDocuments({ email: user.email })) == 1;

      if (!exists) {
        return null;
      }

      await cacheSet(cacheKey, true, 300);
    } else if (!cachedExists) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
