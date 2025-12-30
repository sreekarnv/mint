import { ValidatedRequest } from "express-zod-safe";
import z from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { objectId } from "~/schemas/common/objectid.schema";

extendZodWithOpenApi(z);

export const MIN_TOPUP_AMOUNT = 1;
export const MAX_TOPUP_AMOUNT = 100000;
export const MIN_TRANSFER_AMOUNT = 1;
export const MAX_TRANSFER_AMOUNT = 50000;

export const transferReqBody = z.object({
  amount: z
    .number()
    .int()
    .min(MIN_TRANSFER_AMOUNT, `Minimum transfer amount is ${MIN_TRANSFER_AMOUNT}`)
    .max(MAX_TRANSFER_AMOUNT, `Maximum transfer amount is ${MAX_TRANSFER_AMOUNT}`),
  toUserId: objectId,
});

export type TransferReqBodyType = z.infer<typeof transferReqBody>;
export type TransferRequestType = ValidatedRequest<{ body: typeof transferReqBody }>;

export const topupReqBody = z.object({
  amount: z
    .number()
    .int()
    .min(MIN_TOPUP_AMOUNT, `Minimum top-up amount is ${MIN_TOPUP_AMOUNT}`)
    .max(MAX_TOPUP_AMOUNT, `Maximum top-up amount is ${MAX_TOPUP_AMOUNT}`),
});

export type TopupReqBodyType = z.infer<typeof topupReqBody>;
export type TopupRequestType = ValidatedRequest<{ body: typeof topupReqBody }>;
