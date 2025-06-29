import mongoose from 'mongoose';
import type { ReturnModelType } from '@typegoose/typegoose';
import {
	prop as Property,
	modelOptions,
	getModelForClass,
	index,
} from '@typegoose/typegoose';

@index({ userId: 1 })
@modelOptions({
	schemaOptions: {
		timestamps: true,
		toJSON: {
			versionKey: false,
		},
	},
})
export class Wallet {
	readonly _id!: string;

	@Property({
		type: mongoose.SchemaTypes.ObjectId,
		required: true,
	})
	userId!: string;

	@Property({
		default: 0,
	})
	balance!: number;

	readonly createdAt?: Date;

	readonly updatedAt?: Date;
}

const WalletModel = (mongoose.models.Wallet ||
	getModelForClass(Wallet)) as ReturnModelType<typeof Wallet, {}>;

export default WalletModel;
