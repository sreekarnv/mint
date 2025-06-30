import amqplib from 'amqplib';

export let channel: amqplib.Channel;

export const connectRabbit = async () => {
	const connection = await amqplib.connect(Bun.env.RABBITMQ_URI);
	channel = await connection.createChannel();
	console.log('Auth Service RabbitMQ connected');
};

export const declareQueues = async () => {
	await channel.assertQueue('user.registered', { durable: true });
};
