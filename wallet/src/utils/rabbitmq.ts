import amqplib from 'amqplib';

export let channel: amqplib.Channel;

export const connectRabbit = async () => {
	const connection = await amqplib.connect(
		'amqp://admin:pass123%23@localhost:5672'
	);
	channel = await connection.createChannel();
};

export const declareQueues = async () => {
	await channel.assertQueue('transfer.initiated', { durable: true });
	await channel.assertQueue('user.registered', { durable: true });
};
