"use client";

import dynamic from "next/dynamic";

const ShelterDetailMap = dynamic(
  () => import("./shelter-detail-map").then((m) => m.ShelterDetailMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="border border-border"
        style={{
          height: "280px",
          borderRadius: "2px",
          background: "var(--muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span className="text-sm text-muted-foreground">Indlæser kort…</span>
      </div>
    ),
  },
);

export { ShelterDetailMap };
