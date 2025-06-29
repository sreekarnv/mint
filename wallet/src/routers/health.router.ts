import BaseRouter from '@/routers/base.router';
import * as healthController from '@/controllers/health.controller';

export class HealthRouter extends BaseRouter {
	constructor() {
		super();
	}

	protected addRoutes() {
		this.router.get('/', healthController.get);
	}
}

const healthRouter = new HealthRouter();

export default healthRouter;
