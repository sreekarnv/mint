import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "~/utils/jwt";
import z from "zod";
import { userResSchema } from "~/schemas/http/user.res.schema";

export async function authMiddleware(req: Request, _: Response, next: NextFunction) {
  try {
    const authHeader = req.cookies["access.token"];

    if (!authHeader) throw new Error("Missing Authorization header");

    const payload = await verifyAccessToken(authHeader);

    if (!payload.user) throw new Error("Missing Authorization header");

    const user = z.parse(userResSchema, payload.user);

    req.user = user ?? null;
    next();
  } catch (err) {
    next(err);
  }
}
