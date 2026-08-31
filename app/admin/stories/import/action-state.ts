export type AtlasImportActionState = {
  message: string;
  status: "error" | "idle";
  storyId?: string;
};

export const initialAtlasImportActionState: AtlasImportActionState = {
  message: "",
  status: "idle",
};
