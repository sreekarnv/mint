import z from "zod";

export const userRole = z.enum(["user", "admin"]);
export type UserRole = z.infer<typeof userRole>;
