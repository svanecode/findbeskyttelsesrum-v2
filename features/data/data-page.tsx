import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cards = [
  {
    title: "Public shelter records",
    body: "Shelter pages read from the public shelters table. It is the stable read model used by the app.",
  },
  {
    title: "Source provenance",
    body: "Each public shelter can carry one or more source records with references, URLs, and verification dates.",
  },
  {
    title: "Manual overrides",
    body: "Operational status changes are stored separately from imports so manual decisions remain auditable.",
  },
];

export function DataPage() {
  return (
    <PageShell className="py-12 sm:py-16">
      <div className="space-y-10">
        <SectionHeading
          eyebrow="Transparency"
          title="How the data is structured"
          description="Findbeskyttelsesrum v2 is designed to make source provenance, freshness, and manual intervention visible rather than implied."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.title} className="border border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {card.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
