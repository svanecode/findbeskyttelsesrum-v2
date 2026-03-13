import { HomePage } from "@/features/home/home-page";
import { getFeaturedShelters } from "@/lib/supabase/queries";

export const revalidate = 300;

export default async function Page() {
  const featuredShelters = await getFeaturedShelters();

  return <HomePage featuredShelters={featuredShelters} />;
}
