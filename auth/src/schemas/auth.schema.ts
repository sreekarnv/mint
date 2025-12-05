import type { ValidatedRequest } from "express-zod-safe";
import type { Response } from "express";
import z from "zod";
import { userRole } from "~/models/user.model";

export const userResSchema = z.object({
  id: z.coerce.string(),
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().optional(),
  email: z.email(),
  emailVerifiedAt: z.date().nullable(),
  role: userRole,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type UserResType = z.infer<typeof userResSchema>;

export const signupReqBodySchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().optional(),
  email: z.email(),
  password: z.string().min(6),
  passwordConfirm: z.string(),
});

export const signupResBodySchema = userResSchema;

export type SignupReqBodyType = z.infer<typeof signupReqBodySchema>;
export type SignupRequestType = ValidatedRequest<{ body: typeof signupReqBodySchema }>;
export type SignupResBodyType = z.infer<typeof signupResBodySchema>;
export type SignupResponseType = Response<SignupResBodyType>;

export const loginReqBodySchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const loginResBodySchema = userResSchema;

export type LoginReqBodyType = z.infer<typeof loginReqBodySchema>;
export type LoginRequestType = ValidatedRequest<{ body: typeof loginReqBodySchema }>;
export type LoginResBodyType = z.infer<typeof loginResBodySchema>;
export type LoginResponseType = Response<LoginResBodyType>;
