import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cards = [
  {
    title: "Offentlige beskyttelsesrumsdata",
    body: "Alle beskyttelsesrum stammer fra de officielle BBR- og DAR-registre. Data opdateres automatisk hver dag.",
  },
  {
    title: "Kildehenvisning",
    body: "Hvert beskyttelsesrum viser sin kilde, importdato og et direkte link til den officielle registerindgang.",
  },
  {
    title: "Manuelle korrektioner",
    body: "Redaktører kan korrigere individuelle resultater uden at ændre de underliggende officielle data. Begge værdier forbliver synlige.",
  },
];

export function DataPage() {
  return (
    <PageShell className="py-12 sm:py-16">
      <div className="space-y-10">
        <SectionHeading
          eyebrow="TRANSPARENS"
          title="Sådan er data struktureret"
          description="Findbeskyttelsesrum v2 er designet til at gøre kildehenvisning, opdateringsdato og manuelle korrektioner synlige frem for implicitte."
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
