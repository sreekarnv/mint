import { Router } from "express";
import { authMiddleware } from "~/middleware/auth.middleware";
import * as walletController from "~/controllers/wallet.controller";

const walletRouter = Router();

walletRouter.use(authMiddleware);
walletRouter.get("/user", walletController.userWallet);

export { walletRouter };
