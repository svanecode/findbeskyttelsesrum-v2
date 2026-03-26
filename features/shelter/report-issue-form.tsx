"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  initialReportIssueState,
  reportTypeOptions,
  type ReportIssueState,
} from "./lib/reporting";
import { submitShelterReport } from "./report-issue-action";

type ReportIssueFormProps = {
  shelterId: string;
  shelterName: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="w-full rounded-2xl bg-[#ff7a1a] text-[#1a1009] hover:bg-[#ff8f39] sm:w-auto"
      disabled={pending}
      type="submit"
    >
      {pending ? "Submitting report..." : "Submit report"}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-[#ff8f6b]">{message}</p>;
}

export function ReportIssueForm({ shelterId, shelterName }: ReportIssueFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState<ReportIssueState, FormData>(
    submitShelterReport,
    initialReportIssueState,
  );

  const showForm = isOpen || state.status !== "idle";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#fff7ef]">Report an issue</p>
        <p className="text-sm leading-6 text-[#b8a793]">
          If something looks wrong in the public record for {shelterName}, you can send a short
          report for later review.
        </p>
      </div>

      {!showForm ? (
        <Button
          className="rounded-2xl border-white/10 bg-[#151922] text-[#f7efe6] hover:bg-[#1b202b]"
          onClick={() => setIsOpen(true)}
          type="button"
          variant="outline"
        >
          Report an issue
        </Button>
      ) : null}

      {showForm ? (
        <form action={formAction} className="space-y-4">
          <input name="shelterId" type="hidden" value={shelterId} />

          {state.status === "success" ? (
            <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-4 text-sm leading-6 text-[#b8a793]">
              <p className="font-medium text-[#fff7ef]">Report received</p>
              <p className="mt-1">{state.message}</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#fff7ef]" htmlFor="reportType">
                  Issue type
                </label>
                <select
                  className="flex h-11 w-full rounded-2xl border border-white/10 bg-[#0d1015] px-3 text-sm text-[#fff7ef] outline-none focus-visible:border-[#ff7a1a] focus-visible:ring-3 focus-visible:ring-[#ff7a1a]/20"
                  defaultValue=""
                  id="reportType"
                  name="reportType"
                >
                  <option disabled value="">
                    Select an issue type
                  </option>
                  {reportTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError message={state.fieldErrors.reportType} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#fff7ef]" htmlFor="message">
                  Message
                </label>
                <Textarea
                  className="border-white/10 bg-[#0d1015] text-[#fff7ef] placeholder:text-[#9f8d7b]"
                  id="message"
                  name="message"
                  placeholder="Describe what looks wrong or outdated."
                  required
                />
                <FieldError message={state.fieldErrors.message} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#fff7ef]" htmlFor="contactEmail">
                  Contact email (optional)
                </label>
                <Input
                  className="border-white/10 bg-[#0d1015] text-[#fff7ef] placeholder:text-[#9f8d7b]"
                  id="contactEmail"
                  name="contactEmail"
                  placeholder="name@example.com"
                  type="email"
                />
                <p className="text-sm text-[#9f8d7b]">
                  Add an email only if you are open to being contacted about this report.
                </p>
                <FieldError message={state.fieldErrors.contactEmail} />
              </div>

              <FieldError message={state.fieldErrors.form} />
              {state.message ? <p className="text-sm text-[#9f8d7b]">{state.message}</p> : null}

              <div className="flex flex-wrap gap-3">
                <SubmitButton />
                <Button
                  className="rounded-2xl text-[#d4c2ae] hover:bg-white/6 hover:text-[#fff5eb]"
                  onClick={() => setIsOpen(false)}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </form>
      ) : null}
    </div>
  );
}
