import { createServer } from 'http';
import walletApplication from '@/app';
import mongoose from 'mongoose';
import { startWalletConsumer } from '@/consumers/wallet.consumer';
import { startTransferConsumer } from './consumers/transaction.consumer';
import { connectRabbit, declareQueues } from './utils/rabbitmq';
import { connectMongoDB } from './utils/mongodb';

(async () => {
	try {
		await connectMongoDB();

		await connectRabbit();
		await declareQueues();

		await startWalletConsumer();
		await startTransferConsumer();

		const app = walletApplication.getApplication();
		const server = createServer(app);

		server.listen(Bun.env.PORT, () => {
			console.log(`Wallet service is running on port ${Bun.env.PORT}`);
		});
	} catch (err) {
		console.log(err);
	}
})();
