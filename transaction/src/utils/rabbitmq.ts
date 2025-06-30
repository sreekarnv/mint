import TransactionModel from '@/models/transaction.model';
import amqplib from 'amqplib';

let channel: amqplib.Channel;

export const connectRabbit = async () => {
	const connection = await amqplib.connect(Bun.env.RABBITMQ_URI);
	channel = await connection.createChannel();
	await channel.assertQueue('transfer.initiated', { durable: true });
	await channel.assertQueue('transfer.completed', { durable: true });
	await channel.assertQueue('transfer.failed', { durable: true });
	console.log('Transaction Service RabbitMQ connected');
};

export const publishTransferInitiated = async (data: any) => {
	channel.sendToQueue('transfer.initiated', Buffer.from(JSON.stringify(data)), {
		persistent: true,
	});
};

export const startTransferResultConsumer = async () => {
	channel.consume('transfer.completed', async (msg) => {
		if (msg) {
			const payload = JSON.parse(msg.content.toString());
			await TransactionModel.updateOne(
				{ _id: payload.transactionId },
				{ status: 'success' }
			);
			channel.ack(msg);
		}
	});

	channel.consume('transfer.failed', async (msg) => {
		if (msg) {
			const payload = JSON.parse(msg.content.toString());
			await TransactionModel.updateOne(
				{ _id: payload.transactionId },
				{
					status: 'failed',
					reason: payload.reason,
				}
			);
			channel.ack(msg);
		}
	});
};
