import BaseRouter from '@/routers/base.router';
import * as signupController from '@/controllers/signup.controller';
import * as loginController from '@/controllers/login.controller';
import * as meController from '@/controllers/me.controller';
import { parseToken } from '@/middlewares/token.middleware';

export class AuthRouter extends BaseRouter {
	constructor() {
		super();
	}

	protected addRoutes() {
		this.router.post(
			'/signup',
			signupController.postInputValidation,
			signupController.post
		);

		this.router.post(
			'/login',
			loginController.postInputValidation,
			loginController.post
		);

		this.router.use(parseToken);

		this.router.get('/me', meController.get);
	}
}

const authRouter = new AuthRouter();

export default authRouter;
