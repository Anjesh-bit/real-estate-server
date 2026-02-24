import type { UpdateUserDTO } from "#types/user.types.js";

export const users: (keyof UpdateUserDTO)[] = [
  "email",
  "fullName",
  "phone",
  "password",
  "role",
  "approved",
];
