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
export class Transaction {
	readonly _id!: string;

	@Property({
		type: mongoose.SchemaTypes.ObjectId,
		required: true,
	})
	from!: string;

	@Property({
		type: mongoose.SchemaTypes.ObjectId,
		required: true,
	})
	to!: string;

	@Property({
		required: true,
	})
	amount!: number;

	@Property({
		enum: ['success', 'failed', 'pending'],
		default: 'pending',
	})
	status!: string;

	@Property()
	reason?: string;

	readonly createdAt?: Date;

	readonly updatedAt?: Date;
}

const TransactionModel = (mongoose.models.Transaction ||
	getModelForClass(Transaction)) as ReturnModelType<typeof Transaction, {}>;

export default TransactionModel;
