import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MunicipalityPage } from "@/features/municipality/municipality-page";
import { getMunicipalityBySlug } from "@/lib/supabase/queries";

type MunicipalityRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: MunicipalityRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const municipality = await getMunicipalityBySlug(slug);

  if (!municipality) {
    return {
      title: "Municipality not found",
      description: "The requested municipality page could not be found.",
    };
  }

  return {
    title: `${municipality.name} shelters`,
    description: `Browse ${municipality.shelterCount} public shelter record${municipality.shelterCount === 1 ? "" : "s"} in ${municipality.name} municipality with status and source context.`,
  };
}

export default async function Page({ params }: MunicipalityRouteProps) {
  const { slug } = await params;
  const municipality = await getMunicipalityBySlug(slug);

  if (!municipality) {
    notFound();
  }

  return <MunicipalityPage municipality={municipality} />;
}
