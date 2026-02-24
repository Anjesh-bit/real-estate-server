import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { UserRole } from "#constants/enums/auth.enum.js";
import { generateTokenpair } from "#lib/helpers/generateTokenPair.helpers.js";
import { asyncHandler } from "#middlewares/error/errorHandler.middleware.js";
import userServices from "#services/user.services.js";
import type { JWTPayload } from "#types/token.types.js";

const sendSuccessResponse = (res: Response, data: any, message: string, statusCode = 200) => {
  return res.status(statusCode).json({
    data,
    message,
    success: true,
    timestamp: new Date().toISOString(),
  });
};

const sendErrorResponse = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: Error | unknown,
) => {
  return res.status(statusCode).json({
    errors,
    message,
    success: false,
    timestamp: new Date().toISOString(),
  });
};

const login = asyncHandler(async (req: Request, res: Response, _: NextFunction) => {
  const { email, password } = req.body;
  const user = await userServices.findByEmail(email);

  if (!user) {
    return sendErrorResponse(res, "Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return sendErrorResponse(res, "Invalid email or password", 401);
  }

  const { email: userEmail = "", fullName = "", id = "", phone = "", role = "" } = user || {};
  const { accessToken, refreshToken } = generateTokenpair({ email: userEmail, id, role });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return sendSuccessResponse(
    res,
    {
      accessToken,
      user: {
        email,
        fullName,
        id: userEmail,
        phone,
        role,
      },
    },
    "Login successful",
  );
});

const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    email = "",
    fullName = "",
    password = "",
    phone = "",
    role = UserRole.DEVELOPER,
  } = req.body || {};

  const existingUser = await userServices.findByEmail(email);
  if (existingUser) {
    return sendErrorResponse(res, "User with this email already exists", 409);
  }

  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const { userId = "" } =
    (await userServices.create({
      approved: false,
      email,
      fullName,
      password: hashedPassword,
      phone,
      role,
    })) || {};

  return sendSuccessResponse(
    res,
    {
      userId,
    },
    "Registration successful",
    201,
  );
});

const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return sendErrorResponse(res, "Refresh token not provided", 401);
  }

  let decoded: JWTPayload;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
  } catch {
    return sendErrorResponse(res, "Invalid refresh token", 401);
  }

  const { email: userEmail, id = "", role } = decoded || {};
  const user = await userServices.findById(id);

  if (!user) {
    return sendErrorResponse(res, "User not found", 404);
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokenpair({
    email: userEmail,
    id,
    role,
  });

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return sendSuccessResponse(res, { accessToken }, "Token refreshed successfully");
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  return sendSuccessResponse(res, null, "Logout successful");
});

const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    return sendErrorResponse(res, "Verification token is required", 400);
  }

  // TODO: Implement email verification logic
  return sendSuccessResponse(res, null, "Email verified successfully");
});

export { login, logout, refreshToken, register, verifyEmail };
