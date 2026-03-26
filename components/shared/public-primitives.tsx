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
      <div className="space-y-4">
        <h1 className="max-w-4xl text-balance text-[2.2rem] font-semibold tracking-[-0.04em] text-[#f7efe6] sm:text-[3rem] lg:text-[3.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-pretty text-[1.02rem] leading-7 text-[#c8b8a4]">
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
        "rounded-[1.5rem] border border-white/10 bg-[#12151b] text-[#f7efe6] shadow-[0_24px_70px_rgba(0,0,0,0.34)]",
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
        "rounded-[1.5rem] border border-white/10 bg-[#0f1218]/92 p-5 text-[#f7efe6] shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-6",
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
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#f7efe6]">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-[#b6a692]">{description}</p>
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
    <div className={cn("space-y-1 border-t border-white/8 pt-3 first:border-t-0 first:pt-0", className)}>
      <dt className="text-sm text-[#9e907f]">
        {label}
      </dt>
      <dd className="text-sm leading-6 text-[#f2e8dc]">{value}</dd>
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
    <div className={cn("border-y border-white/10 py-4 text-[#f2e8dc] sm:py-5", className)}>
      <dl className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <dt className="text-sm text-[#9e907f]">
              {item.label}
            </dt>
            <dd className="text-sm leading-6 text-[#f2e8dc]">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
