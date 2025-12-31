import { Schema, model } from "mongoose";
import { omit } from "lodash";
import { z } from "zod";
import { mongooseMetricsPlugin } from "~/middleware/mongoose-metrics";

export const userRole = z.enum(["user", "admin"]);

export const userSchemaZod = z.object({
  firstName: z.string(),
  middleName: z.string().optional(),
  lastName: z.string(),
  role: userRole,
  isActive: z.boolean(),
  emailVerifiedAt: z.date().nullable(),
  email: z.email(),
  password: z.string(),
});

export type UserSchemaType = z.infer<typeof userSchemaZod>;

export const userSchema = new Schema<UserSchemaType>(
  {
    firstName: {
      type: String,
      required: [true, "first name is a required field"],
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "last name is a required field"],
      trim: true,
    },
    role: {
      type: String,
      default: "user",
    },
    email: {
      type: String,
      required: [true, "email is a required field"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    password: {
      type: String,
      required: [true, "password is a required field"],
      minLength: [6, "password should be atleast 6 characters"],
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_, ret) {
        return omit(ret, ["password", "isActive", "_id"]);
      },
    },
  },
);

userSchema.plugin(mongooseMetricsPlugin);

export const UserModel = model("users", userSchema);
