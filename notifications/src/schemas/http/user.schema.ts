import z from "zod";
import { userRole } from "~/schemas/domain/user-role.schema";

export const userResSchema = z.object({
  id: z.coerce.string(),
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().optional(),
  email: z.email(),
  emailVerifiedAt: z.date().nullable(),
  role: userRole,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type UserResType = z.infer<typeof userResSchema>;
