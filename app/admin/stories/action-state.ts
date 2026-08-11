import type { StoryFieldErrors } from "@/app/_lib/editorial/story";

export type StoryActionState = {
  fieldErrors: StoryFieldErrors;
  message: string;
  status: "error" | "idle";
};

export const initialStoryActionState: StoryActionState = {
  fieldErrors: {},
  message: "",
  status: "idle",
};
