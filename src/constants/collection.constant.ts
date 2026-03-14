export const DB_COLLECTIONS = {
  DEVELOPERS: "developers",
  LEADS: "leads",
  LISTINGS: "listings",
  USERS: "users",
};

export type CollectionValue = (typeof DB_COLLECTIONS)[keyof typeof DB_COLLECTIONS];
