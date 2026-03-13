export const siteConfig = {
  name: "Findbeskyttelsesrum v2",
  description:
    "Calm, trustworthy, mobile-first shelter discovery for Denmark with visible source clarity.",
};

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
