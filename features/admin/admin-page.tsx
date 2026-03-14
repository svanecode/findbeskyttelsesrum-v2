import Link from "next/link";

import { redirect } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminShelterReport } from "@/lib/supabase/queries";

import { signOutAdmin } from "./admin-actions";
import { isAdminAuthConfigured, type AdminAuthState } from "./lib/auth";
import { formatReportStatus, formatReportType } from "./lib/moderation";
import { ReportModerationActions } from "./report-moderation-actions";

type AdminPageProps = {
  authState: AdminAuthState;
  reports: AdminShelterReport[];
};

function UnauthorizedState({ email }: { email: string }) {
  return (
    <Card className="border border-border/70 bg-card/95">
      <CardHeader>
        <CardTitle>Unauthorized</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          You are signed in with {email}, but that account is not included in the admin allowlist.
        </p>
        <form action={signOutAdmin}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ConfigurationNotice() {
  return (
    <Card className="border border-border/70 bg-card/95">
      <CardHeader>
        <CardTitle>Admin auth is not configured</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>
          Set `ADMIN_ALLOWED_EMAILS` to a comma-separated list of approved admin email addresses.
          Those users must also exist in Supabase Auth.
        </p>
      </CardContent>
    </Card>
  );
}

function ModerationToolbar({ email }: { email: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button render={<Link href="/find" />} variant="outline">
        Back to search
      </Button>
      <span className="text-sm text-muted-foreground">Signed in as {email}</span>
      <form action={signOutAdmin}>
        <Button type="submit" variant="ghost">
          Sign out
        </Button>
      </form>
    </div>
  );
}

function EmptyReportsState() {
  return (
    <Card className="border border-dashed border-border/80 bg-card/90">
      <CardHeader>
        <CardTitle>No incoming reports yet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>
          Public shelter reports will appear here once users start reporting issues from shelter
          detail pages.
        </p>
      </CardContent>
    </Card>
  );
}

function ReportCard({ report }: { report: AdminShelterReport }) {
  return (
    <Card className="border border-border/70 bg-card/95">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{formatReportType(report.reportType)}</Badge>
          <Badge variant="outline">{formatReportStatus(report.status)}</Badge>
        </div>
        <div className="space-y-1">
          <CardTitle>{report.shelterName || "Unknown shelter record"}</CardTitle>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Created: {report.createdAtLabel}</p>
            <p>Shelter slug: {report.shelterSlug ?? "Missing shelter slug"}</p>
            <p>Municipality: {report.municipalityName ?? "Unknown municipality"}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 text-sm text-muted-foreground">
        <div className="space-y-2">
          <p className="font-medium text-foreground">Report message</p>
          <p className="leading-6">{report.message}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="font-medium text-foreground">Contact email</p>
            <p>{report.contactEmail ?? "No contact email provided"}</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Related shelter</p>
            {report.shelterSlug ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  className="text-foreground underline underline-offset-4"
                  href={`/beskyttelsesrum/${report.shelterSlug}`}
                  target="_blank"
                >
                  Open shelter detail
                </Link>
                <Link
                  className="text-foreground underline underline-offset-4"
                  href={`/admin/shelters/${report.shelterSlug}/override`}
                >
                  Open override flow
                </Link>
              </div>
            ) : (
              <p>Linked shelter record is incomplete.</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-medium text-foreground">Moderation actions</p>
          <ReportModerationActions currentStatus={report.status} reportId={report.id} />
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminPage({ authState, reports }: AdminPageProps) {
  if (!isAdminAuthConfigured()) {
    return (
      <PageShell className="py-10 sm:py-14">
        <div className="space-y-8">
          <SectionHeading
            eyebrow="Operations"
            title="Incoming shelter reports"
            description="Review public issue reports, understand which shelter records need follow-up, and move each report into a clear moderation state."
          />
          <ConfigurationNotice />
        </div>
      </PageShell>
    );
  }

  if (authState.kind === "unauthenticated") {
    redirect("/admin/login");
  }

  return (
    <PageShell className="py-10 sm:py-14">
      <div className="space-y-8">
        <SectionHeading
          eyebrow="Operations"
          title="Incoming shelter reports"
          description="Review public issue reports, understand which shelter records need follow-up, and move each report into a clear moderation state."
        />

        {authState.kind === "unauthorized" ? (
          <UnauthorizedState email={authState.email} />
        ) : (
          <>
            <ModerationToolbar email={authState.email} />
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>{reports.length} reports</span>
              <span>Newest reports first</span>
            </div>
            {reports.length > 0 ? (
              <div className="grid gap-4">
                {reports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            ) : (
              <EmptyReportsState />
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
