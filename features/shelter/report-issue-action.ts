"use server";

import { createAppV2AdminClient } from "@/lib/supabase/app-v2";

import {
  initialReportIssueState,
  isValidEmail,
  isValidReportType,
  type ReportIssueState,
} from "./lib/reporting";

function getTrimmedString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function submitShelterReport(
  _previousState: ReportIssueState,
  formData: FormData,
): Promise<ReportIssueState> {
  const shelterId = getTrimmedString(formData, "shelterId");
  const reportType = getTrimmedString(formData, "reportType");
  const message = getTrimmedString(formData, "message");
  const contactEmail = getTrimmedString(formData, "contactEmail");

  const fieldErrors: ReportIssueState["fieldErrors"] = {};

  if (!shelterId) {
    return {
      status: "error",
      fieldErrors: {
        form: "The shelter reference is missing. Reload the page and try again.",
      },
    };
  }

  if (!isValidReportType(reportType)) {
    fieldErrors.reportType = "Choose the issue that best matches the problem.";
  }

  if (message.length < 20) {
    fieldErrors.message = "Please add a short explanation with at least 20 characters.";
  } else if (message.length > 1500) {
    fieldErrors.message = "Please keep the message below 1500 characters.";
  }

  if (contactEmail && !isValidEmail(contactEmail)) {
    fieldErrors.contactEmail = "Enter a valid email address or leave this field empty.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      fieldErrors,
      message: "Please correct the form and try again.",
    };
  }

  try {
    const supabase = createAppV2AdminClient();

    const shelterResponse = await supabase
      .from("shelters")
      .select("id")
      .eq("id", shelterId)
      .maybeSingle();

    if (shelterResponse.error || !shelterResponse.data) {
      return {
        status: "error",
        fieldErrors: {
          form: "This shelter record could not be found anymore.",
        },
      };
    }

    const insertResponse = await supabase.from("shelter_reports").insert({
      shelter_id: shelterId,
      report_type: reportType,
      message,
      contact_email: contactEmail || null,
    });

    if (insertResponse.error) {
      return {
        status: "error",
        fieldErrors: {
          form: "The report could not be submitted right now. Please try again later.",
        },
      };
    }

    return {
      ...initialReportIssueState,
      status: "success",
      message: "Thank you. Your report has been received and can now be reviewed.",
    };
  } catch {
    return {
      status: "error",
      fieldErrors: {
        form: "The reporting service is not configured yet.",
      },
    };
  }
}
