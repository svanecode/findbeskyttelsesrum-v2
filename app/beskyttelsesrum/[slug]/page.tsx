import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ShelterDetailPage } from "@/features/shelter/shelter-detail-page";
import { getShelterBySlug } from "@/lib/supabase/queries";

type ShelterRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: ShelterRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const shelter = await getShelterBySlug(slug);

  if (!shelter) {
    return {
      title: "Beskyttelsesrum ikke fundet",
      description: "Det ønskede beskyttelsesrum kunne ikke findes.",
    };
  }

  return {
    title: `Beskyttelsesrum · ${shelter.addressLine1 || shelter.city}`,
    description: `${shelter.capacity} pladser. ${shelter.addressLine1}, ${shelter.postalCode} ${shelter.city}.`,
  };
}

export default async function Page({ params }: ShelterRouteProps) {
  const { slug } = await params;
  const shelter = await getShelterBySlug(slug);

  if (!shelter) {
    notFound();
  }

  return <ShelterDetailPage shelter={shelter} />;
}
