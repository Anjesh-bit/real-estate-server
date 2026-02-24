import type { ParsedQs } from "qs";

export const toString = (value: (ParsedQs | string)[] | ParsedQs | string | undefined) =>
  typeof value === "string" ? value : undefined;
