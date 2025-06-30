import { createServer } from 'http';
import authApplication from '@/app';
import { connectRabbit, declareQueues } from '@/utils/rabbitmq';
import { connectMongoDB } from '@/utils/mongodb';

(async () => {
	try {
		await connectMongoDB();

		await connectRabbit();
		await declareQueues();

		const app = authApplication.getApplication();
		const server = createServer(app);

		server.listen(Bun.env.PORT, () => {
			console.log(`Auth service is running on port ${Bun.env.PORT}`);
		});
	} catch (err) {}
})();
