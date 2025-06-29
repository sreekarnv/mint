import BaseRouter from '@/routers/base.router';
import * as txnController from '@/controllers/transaction.controller';
import { parseToken } from '@/middleware/token.middleware';

export class TransactionRouter extends BaseRouter {
	constructor() {
		super();
	}

	protected addRoutes() {
		this.router.use(parseToken);
		this.router.post(
			'/transfer',
			txnController.transferValidation,
			txnController.transfer
		);
		this.router.get(
			'/transfer/:transactionId/status',
			txnController.getTransferStatusValidation,
			txnController.getTransferStatus
		);
	}
}

const transactionRouter = new TransactionRouter();

export default transactionRouter;
