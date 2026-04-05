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
        form: "Referencen til beskyttelsesrummet mangler. Genindlæs siden og prøv igen.",
      },
    };
  }

  if (!isValidReportType(reportType)) {
    fieldErrors.reportType = "Vælg den fejltype, der passer bedst til problemet.";
  }

  if (message.length < 20) {
    fieldErrors.message = "Tilføj en kort forklaring på mindst 20 tegn.";
  } else if (message.length > 1500) {
    fieldErrors.message = "Hold beskeden under 1500 tegn.";
  }

  if (contactEmail && !isValidEmail(contactEmail)) {
    fieldErrors.contactEmail = "Indtast en gyldig e-mailadresse eller lad feltet være tomt.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      fieldErrors,
      message: "Ret formularen og prøv igen.",
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
          form: "Dette beskyttelsesrum kunne ikke længere findes.",
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
          form: "Rapporten kunne ikke indsendes lige nu. Prøv igen senere.",
        },
      };
    }

    return {
      ...initialReportIssueState,
      status: "success",
      message: "Tak. Din rapport er modtaget.",
    };
  } catch {
    return {
      status: "error",
      fieldErrors: {
        form: "Rapporteringstjenesten er ikke konfigureret endnu.",
      },
    };
  }
}
