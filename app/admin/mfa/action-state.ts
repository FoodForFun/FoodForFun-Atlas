export type MfaActionState = {
  message: string;
  status: "error" | "idle";
};

export type MfaEnrollmentActionState =
  | MfaActionState
  | {
      message: string;
      setup: {
        factorId: string;
        qrCode: string;
        secret: string;
      };
      status: "setup";
    };

export const initialMfaActionState: MfaActionState = {
  message: "",
  status: "idle",
};

export const initialMfaEnrollmentActionState: MfaEnrollmentActionState =
  initialMfaActionState;
