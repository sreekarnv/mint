import express, { type Express } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import healthRouter from './routers/health.router';
import authRouter from './routers/auth.router';
import { errorHandler } from './controllers/error.controller';

export class AuthApplication {
	private app!: Express;

	constructor() {
		this.app = express();

		this.addStandardMiddleware();
		this.addSecurityMiddleware();
		this.addLoggingMiddleware();

		this.addApiRoutes();
	}

	private addStandardMiddleware(): void {
		this.app.use(express.json({ limit: '200mb' }));
		this.app.use(express.urlencoded({ extended: true, limit: '200mb' }));
	}

	private addSecurityMiddleware(): void {
		this.app.use(cors());
	}

	private addLoggingMiddleware(): void {
		this.app.use(morgan('dev'));
	}

	private addApiRoutes(): void {
		this.app.use('/healthz', healthRouter.getRouter());
		this.app.use('/api/auth', authRouter.getRouter());

		this.app.use(errorHandler);
	}

	public getApplication(): Express {
		return this.app;
	}
}

const authApplication = new AuthApplication();

export default authApplication;
