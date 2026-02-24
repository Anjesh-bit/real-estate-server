import type { NextFunction, RequestHandler, Response } from "express";

import { NotFoundError } from "#services/error.services.js";
import type { AsyncRequestHandler, AuthenticatedRequest } from "#types/error.types.js";
import { createErrorResponse, logError } from "#utils/error.utils.js";

export const errorHandler = (
  error: Error,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!error) {
    return next();
  }

  logError(error, req);

  const { response, statusCode } = createErrorResponse(error, req);

  res.removeHeader("X-Powered-By");

  res.status(statusCode).json(response);
};

export const notFoundHandler: RequestHandler = (
  req: AuthenticatedRequest,
  _: Response,
  next: NextFunction,
): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl}`);
  next(error);
};

export const asyncHandler = (asyncFn: AsyncRequestHandler): RequestHandler => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    Promise.resolve(asyncFn(req, res, next)).catch(next);
  };
};
