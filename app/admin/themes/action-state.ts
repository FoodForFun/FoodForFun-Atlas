import type { ThemeFieldErrors } from "@/app/_lib/editorial/theme";

export type ThemeActionState = {
  fieldErrors: ThemeFieldErrors;
  message: string;
  status: "duplicate" | "error" | "idle";
};

export const initialThemeActionState: ThemeActionState = {
  fieldErrors: {},
  message: "",
  status: "idle",
};
