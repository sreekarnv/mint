import { Router } from "express";
import validate from "express-zod-safe";
import * as transactionController from "~/controllers/transaction.controller";
import { authMiddleware } from "~/middleware/auth.middleware";
import { topupReqBody, transferReqBody } from "~/schemas/http/transaction.req.schema";

const transactionRouter = Router();

transactionRouter.use(authMiddleware);

transactionRouter.route("/").get(transactionController.listTransactions);
transactionRouter.route("/:id").get(transactionController.getTransaction);
transactionRouter.route("/transfer").post(validate({ body: transferReqBody }), transactionController.transfer);
transactionRouter.route("/topup").post(validate({ body: topupReqBody }), transactionController.topup);

export { transactionRouter };
