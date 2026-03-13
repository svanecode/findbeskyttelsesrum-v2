"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

import { updateShelterReportStatus } from "./admin-actions";
import { initialModerationActionState, reportStatusOptions } from "./lib/moderation";

type ReportModerationActionsProps = {
  reportId: string;
  currentStatus: string;
};

function ActionButton({
  nextStatus,
  label,
  currentStatus,
}: {
  nextStatus: string;
  label: string;
  currentStatus: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={pending || currentStatus === nextStatus}
      name="nextStatus"
      size="sm"
      type="submit"
      value={nextStatus}
      variant={currentStatus === nextStatus ? "secondary" : "outline"}
    >
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function ReportModerationActions({
  reportId,
  currentStatus,
}: ReportModerationActionsProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    updateShelterReportStatus,
    initialModerationActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="space-y-3">
      <input name="reportId" type="hidden" value={reportId} />
      <div className="flex flex-wrap gap-2">
        {reportStatusOptions.map((option) => (
          <ActionButton
            key={option.value}
            currentStatus={currentStatus}
            label={option.label}
            nextStatus={option.value}
          />
        ))}
      </div>
      {state.message ? (
        <p className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
