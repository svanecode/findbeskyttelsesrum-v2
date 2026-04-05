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
      title: "Kommune ikke fundet",
      description: "Den ønskede kommuneside kunne ikke findes.",
    };
  }

  return {
    title: `${municipality.name} beskyttelsesrum`,
    description: `Se ${municipality.shelterCount} offentlige beskyttelsesrumsregistreringer i ${municipality.name} Kommune med status og kildeoplysninger.`,
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
