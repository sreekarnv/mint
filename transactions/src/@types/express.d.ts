import "express";
import { UserResType } from "~/schemas/user.schema";

declare module "express" {
  interface Request {
    user?: UserResType;
  }
}
