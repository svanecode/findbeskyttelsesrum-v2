import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cards = [
  {
    title: "Public shelter records",
    body: "All shelters come from the official BBR and DAR registers. Records are updated automatically every day.",
  },
  {
    title: "Source provenance",
    body: "Every shelter shows its source, import date, and a direct link to the official register entry.",
  },
  {
    title: "Manual overrides",
    body: "Editors can correct individual records without altering the underlying official data. Both values stay visible.",
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
