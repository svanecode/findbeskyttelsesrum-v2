import { SearchPage } from "@/features/search/search-page";

type FindRouteProps = {
  searchParams: Promise<{
    q?: string;
    municipality?: string;
    lat?: string;
    lng?: string;
  }>;
};

export const metadata = {
  title: "Find shelters",
};

export default async function Page({ searchParams }: FindRouteProps) {
  const params = await searchParams;

  return <SearchPage searchParams={params} />;
}
