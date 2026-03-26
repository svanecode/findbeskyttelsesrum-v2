import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "narrow" | "wide";
};

const variantClassName = {
  default: "max-w-6xl",
  narrow: "max-w-3xl",
  wide: "max-w-7xl",
} as const;

export function PageShell({
  children,
  className,
  variant = "default",
}: PageShellProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", variantClassName[variant], className)}
    >
      {children}
    </div>
  );
}
