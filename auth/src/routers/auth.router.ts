import { Router } from "express";
import validate from "express-zod-safe";
import * as authController from "~/controllers/auth.controller";
import { loginReqBodySchema, signupReqBodySchema } from "~/schemas/auth.schema";

const authRouter = Router();

authRouter.route("/signup").post(validate({ body: signupReqBodySchema }), authController.signup);
authRouter.route("/login").post(validate({ body: loginReqBodySchema }), authController.login);
authRouter.route("/logout").post(authController.logout);
authRouter.route("/user").get(authController.user);

export { authRouter };
