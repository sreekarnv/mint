import BaseRouter from '@/routers/base.router';
import * as walletController from '@/controllers/wallet.controller';

export class WalletRouter extends BaseRouter {
	constructor() {
		super();
	}

	protected addRoutes() {
		this.router.get(
			'/:userId',
			walletController.getInputValidation,
			walletController.get
		);
	}
}

const walletRouter = new WalletRouter();

export default walletRouter;
