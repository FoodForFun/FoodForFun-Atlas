import { signOutAction } from "@/app/admin/actions";
import { SubmitButton } from "@/app/admin/_components/submit-button";

export function SignOutForm() {
  return (
    <form action={signOutAction} className="admin-sign-out-form">
      <SubmitButton label="Sign out" pendingLabel="Signing out…" />
    </form>
  );
}
