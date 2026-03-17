import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { UserModel } from "~/models/user.model";
import * as usersService from "~/services/users.service";
import { BadRequestError } from "~/utils/errors";

export async function getAllUsers(_: Request, res: Response, next: NextFunction) {
  try {
    const users = await UserModel.find({});

    res.status(StatusCodes.OK).json(users);
  } catch (error) {
    next(error);
  }
}

export async function updateCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { firstName, middleName, lastName } = req.body;

    const user = await usersService.updateUserProfile(userId, {
      firstName,
      middleName,
      lastName,
    });

    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    next(error);
  }
}

export async function searchUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const email = req.query.email as string;

    if (!email || email.length < 2) {
      throw new BadRequestError("Email query parameter must be at least 2 characters");
    }

    const users = await usersService.searchUsersByEmail(email);

    res.status(StatusCodes.OK).json(users);
  } catch (error) {
    next(error);
  }
}

export async function getPublicUserProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id!;
    const user = await usersService.getPublicProfile(userId);

    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    next(error);
  }
}
