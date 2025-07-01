import BaseRouter from '@/routers/base.router';
import * as walletController from '@/controllers/wallet.controller';
import { parseToken } from '@/middleware/token.middleware';
import { protectRoute } from '@/middleware/protect.middleware';

export class WalletRouter extends BaseRouter {
	constructor() {
		super();
	}

	protected addRoutes() {
		this.router.use(parseToken);
		this.router.use(protectRoute);

		this.router.route('/').get(walletController.get);
	}
}

const walletRouter = new WalletRouter();

export default walletRouter;
