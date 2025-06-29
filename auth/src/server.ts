import { createServer } from 'http';
import authApplication from '@/app';
import { connectRabbit, declareQueues } from '@/utils/rabbitmq';
import { connectMongoDB } from './utils/mongodb';

(async () => {
	try {
		await connectMongoDB();

		await connectRabbit();
		await declareQueues();

		const app = authApplication.getApplication();
		const server = createServer(app);

		server.listen(4001, () => {
			console.log(`Auth service is running on port 4001`);
		});
	} catch (err) {}
})();
