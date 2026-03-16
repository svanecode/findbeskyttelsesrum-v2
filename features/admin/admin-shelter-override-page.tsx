import Link from "next/link";
import { redirect } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminShelterOverrideContext } from "@/lib/supabase/queries";

import { signOutAdmin } from "./admin-actions";
import type { AdminAuthState } from "./lib/auth";
import { isAdminAuthConfigured } from "./lib/auth";
import { OverrideForm } from "./override-form";

type AdminShelterOverridePageProps = {
  authState: AdminAuthState;
  shelter: AdminShelterOverrideContext | null;
};

function ValueRow({
  label,
  importedValue,
  effectiveValue,
}: {
  label: string;
  importedValue: string;
  effectiveValue: string;
}) {
  return (
    <div className="grid gap-2 border-t border-border/70 py-3 first:border-t-0 first:pt-0 sm:grid-cols-[160px_1fr_1fr]">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div>
        <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Imported</p>
        <p className="text-sm leading-6 text-muted-foreground">{importedValue}</p>
      </div>
      <div>
        <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Effective</p>
        <p className="text-sm leading-6 text-foreground">{effectiveValue}</p>
      </div>
    </div>
  );
}

function UnauthorizedState({ email }: { email: string }) {
  return (
    <Card className="border border-border/70 bg-card/95">
      <CardHeader>
        <CardTitle>Unauthorized</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>You are signed in with {email}, but that account is not included in the admin allowlist.</p>
        <form action={signOutAdmin}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function AdminShelterOverridePage({
  authState,
  shelter,
}: AdminShelterOverridePageProps) {
  if (!isAdminAuthConfigured()) {
    return (
      <PageShell className="py-10 sm:py-14">
        <SectionHeading
          eyebrow="Overrides"
          title="Admin auth is not configured"
          description="Set `ADMIN_ALLOWED_EMAILS` and sign in through Supabase Auth before using manual overrides."
        />
      </PageShell>
    );
  }

  if (authState.kind === "unauthenticated") {
    redirect("/admin/login");
  }

  if (authState.kind === "unauthorized") {
    return (
      <PageShell className="py-10 sm:py-14">
        <UnauthorizedState email={authState.email} />
      </PageShell>
    );
  }

  if (!shelter) {
    return (
      <PageShell className="py-10 sm:py-14">
        <SectionHeading
          eyebrow="Overrides"
          title="Shelter not found"
          description="The requested shelter could not be loaded for override editing."
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="py-10 sm:py-14">
      <div className="space-y-8">
        <div className="flex flex-wrap gap-3">
          <Link className={buttonVariants({ variant: "outline" })} href="/admin">
            Back to moderation
          </Link>
          <Link className={buttonVariants({ variant: "ghost" })} href={`/beskyttelsesrum/${shelter.slug}`}>
            Open public shelter page
          </Link>
        </div>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Manual override</Badge>
            {shelter.hasActiveOverride ? <Badge variant="outline">Active override</Badge> : null}
          </div>
          <SectionHeading
            eyebrow="Shelter"
            title={shelter.name}
            description={`${shelter.addressLine1}, ${shelter.postalCode} ${shelter.city}`}
          />
          <p className="text-sm leading-6 text-muted-foreground">
            Use manual overrides to correct public shelter values without mutating imported source
            records. Effective values take precedence on the public shelter page while the imported
            values remain visible here for traceability.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="border border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Imported and effective values</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <ValueRow label="Name" effectiveValue={shelter.effectiveValues.name} importedValue={shelter.importedValues.name} />
                <ValueRow
                  label="Address line 1"
                  effectiveValue={shelter.effectiveValues.addressLine1}
                  importedValue={shelter.importedValues.addressLine1}
                />
                <ValueRow
                  label="Postal code"
                  effectiveValue={shelter.effectiveValues.postalCode}
                  importedValue={shelter.importedValues.postalCode}
                />
                <ValueRow label="City" effectiveValue={shelter.effectiveValues.city} importedValue={shelter.importedValues.city} />
                <ValueRow
                  label="Capacity"
                  effectiveValue={shelter.effectiveValues.capacity}
                  importedValue={shelter.importedValues.capacity}
                />
                <ValueRow
                  label="Status"
                  effectiveValue={shelter.effectiveValues.status}
                  importedValue={shelter.importedValues.status}
                />
                <ValueRow
                  label="Accessibility notes"
                  effectiveValue={shelter.effectiveValues.accessibilityNotes}
                  importedValue={shelter.importedValues.accessibilityNotes}
                />
                <ValueRow
                  label="Summary"
                  effectiveValue={shelter.effectiveValues.summary}
                  importedValue={shelter.importedValues.summary}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Edit override</CardTitle>
              </CardHeader>
              <CardContent>
                <OverrideForm shelter={shelter} />
              </CardContent>
            </Card>

            <Card className="border border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Shelter context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>Municipality: {shelter.municipalityName}</p>
                <p>Status from imports: {shelter.importedValues.status}</p>
                <p>
                  Active override reason: {shelter.activeOverrideReason ?? "No active override yet"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
