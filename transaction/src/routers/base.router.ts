import { Router } from 'express';

export default class BaseRouter {
	protected router: Router;

	constructor() {
		this.router = Router();

		this.addRoutes();
	}

	protected addRoutes() {}

	public getRouter(): Router {
		return this.router;
	}
}
