import { AdminShelterOverridePage } from "@/features/admin/admin-shelter-override-page";
import { getAdminAuthState } from "@/features/admin/lib/auth";
import { getAdminShelterOverrideContext } from "@/lib/supabase/queries";

type AdminShelterOverrideRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const metadata = {
  title: "Shelter override",
};

export const dynamic = "force-dynamic";

export default async function Page({ params }: AdminShelterOverrideRouteProps) {
  const { slug } = await params;
  const authState = await getAdminAuthState();
  const shelter = authState.kind === "authorized" ? await getAdminShelterOverrideContext(slug) : null;

  return <AdminShelterOverridePage authState={authState} shelter={shelter} />;
}
