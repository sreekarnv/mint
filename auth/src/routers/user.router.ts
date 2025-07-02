import BaseRouter from '@/routers/base.router';
import { parseToken } from '@/middlewares/token.middleware';
import { protectRoute } from '@/middlewares/protect.middleware';
import * as searchController from '@/controllers/search.controller';

export class UserRouter extends BaseRouter {
	constructor() {
		super();
	}

	protected addRoutes() {
		this.router.use(parseToken);
		this.router.use(protectRoute);

		this.router.get('/search', searchController.get);
	}
}

const userRouter = new UserRouter();

export default userRouter;
