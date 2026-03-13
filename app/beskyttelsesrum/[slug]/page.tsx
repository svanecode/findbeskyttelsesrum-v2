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
      title: "Shelter not found",
      description: "The requested shelter record could not be found.",
    };
  }

  return {
    title: `${shelter.name} | ${shelter.city}`,
    description: `${shelter.name} in ${shelter.municipality.name}. View status, address, source information, and public trust details.`,
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
