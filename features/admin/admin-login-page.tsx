import { redirect } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { signOutAdmin } from "./admin-actions";
import { AdminLoginForm } from "./admin-login-form";
import type { AdminAuthState } from "./lib/auth";

type AdminLoginPageProps = {
  authState: AdminAuthState;
};

export function AdminLoginPage({ authState }: AdminLoginPageProps) {
  if (authState.kind === "authorized") {
    redirect("/admin");
  }

  return (
    <PageShell className="py-10 sm:py-14">
      <div className="mx-auto max-w-xl space-y-8">
        <SectionHeading
          eyebrow="Admin"
          title="Internal moderation login"
          description="Sign in with a Supabase Auth user that is included in the admin allowlist. This login flow is internal-facing and only used for `/admin`."
        />

        {authState.kind === "unauthorized" ? (
          <Card className="border border-border/70 bg-card/95">
            <CardHeader>
              <CardTitle>Signed in but not allowed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>
                You are signed in as {authState.email}, but that email is not in the admin
                allowlist.
              </p>
              <form action={signOutAdmin}>
                <Button type="submit" variant="outline">
                  Sign out
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border/70 bg-card/95">
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>
                Admin access is controlled by a comma-separated allowlist in
                `ADMIN_ALLOWED_EMAILS`.
              </p>
              <AdminLoginForm />
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
