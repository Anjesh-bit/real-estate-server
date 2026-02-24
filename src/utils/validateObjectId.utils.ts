import { ObjectId } from "mongodb";

export const validateObjectId = (id: string) => {
  const hasValidId = ObjectId.isValid(id);
  if (!id || !hasValidId) {
    throw new Error("Invalid id");
  }
};
