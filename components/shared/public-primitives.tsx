// @deprecated These primitives are no longer imported anywhere. Keep until confirmed safe to remove.
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PublicPageIntroProps = {
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PublicPageIntro({
  title,
  description,
  meta,
  actions,
  className,
}: PublicPageIntroProps) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="space-y-3">
        <h1 className="max-w-4xl text-balance font-[family-name:var(--font-instrument-serif)] text-[2.4rem] leading-tight tracking-[-0.03em] text-foreground sm:text-[3.2rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-pretty text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {meta ? <div>{meta}</div> : null}
      {actions ? <div>{actions}</div> : null}
    </section>
  );
}

type PublicSurfaceProps = {
  children: ReactNode;
  className?: string;
};

export function PublicSurface({ children, className }: PublicSurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-[2px] border border-border bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

type PublicPanelProps = {
  children: ReactNode;
  className?: string;
};

export function PublicPanel({ children, className }: PublicPanelProps) {
  return (
    <div
      className={cn(
        "rounded-[2px] border border-border bg-card p-5 text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

type PublicSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function PublicSection({
  title,
  description,
  children,
  className,
}: PublicSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type MetadataListProps = {
  children: ReactNode;
  className?: string;
};

export function MetadataList({ children, className }: MetadataListProps) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-4 sm:grid-cols-2", className)}>
      {children}
    </dl>
  );
}

type MetadataItemProps = {
  label: string;
  value: ReactNode;
  className?: string;
};

export function MetadataItem({ label, value, className }: MetadataItemProps) {
  return (
    <div className={cn("space-y-1 border-t border-border pt-3 first:border-t-0 first:pt-0", className)}>
      <dt className="text-sm text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm leading-6 text-foreground">{value}</dd>
    </div>
  );
}

type DataStripProps = {
  items: Array<{
    label: string;
    value: string;
  }>;
  className?: string;
};

export function DataStrip({ items, className }: DataStripProps) {
  return (
    <div className={cn("border-y border-border py-4 text-foreground sm:py-5", className)}>
      <dl className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <dt className="text-sm text-muted-foreground">
              {item.label}
            </dt>
            <dd className="text-sm leading-6 text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
