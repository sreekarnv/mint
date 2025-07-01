import { createServer } from 'http';
import txnApplication from '@/app';
import mongoose from 'mongoose';
import {
	connectRabbit,
	startTopUpResultConsumer,
	startTransferResultConsumer,
} from '@/utils/rabbitmq';

(async () => {
	try {
		await mongoose.connect(Bun.env.MONGO_URI);
		mongoose.set('debug', true);

		await connectRabbit();
		await startTransferResultConsumer();
		await startTopUpResultConsumer();

		const app = txnApplication.getApplication();
		const server = createServer(app);

		server.listen(Bun.env.PORT, () => {
			console.log(`Transaction service is running on port ${Bun.env.PORT}`);
		});
	} catch (err) {
		console.log(err);
	}
})();
