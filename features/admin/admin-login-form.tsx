"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { signInAdmin } from "./admin-actions";
import { initialModerationActionState } from "./lib/moderation";

export function AdminLoginForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(signInAdmin, initialModerationActionState);

  useEffect(() => {
    if (state.status === "success") {
      router.replace("/admin");
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          Admin email
        </label>
        <Input autoComplete="email" id="email" name="email" type="email" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="password">
          Password
        </label>
        <Input autoComplete="current-password" id="password" name="password" type="password" />
      </div>
      {state.message ? (
        <p className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit">Sign in</Button>
    </form>
  );
}
