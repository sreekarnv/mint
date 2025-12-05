import { Schema, Types, model, InferSchemaType } from "mongoose";
import { transactionStatus, transactionType } from "~/schemas/domain/transaction.domain.schema";

export const transactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: transactionType.enum,
      required: true,
    },
    status: {
      type: String,
      enum: transactionStatus.enum,
      default: transactionStatus.enum.Pending,
    },

    userId: { type: Types.ObjectId },
    fromUserId: { type: Types.ObjectId },
    toUserId: { type: Types.ObjectId },

    amount: { type: Number, required: true },
    reason: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type TransactionDocument = InferSchemaType<typeof transactionSchema>;
export const TransactionModel = model<TransactionDocument>("transactions", transactionSchema);
