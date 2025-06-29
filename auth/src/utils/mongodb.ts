import mongoose from 'mongoose';

export const connectMongoDB = async () => {
	await mongoose.connect(Bun.env.MONGO_URI);
	mongoose.set('debug', true);
};
