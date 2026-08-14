import type { RelationshipFieldErrors } from "@/app/_lib/editorial/relationship";

export type RelationshipActionState = {
  fieldErrors: RelationshipFieldErrors;
  message: string;
  status: "error" | "idle";
};

export const initialRelationshipActionState: RelationshipActionState = {
  fieldErrors: {},
  message: "",
  status: "idle",
};
