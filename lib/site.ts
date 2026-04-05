export const siteConfig = {
  name: "Findbeskyttelsesrum v2",
  description:
    "Rolig, troværdig og mobil-først søgning efter beskyttelsesrum i Danmark med tydelig kildeangivelse.",
};

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
