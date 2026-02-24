import type { NextFunction, Request, Response } from "express";

export type AsyncRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => Promise<Response | void>;

export interface AuthenticatedRequest extends Request {
  id?: string;
  user?: User;
}

export interface ClassifiedError {
  message: string | string[];
  statusCode: number;
  type: ErrorType;
}

export interface ErrorContext {
  error: {
    message: string;
    name: string;
    stack?: string;
    statusCode?: number;
  };
  request: {
    body: any;
    ip?: string;
    method: string;
    params: any;
    query: any;
    url: string;
    userAgent?: string;
    userId: string;
  };
  timestamp: string;
}

export interface ErrorResponse {
  error: {
    details?: any;
    field?: string;
    message: string | string[];
    method: string;
    path: string;
    requestId?: string;
    stack?: string;
    timestamp: string;
    type: ErrorType;
  };
  success: false;
}

export type ErrorType =
  | "application"
  | "authentication"
  | "cast"
  | "duplicate"
  | "http"
  | "syntax"
  | "unknown"
  | "validation";

export interface FormattedErrorResponse {
  response: ErrorResponse;
  statusCode: number;
}

export interface User {
  [key: string]: any;
  id: string;
}
