import type { PlaceFieldErrors } from "@/app/_lib/editorial/place";
export type PlaceActionState = { fieldErrors: PlaceFieldErrors; message: string; status: "duplicate" | "error" | "idle" };
export const initialPlaceActionState: PlaceActionState = { fieldErrors: {}, message: "", status: "idle" };
