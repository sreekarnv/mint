import { MongoDuplicateKeyError } from "./../../../notifications/src/utils/errors";
import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { AppError } from "~/utils/errors";
import { logger } from "~/utils/logger";
import { env } from "~/env";

interface ErrorResponse {
  error: {
    message: string;
    status: number;
    details?: unknown;
    stack?: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, _: NextFunction): void {
  logger.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        message: err.message,
        status: err.statusCode,
      },
    };

    if (env.NODE_ENV === "development") {
      response.error.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      error: {
        message: "Validation failed",
        status: StatusCodes.UNPROCESSABLE_ENTITY,
        details: err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      },
    };

    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(response);
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const response: ErrorResponse = {
      error: {
        message: "Database validation failed",
        status: StatusCodes.UNPROCESSABLE_ENTITY,
        details: Object.values(err.errors).map((e) => ({
          field: e.path,
          message: e.message,
        })),
      },
    };

    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(response);
    return;
  }

  if ((err as MongoDuplicateKeyError).code === 11000) {
    const mongoErr = err as MongoDuplicateKeyError;

    const field = mongoErr.keyPattern ? Object.keys(mongoErr.keyPattern)[0] : "Field";
    const response: ErrorResponse = {
      error: {
        message: `${field} already exists`,
        status: StatusCodes.CONFLICT,
      },
    };

    res.status(StatusCodes.CONFLICT).json(response);
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    const response: ErrorResponse = {
      error: {
        message: `Invalid ${err.path}: ${err.value}`,
        status: StatusCodes.BAD_REQUEST,
      },
    };

    res.status(StatusCodes.BAD_REQUEST).json(response);
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    const response: ErrorResponse = {
      error: {
        message: "Invalid JSON in request body",
        status: StatusCodes.BAD_REQUEST,
      },
    };

    res.status(StatusCodes.BAD_REQUEST).json(response);
    return;
  }

  const response: ErrorResponse = {
    error: {
      message: env.NODE_ENV === "development" ? err.message : "Internal server error",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    },
  };

  if (env.NODE_ENV === "development") {
    response.error.stack = err.stack;
  }

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(StatusCodes.NOT_FOUND).json({
    error: {
      message: `Route ${req.method} ${req.url} not found`,
      status: StatusCodes.NOT_FOUND,
    },
  });
}

export function asyncHandler<T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
