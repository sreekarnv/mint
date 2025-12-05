import { Types } from "mongoose";
import z from "zod";

export const objectId = z.string().transform((id) => new Types.ObjectId(id));
export const ObjectId = Types.ObjectId;
