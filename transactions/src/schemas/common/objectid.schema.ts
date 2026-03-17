import { Types } from "mongoose";
import z from "zod";

export const objectId = z.string().transform((id, ctx) => {
  try {
    return new Types.ObjectId(id);
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid ObjectId format",
    });
    return z.NEVER;
  }
});
export const ObjectId = Types.ObjectId;
