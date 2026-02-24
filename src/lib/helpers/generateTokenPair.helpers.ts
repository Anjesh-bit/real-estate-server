import { TokenTypeEnum } from "#constants/enums/auth.enum.js";
import type { JWTPayload } from "#types/token.types.js";

import { generateToken } from "./generateToken.helpers.js";

export const generateTokenpair = (payload: JWTPayload) => {
  const tokens = {
    accessToken: generateToken({ ...payload }, TokenTypeEnum.ACCESS),
    refreshToken: generateToken({ ...payload }, TokenTypeEnum.REFRESH),
  };
  return tokens;
};
