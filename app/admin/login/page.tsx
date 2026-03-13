import { AdminLoginPage } from "@/features/admin/admin-login-page";
import { getAdminAuthState } from "@/features/admin/lib/auth";

export const metadata = {
  title: "Admin login",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const authState = await getAdminAuthState();

  return <AdminLoginPage authState={authState} />;
}
