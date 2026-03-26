const usageCodeLabels = {
  110: "Stuehus (landbrugsejendom)",
  120: "Parcelhus",
  130: "Rækkehus",
  140: "Etageboliger / flerfamilieshus",
  150: "Kollegium",
  160: "Bolig til døgninstitution",
  190: "Øvrig helårsbeboelse",
  210: "Industri / produktion",
  220: "Kontor / administration",
  230: "Butik",
  240: "Biograf, teater eller kirke",
  250: "Hotel eller restaurant",
  290: "Øvrig erhverv",
  310: "Transport",
  320: "Depot / lager",
  330: "Parkeringshus",
  390: "Øvrig infrastruktur",
  410: "Skole",
  420: "Kulturel institution",
  430: "Hospital",
  440: "Daginstitution / børnehave",
  490: "Øvrig institution",
  510: "Sommerhus",
  590: "Øvrig fritidsbebyggelse",
  910: "Garage / carport",
  920: "Udhus / skur",
  950: "Dedikeret beskyttelsesrum",
  990: "Øvrig bygning",
} as const satisfies Record<number, string>;

export function getBbrUsageLabel(code: number | null | undefined): string | null {
  if (code === null || code === undefined) {
    return null;
  }

  return usageCodeLabels[code as keyof typeof usageCodeLabels] ?? null;
}
