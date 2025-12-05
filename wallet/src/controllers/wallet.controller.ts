import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as walletService from "../services/wallet.service";

export async function userWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const wallet = await walletService.getWalletByUser(req.user!.id);
    res.status(StatusCodes.OK).json(wallet);
  } catch (error) {
    next(error);
  }
}
