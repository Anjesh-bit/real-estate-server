import {
  DEFAULT_ERROR_MESSAGE,
  ERROR_TYPES,
  HTTP_STATUS,
  SENSITIVE_FIELDS,
} from "#constants/errors.constant.js";
import logger from "#lib/helpers/winston.helpers.js";
import { AppError, ValidationError } from "#services/error.services.js";
import type {
  AuthenticatedRequest,
  ClassifiedError,
  ErrorContext,
  ErrorResponse,
  FormattedErrorResponse,
} from "#types/error.types.js";

const sanitizeBody = (body: any) => {
  if (!body || typeof body !== "object") {
    return body;
  }

  const sanitized = { ...body };

  Object.keys(sanitized).forEach((key) => {
    if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = "***REDACTED***";
    }
  });

  return sanitized;
};

const formatValidationError = (error: any | Error): string | string[] => {
  if (error.errors && typeof error.errors === "object") {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    return messages.length === 1 ? messages[0] : messages;
  }
  return error.message || "Validation failed";
};

const classifyError = (error: any): ClassifiedError => {
  const errorMap: Record<string, () => ClassifiedError> = {
    [ERROR_TYPES.CAST_ERROR]: () => ({
      message: `Invalid ${error.path}: ${error.value}`,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      type: "cast",
    }),

    [ERROR_TYPES.JWT_ERROR]: () => ({
      message: "Invalid authentication token",
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      type: "authentication",
    }),

    [ERROR_TYPES.JWT_EXPIRED]: () => ({
      message: "Authentication token expired",
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      type: "authentication",
    }),

    [ERROR_TYPES.SYNTAX_ERROR]: () => ({
      message: "Invalid request format",
      statusCode: HTTP_STATUS.BAD_REQUEST,
      type: "syntax",
    }),

    [ERROR_TYPES.VALIDATION_ERROR]: () => ({
      message: formatValidationError(error),
      statusCode: HTTP_STATUS.BAD_REQUEST,
      type: "validation",
    }),
  };

  if (error.code === ERROR_TYPES.MONGO_DUPLICATE) {
    const field = Object.keys(error.keyValue || {})[0] || "field";
    return {
      message: `${field} already exists`,
      statusCode: HTTP_STATUS.CONFLICT,
      type: "duplicate",
    };
  }

  if (error.name && errorMap[error.name]) {
    return errorMap[error.name]();
  }

  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      type: "application",
    };
  }

  if (error.statusCode || error.status) {
    return {
      message: error.message || DEFAULT_ERROR_MESSAGE,
      statusCode: error.statusCode || error.status,
      type: "http",
    };
  }

  return {
    message: DEFAULT_ERROR_MESSAGE,
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    type: "unknown",
  };
};

const createErrorContext = (error: Error, req: AuthenticatedRequest): ErrorContext => ({
  error: {
    message: error.message,
    name: error.name,
    stack: error.stack,
    statusCode: (error as any).statusCode || (error as any).status,
  },
  request: {
    body: sanitizeBody(req.body),
    ip: req.ip || req.socket?.remoteAddress,
    method: req.method,
    params: req.params,
    query: req.query,
    url: req.originalUrl,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id || "anonymous",
  },
  timestamp: new Date().toISOString(),
});

const logError = (error: Error, req: AuthenticatedRequest): void => {
  const context = createErrorContext(error, req);

  if (process.env.NODE_ENV === "production") {
    logger.error(JSON.stringify(context));
  } else {
    logger.error("\n🚨 Error Details:", JSON.stringify(context, null, 2));
  }
};

const createErrorResponse = (error: Error, req: AuthenticatedRequest): FormattedErrorResponse => {
  const classified = classifyError(error);
  const isProduction = process.env.NODE_ENV === "production";

  const response: ErrorResponse = {
    error: {
      message: classified.message,
      method: req.method,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
      type: classified.type,
    },
    success: false,
  };

  if (req.id) {
    response.error.requestId = req.id;
  }

  if (!isProduction && error.stack) {
    response.error.stack = error.stack;
    response.error.details = error;
  }

  if (error instanceof ValidationError && error.field) {
    response.error.field = error.field;
  }

  return {
    response,
    statusCode: classified.statusCode,
  };
};

const setupGlobalErrorHandlers = (): void => {
  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught Exception:", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });
};

export {
  classifyError,
  createErrorResponse,
  formatValidationError,
  logError,
  setupGlobalErrorHandlers,
};
