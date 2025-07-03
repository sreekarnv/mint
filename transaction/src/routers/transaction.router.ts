import BaseRouter from '@/routers/base.router';
import * as txnController from '@/controllers/transaction.controller';
import * as walletController from '@/controllers/wallet.controller';
import { parseToken } from '@/middleware/token.middleware';
import { protectRoute } from '@/middleware/protect.middleware';

export class TransactionRouter extends BaseRouter {
	constructor() {
		super();
	}

	protected addRoutes() {
		this.router.use(parseToken);
		this.router.use(protectRoute);
		this.router.get(
			'/',
			txnController.getAllTransactionsValidation,
			txnController.getAllTransactions
		);
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
		this.router.post(
			'/wallet/topup',
			walletController.postInputValidation,
			walletController.post
		);
	}
}

const transactionRouter = new TransactionRouter();

export default transactionRouter;
