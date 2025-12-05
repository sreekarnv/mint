import "express";
import { UserResType } from "~/schemas/http/user.res.schema";

declare module "express" {
  interface Request {
    user?: UserResType;
  }
}
