export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  CONFLICT: 409,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
  NOT_FOUND: 404,
  OK: 200,
  SERVICE_UNAVAILABLE: 503,
  TOO_MANY_REQUESTS: 429,
  UNAUTHORIZED: 401,
  UNPROCESSABLE_ENTITY: 422,
} as const;

export const ERROR_TYPES = {
  CAST_ERROR: "CastError",
  JWT_ERROR: "JsonWebTokenError",
  JWT_EXPIRED: "TokenExpiredError",
  MONGO_DUPLICATE: 11000,
  SYNTAX_ERROR: "SyntaxError",
  VALIDATION_ERROR: "ValidationError",
} as const;

export const SENSITIVE_FIELDS = ["password", "token", "secret", "key", "auth"];

export const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again later.";
