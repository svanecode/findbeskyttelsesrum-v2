"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminShelterOverrideContext } from "@/lib/supabase/queries";

import { clearShelterOverride, saveShelterOverride } from "./override-actions";
import { initialOverrideFormState } from "./lib/override-form";

type OverrideFormProps = {
  shelter: AdminShelterOverrideContext;
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? "Saving..." : "Save override"}
    </Button>
  );
}

function ClearButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} type="submit" variant="outline">
      {pending ? "Clearing..." : "Clear override"}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function OverrideForm({ shelter }: OverrideFormProps) {
  const router = useRouter();
  const [saveState, saveAction] = useActionState(saveShelterOverride, initialOverrideFormState);
  const [clearState, clearAction] = useActionState(clearShelterOverride, initialOverrideFormState);

  useEffect(() => {
    if (saveState.status === "success" || clearState.status === "success") {
      router.refresh();
    }
  }, [clearState.status, router, saveState.status]);

  const state = clearState.status !== "idle" ? clearState : saveState;

  return (
    <div className="space-y-6">
      <form action={saveAction} className="space-y-5">
        <input name="shelterId" type="hidden" value={shelter.id} />
        <input name="shelterSlug" type="hidden" value={shelter.slug} />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="name">
              Name
            </label>
            <Input defaultValue={shelter.overrideValues.name ?? ""} id="name" name="name" />
            <FieldError message={state.fieldErrors.name} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="capacity">
              Capacity
            </label>
            <Input
              defaultValue={shelter.overrideValues.capacity?.toString() ?? ""}
              id="capacity"
              inputMode="numeric"
              name="capacity"
            />
            <FieldError message={state.fieldErrors.capacity} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor="addressLine1">
              Address line 1
            </label>
            <Input
              defaultValue={shelter.overrideValues.addressLine1 ?? ""}
              id="addressLine1"
              name="addressLine1"
            />
            <FieldError message={state.fieldErrors.addressLine1} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="postalCode">
              Postal code
            </label>
            <Input
              defaultValue={shelter.overrideValues.postalCode ?? ""}
              id="postalCode"
              inputMode="numeric"
              name="postalCode"
            />
            <FieldError message={state.fieldErrors.postalCode} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="city">
              City
            </label>
            <Input defaultValue={shelter.overrideValues.city ?? ""} id="city" name="city" />
            <FieldError message={state.fieldErrors.city} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor="status">
              Status
            </label>
            <select
              className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              defaultValue={shelter.overrideValues.status ?? ""}
              id="status"
              name="status"
            >
              <option value="">No status override</option>
              <option value="active">Active</option>
              <option value="temporarily_closed">Temporarily closed</option>
              <option value="under_review">Under review</option>
            </select>
            <FieldError message={state.fieldErrors.status} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor="accessibilityNotes">
              Accessibility notes
            </label>
            <Textarea
              defaultValue={shelter.overrideValues.accessibilityNotes ?? ""}
              id="accessibilityNotes"
              name="accessibilityNotes"
              placeholder="Visible accessibility guidance for the public shelter page."
            />
            <FieldError message={state.fieldErrors.accessibilityNotes} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor="summary">
              Summary
            </label>
            <Textarea
              defaultValue={shelter.overrideValues.summary ?? ""}
              id="summary"
              name="summary"
              placeholder="Short public summary for the shelter detail page."
            />
            <FieldError message={state.fieldErrors.summary} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor="reason">
              Reason for change
            </label>
            <Textarea id="reason" name="reason" placeholder="Explain why this override is needed." required />
            <FieldError message={state.fieldErrors.reason} />
          </div>
        </div>

        <FieldError message={state.fieldErrors.form} />
        {state.message ? (
          <p className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
            {state.message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <SaveButton />
        </div>
      </form>

      <form action={clearAction} className="space-y-3">
        <input name="shelterId" type="hidden" value={shelter.id} />
        <input name="shelterSlug" type="hidden" value={shelter.slug} />
        <div className="flex flex-wrap gap-3">
          <ClearButton disabled={!shelter.hasActiveOverride} />
        </div>
      </form>
    </div>
  );
}
