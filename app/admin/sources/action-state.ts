import type {
  SourceMetadataFieldErrors,
  SourcePrivateFieldErrors,
} from "@/app/_lib/editorial/source";

export type SourceMetadataActionState = {
  fieldErrors: SourceMetadataFieldErrors;
  message: string;
  status: "duplicate" | "error" | "idle";
};

export type SourcePrivateActionState = {
  fieldErrors: SourcePrivateFieldErrors;
  message: string;
  status: "error" | "idle";
};

export const initialSourceMetadataActionState: SourceMetadataActionState = {
  fieldErrors: {},
  message: "",
  status: "idle",
};

export const initialSourcePrivateActionState: SourcePrivateActionState = {
  fieldErrors: {},
  message: "",
  status: "idle",
};
