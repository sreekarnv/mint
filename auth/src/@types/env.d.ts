export {};

declare global {
	namespace Bun {
		const env: {
			JWT_PRIVATE_KEY_PATH: string;
			JWT_PUBLIC_KEY_PATH: string;
			JWT_EXPIRES_IN: string;
			MONGO_URI: string;
			RABBITMQ_URI: string;
			PORT: string;
		};
	}
}
