import { AdminPage } from "@/features/admin/admin-page";
import { getAdminAuthState } from "@/features/admin/lib/auth";
import { getAdminShelterReports } from "@/lib/supabase/queries";

export const metadata = {
  title: "Admin moderation",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const authState = await getAdminAuthState();
  const reports = authState.kind === "authorized" ? await getAdminShelterReports() : [];

  return <AdminPage authState={authState} reports={reports} />;
}
