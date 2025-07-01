import WalletModel from '@/models/wallet.model';
import { channel } from '@/utils/rabbitmq';

export const startTransferConsumer = async () => {
	channel.consume('transfer.initiated', async (msg) => {
		if (!msg) return;
		const {
			transactionId,
			from: fromUserId,
			to: toUserId,
			amount,
		} = JSON.parse(msg.content.toString());

		try {
			const [fromWallet, toWallet] = await Promise.all([
				WalletModel.findOne({ userId: fromUserId }),
				WalletModel.findOne({ userId: toUserId }),
			]);

			if (!fromWallet || !toWallet) throw new Error('Wallet not found');
			if (fromWallet.balance < amount) throw new Error('Insufficient balance');

			fromWallet.balance -= amount;
			toWallet.balance += amount;

			await fromWallet.save();
			await toWallet.save();

			channel.sendToQueue(
				'transfer.completed',
				Buffer.from(JSON.stringify({ transactionId })),
				{ persistent: true }
			);
		} catch (err: any) {
			channel.sendToQueue(
				'transfer.failed',
				Buffer.from(JSON.stringify({ transactionId, reason: err.message })),
				{ persistent: true }
			);
		}

		channel.ack(msg);
	});
};

export async function startTopUpConsumer() {
	await channel.assertQueue('topup.initiated', { durable: true });

	await channel.consume('topup.initiated', async (msg) => {
		if (!msg) return;

		const data = JSON.parse(msg.content.toString());

		try {
			const wallet = await WalletModel.findOneAndUpdate(
				{ userId: data.userId },
				{ $inc: { balance: data.amount } },
				{ new: true }
			);
			wallet?.save();

			channel.sendToQueue(
				'topup.completed',
				Buffer.from(
					JSON.stringify({
						wallet,
						transactionId: data.transactionId,
						status: 'success',
					})
				),
				{ persistent: true }
			);

			channel.ack(msg);
		} catch (error) {
			channel.sendToQueue(
				'topup.completed',
				Buffer.from(
					JSON.stringify({
						wallet: null,
						transactionId: data.transactionId,
						status: 'failed',
					})
				),
				{ persistent: true }
			);

			channel.ack(msg);
		}
	});
}
