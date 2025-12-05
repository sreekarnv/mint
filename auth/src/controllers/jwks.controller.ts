import type { Request, Response, NextFunction } from "express";
import * as jwksService from "~/services/jwks.service";

export async function getJWKS(_: Request, res: Response, next: NextFunction) {
  try {
    const jwks = await jwksService.generateJWKS();
    res.json(jwks);
  } catch (error) {
    next(error);
  }
}
