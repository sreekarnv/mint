import { Router } from "express";
import * as jwksController from "~/controllers/jwks.controller";

const jwksRouter = Router();

jwksRouter.route("/jwks.json").get(jwksController.getJWKS);

export { jwksRouter };
