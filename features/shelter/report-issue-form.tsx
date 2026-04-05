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
      className="w-full rounded-[2px] bg-primary text-primary-foreground hover:opacity-95 sm:w-auto"
      disabled={pending}
      type="submit"
    >
      {pending ? "Sender rapport…" : "Indsend rapport"}
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
      {!showForm ? (
        <button
          className="text-sm text-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-primary"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          Rapportér en fejl i dette resultat ↓
        </button>
      ) : null}

      {showForm ? (
        <form action={formAction} className="space-y-4">
          <input name="shelterId" type="hidden" value={shelterId} />

          {state.status === "success" ? (
            <div className="border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-medium text-foreground">Rapport modtaget</p>
              <p className="mt-1">{state.message}</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm leading-6 text-muted-foreground">
                  Hvis noget ser forkert ud i det offentlige resultat for {shelterName}, kan du
                  sende en kort rapport til senere gennemgang.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="reportType">
                  Fejltype
                </label>
                <select
                  className="flex h-11 w-full rounded-[2px] border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-foreground"
                  defaultValue=""
                  id="reportType"
                  name="reportType"
                >
                  <option disabled value="">
                    Vælg fejltype
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
                <label className="text-sm font-medium text-foreground" htmlFor="message">
                  Besked
                </label>
                <Textarea
                  className="rounded-[2px] border-border bg-background text-foreground placeholder:text-muted-foreground"
                  id="message"
                  name="message"
                  placeholder="Beskriv hvad der ser forkert eller forældet ud."
                  required
                />
                <FieldError message={state.fieldErrors.message} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="contactEmail">
                  Kontakt-e-mail (valgfri)
                </label>
                <Input
                  className="rounded-[2px] border-border bg-background text-foreground placeholder:text-muted-foreground"
                  id="contactEmail"
                  name="contactEmail"
                  placeholder="navn@eksempel.dk"
                  type="email"
                />
                <p className="text-sm text-muted-foreground">
                  Tilføj kun en e-mail, hvis du er åben for at blive kontaktet om denne rapport.
                </p>
                <FieldError message={state.fieldErrors.contactEmail} />
              </div>

              <FieldError message={state.fieldErrors.form} />
              {state.message ? <p className="text-sm text-muted-foreground">{state.message}</p> : null}

              <div className="flex flex-wrap gap-3">
                <SubmitButton />
                <button
                  className="text-sm text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Annuller
                </button>
              </div>
            </>
          )}
        </form>
      ) : null}
    </div>
  );
}
