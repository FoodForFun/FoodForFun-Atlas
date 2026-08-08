export type AuthActionState = {
  message: string;
  status: "idle" | "error" | "success";
};

export const initialAuthActionState: AuthActionState = {
  message: "",
  status: "idle",
};
