import type { Request } from "express";
import type { JwtPayload } from "jsonwebtoken";

import type { TokenTypeEnum } from "#constants/enums/auth.enum.js";

export interface AuthRequest extends Request {
  user?: JwtPayload | string;
}

export type JWTPayload = {
  email: string;
  id: string;
  role: string;
};

export type TokenType = TokenTypeEnum.ACCESS | TokenTypeEnum.REFRESH;
