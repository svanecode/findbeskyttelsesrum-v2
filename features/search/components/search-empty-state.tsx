import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SearchEmptyState() {
  return (
    <Card className="border border-dashed border-white/10 bg-[#12151b] py-0 text-[#f7efe6]">
      <CardHeader className="gap-3">
        <CardTitle className="text-[#fff7ef]">Search for an address, area, or municipality.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-[#b8a793]">
        <div className="flex flex-wrap gap-3">
          <Link
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-white/10 bg-[#0d1015] text-[#f7efe6] hover:bg-[#171b23]",
            )}
            href="/find?q=Copenhagen"
          >
            Try Copenhagen
          </Link>
          <Link
            className={cn(buttonVariants({ variant: "ghost" }), "px-0 text-[#ff9c52] hover:text-[#ffb06d]")}
            href="/kommune/kobenhavn"
          >
            Browse Copenhagen municipality
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
