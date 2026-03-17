import { z } from "zod";

export const transactionType = z.enum(["TopUp", "Transfer"]);
export const transactionStatus = z.enum(["Pending", "Processing", "Completed", "Failed"]);
