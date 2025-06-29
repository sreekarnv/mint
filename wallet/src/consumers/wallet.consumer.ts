import WalletModel from '@/models/wallet.model';
import { channel } from '@/utils/rabbitmq';

export const startWalletConsumer = async () => {
	channel.consume('user.registered', async (msg: any) => {
		if (msg) {
			const payload = JSON.parse(msg.content.toString());
			const { userId } = payload;

			console.log(`Creating wallet for user: ${userId}`);

			const exists = await WalletModel.findOne({ userId });

			if (!exists) {
				await WalletModel.create({ userId });
				console.log(`New wallet created for ${userId}`);
			}

			channel.ack(msg);
		}
	});
};
