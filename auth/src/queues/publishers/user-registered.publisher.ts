import { channel } from '@/utils/rabbitmq';

export const userRegisteredPublisher = async (data: {
	userId: string;
	email: string;
}) => {
	if (!channel) throw new Error('RabbitMQ channel not initialized');

	channel.sendToQueue('user.registered', Buffer.from(JSON.stringify(data)), {
		persistent: true,
	});
};
