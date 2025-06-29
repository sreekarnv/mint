import { createServer } from 'http';
import txnApplication from '@/app';
import mongoose from 'mongoose';
import { connectRabbit, startTransferResultConsumer } from '@/utils/rabbitmq';

(async () => {
	try {
		await mongoose.connect('mongodb://127.0.0.1:27017/mint_txn_dev');
		mongoose.set('debug', true);

		await connectRabbit();
		await startTransferResultConsumer();

		const app = txnApplication.getApplication();
		const server = createServer(app);

		server.listen(4003, () => {
			console.log(`Transaction service is running on port 4003`);
		});
	} catch (err) {
		console.log(err);
	}
})();
