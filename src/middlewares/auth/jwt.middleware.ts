import type { NextFunction, Response } from "express";
import type { Algorithm, JwtPayload } from "jsonwebtoken";
import { verify } from "jsonwebtoken";

import { TOKEN } from "#config/token.config.js";
import { TokenTypeEnum, UserRole } from "#constants/enums/auth.enum.js";
import type { AuthRequest, TokenType } from "#types/token.types.js";

export const authenticateJWT =
  (type: TokenType = TokenTypeEnum.ACCESS, allowedRoles?: UserRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
          message: "Unauthorized: No token provided",
          success: false,
        });
      }

      const token = authHeader.split(" ")[1];
      const secret =
        type === TokenTypeEnum.ACCESS ? TOKEN.ACCESS_TOKEN_SECRET : TOKEN.REFRESH_TOKEN_SECRET;

      const payload = verify(token, secret, {
        algorithms: [TOKEN.ALGORITHM as Algorithm],
        audience: TOKEN.AUDIENCE,
        clockTolerance: Number(TOKEN.CLOCK_TOLERANCE),
        issuer: TOKEN.ISSUER,
      }) as JwtPayload;

      req.user = payload;

      const hasAllowedRolesAndLength = allowedRoles && allowedRoles.length > 0;
      if (hasAllowedRolesAndLength) {
        const userRole = payload.role as UserRole;
        const hasValidRoles = !allowedRoles.includes(userRole);

        if (!userRole) {
          return res.status(403).json({
            message: "Forbidden: No role assigned to user",
            success: false,
          });
        }

        if (hasValidRoles) {
          return res.status(403).json({
            message: `Forbidden: ${userRole} role does not have access to this resource`,
            success: false,
          });
        }
      }

      next();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Unauthorized: Token expired",
          success: false,
        });
      }
      return res.status(403).json({
        message: "Forbidden: Invalid token",
        success: false,
      });
    }
  };

export const requireRole = {
  admin: authenticateJWT(TokenTypeEnum.ACCESS, [UserRole.ADMIN]),
  adminOrDeveloper: authenticateJWT(TokenTypeEnum.ACCESS, [UserRole.ADMIN, UserRole.DEVELOPER]),
  auth: authenticateJWT(TokenTypeEnum.ACCESS),
  developer: authenticateJWT(TokenTypeEnum.ACCESS, [UserRole.DEVELOPER]),
};
