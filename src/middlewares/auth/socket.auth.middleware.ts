import type { JwtPayload } from "jsonwebtoken";
import type { Socket } from "socket.io";

import type { CollectionValue } from "#constants/collection.constant.js";
import { TokenTypeEnum } from "#constants/enums/auth.enum.js";
import { verifyToken } from "#lib/helpers/verifyToken.helpers.js";
import logger from "#lib/helpers/winston.helpers.js";

export interface AuthenticatedSocket extends Socket {
  userId: string;
  userName: string;
  userRole: CollectionValue;
}

export function socketAuthMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
): void {
  try {
    const token =
      (socket.handshake.auth.token as string | undefined) ||
      socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      logger.error(`Socket auth failed — no token | id: ${socket.id}`);
      return next(new Error("NO_TOKEN"));
    }

    const payload = verifyToken(token, TokenTypeEnum.ACCESS) as JwtPayload;

    socket.userId = payload.userId;
    socket.userName = payload.name;
    socket.userRole = payload.role;

    logger.info(`Socket auth passed — userId: ${payload.userId} | role: ${payload.role}`);
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
}
