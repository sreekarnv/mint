import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as authService from "~/services/auth.service";
import type {
  SignupRequestType,
  LoginRequestType,
  SignupResponseType,
  LoginResponseType,
  UserResType,
} from "~/schemas/auth.schema";
import { signAccessToken } from "~/utils/jwt";
import { publish } from "~/rabbitmq/publisher";
import { Exchanges, RoutingKeys } from "~/rabbitmq/topology";
import { authAttempts, signupAttempts } from "~/middleware/metrics";

export async function signup(req: SignupRequestType, res: SignupResponseType, next: NextFunction) {
  try {
    const user = await authService.signup(req.body);
    const accessToken = await signAccessToken(user);
    res.cookie("access.token", accessToken, { httpOnly: true });
    publish<UserResType>(Exchanges.AUTH_EVENTS, RoutingKeys.USER_SIGNUP, user);
    signupAttempts.inc({ result: "success" });
    res.status(StatusCodes.CREATED).json(user);
  } catch (error) {
    signupAttempts.inc({ result: "failure" });
    next(error);
  }
}

export async function login(req: LoginRequestType, res: LoginResponseType, next: NextFunction) {
  try {
    const user = await authService.login(req.body);
    const accessToken = await signAccessToken(user);
    res.cookie("access.token", accessToken, { httpOnly: true });
    authAttempts.inc({ type: "login", result: "success" });
    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    authAttempts.inc({ type: "login", result: "failure" });
    next(error);
  }
}

export async function logout(_: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie("access.token");
    res.status(StatusCodes.NO_CONTENT).json({});
  } catch (error) {
    next(error);
  }
}

export async function user(req: Request, res: Response, next: NextFunction) {
  try {
    const accessToken = req.cookies["access.token"];
    const user = await authService.getLoggedInUser(accessToken);
    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    next(error);
  }
}
