import type { ParsedQs } from "qs";

export const toNumber = (value: (ParsedQs | string)[] | ParsedQs | string | undefined) =>
  typeof value === "string" ? Number(value) : undefined;
