import { Router } from "express";
import * as usersController from "~/controllers/users.controller";
import { authMiddleware } from "~/middleware/auth.middleware";

const usersRouter = Router();

usersRouter.use(authMiddleware);

usersRouter.route("/search").get(usersController.searchUsers);
usersRouter.route("/:id").get(usersController.getPublicUserProfile);

usersRouter.route("/me").put(usersController.updateCurrentUser);

usersRouter.route("/").get(usersController.getAllUsers);

export { usersRouter };
