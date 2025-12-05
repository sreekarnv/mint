import { omit } from "lodash";
import { Schema, model, SchemaTypes, Types } from "mongoose";
import { z } from "zod";

export const walletSchemaZod = z.object({
  userId: z.string().transform((id) => new Types.ObjectId(id)),
  balance: z.int().default(0),
});

export type WalletSchemaType = z.infer<typeof walletSchemaZod>;

export const walletSchema = new Schema<WalletSchemaType>(
  {
    userId: {
      type: SchemaTypes.ObjectId,
      required: [true, "user_id is a required"],
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_, ret) {
        return omit(ret, ["_id"]);
      },
    },
  },
);

walletSchema.index({ userId: 1 }, { unique: true });

export const WalletModel = model("wallet", walletSchema);
