import proj4 from "proj4";

import type { OfficialSourceAdapter } from "@/lib/importer/source-adapter";
import type { ImportedShelterRecord } from "@/lib/importer/types";

import { DatafordelerGraphqlClient } from "@/lib/importer/clients/datafordeler";

type BbrBuildingNode = {
  id_lokalId: string;
  kommunekode: string;
  husnummer: string | null;
  byg007Bygningsnummer: string | null;
  byg021BygningensAnvendelse: string | null;
  byg404Koordinat: string | null;
};

type DarHouseNumberNode = {
  id_lokalId: string;
  navngivenVej?: {
    navn?: string | null;
  } | null;
  husnummertekst?: string | null;
  postnummer?: {
    nr?: string | null;
    navn?: string | null;
  } | null;
};

type Connection<TNode> = {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
  edges: Array<{
    node: TNode;
  }>;
};

type BbrBuildingsResponse = {
  BBR_Bygning: Connection<BbrBuildingNode>;
};

type DarHouseNumbersResponse = {
  DAR_Husnummer: Connection<DarHouseNumberNode>;
};

type MunicipalityMetadata = {
  slug: string;
  name: string;
  regionName: string | null;
};

type DatafordelerAdapterConfig = {
  apiKey: string;
  bbrGraphqlUrl: string;
  darGraphqlUrl: string;
  municipalityCodes: string[];
  bbrUsageCodes: string[];
  pageSize: number;
  requestTimeoutMs: number;
  bitemporalTimestamp: string;
};

const CANONICAL_SOURCE_NAME = "datafordeler-bbr-dar";
const BBR_DOCS_URL = "https://datafordeler.dk/dataoversigt/bygnings-og-boligregistret-bbr/bbr-graphql/";
const ETRS89_UTM32 = "EPSG:25832";
const WGS84 = "EPSG:4326";

proj4.defs(
  ETRS89_UTM32,
  "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs +type=crs",
);

const municipalityByCode: Record<string, MunicipalityMetadata> = {
  "0101": {
    slug: "kobenhavn",
    name: "Copenhagen",
    regionName: "Capital Region of Denmark",
  },
  "0147": {
    slug: "frederiksberg",
    name: "Frederiksberg",
    regionName: "Capital Region of Denmark",
  },
};

const fetchBbrBuildingsQuery = `
  query FetchBbrBuildings(
    $first: Int!
    $after: Cursor
    $municipalityCodes: [String!]
    $usageCodes: [String!]
    $registreringstid: DateTime
    $virkningstid: DateTime
  ) {
    BBR_Bygning(
      first: $first
      after: $after
      registreringstid: $registreringstid
      virkningstid: $virkningstid
      where: {
        kommunekode: { in: $municipalityCodes }
        byg021BygningensAnvendelse: { in: $usageCodes }
        status: { eq: "6" }
      }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id_lokalId
          kommunekode
          husnummer
          byg007Bygningsnummer
          byg021BygningensAnvendelse
          byg404Koordinat
        }
      }
    }
  }
`;

const fetchDarHouseNumbersQuery = `
  query FetchDarHouseNumbers(
    $first: Int!
    $houseNumberIds: [String!]
    $registreringstid: DateTime
    $virkningstid: DateTime
  ) {
    DAR_Husnummer(
      first: $first
      registreringstid: $registreringstid
      virkningstid: $virkningstid
      where: {
        id_lokalId: { in: $houseNumberIds }
        status: { eq: "gældende" }
      }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id_lokalId
          husnummertekst
          navngivenVej {
            navn
          }
          postnummer {
            nr
            navn
          }
        }
      }
    }
  }
`;

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable ${name}.`);
  }

  return value;
}

function getOptionalNumber(name: string, fallback: number) {
  const raw = process.env[name]?.trim();

  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive number.`);
  }

  return parsed;
}

function getCsvEnv(name: string) {
  return getRequiredEnv(name)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseBbrPoint(point: string | null) {
  if (!point) {
    return {
      latitude: null,
      longitude: null,
    };
  }

  const match = point.match(/POINT\s*\(?\s*([0-9.]+)\s+([0-9.]+)\s*\)?/i);

  if (!match) {
    return {
      latitude: null,
      longitude: null,
    };
  }

  const [, xRaw, yRaw] = match;
  const x = Number(xRaw);
  const y = Number(yRaw);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return {
      latitude: null,
      longitude: null,
    };
  }

  const [longitude, latitude] = proj4(ETRS89_UTM32, WGS84, [x, y]);

  return {
    latitude,
    longitude,
  };
}

function getMunicipalityMetadata(code: string): MunicipalityMetadata {
  const known = municipalityByCode[code];

  if (known) {
    return known;
  }

  return {
    slug: `kommune-${code}`,
    name: `Municipality ${code}`,
    regionName: null,
  };
}

function buildShelterSlug(input: {
  municipalitySlug: string;
  addressLine1: string;
  canonicalSourceReference: string;
}) {
  const addressPart = slugify(input.addressLine1);
  const referencePart = slugify(input.canonicalSourceReference).slice(-12);

  return [input.municipalitySlug, addressPart || "shelter", referencePart].filter(Boolean).join("-");
}

function buildShelterName(addressLine1: string) {
  return `Shelter at ${addressLine1}`;
}

function buildSummary() {
  return "Imported from Datafordeler BBR and DAR. Shelter-specific capacity, accessibility, and readiness details are still being mapped.";
}

function getConfig(): DatafordelerAdapterConfig {
  return {
    apiKey: getRequiredEnv("DATAFORDELER_API_KEY"),
    bbrGraphqlUrl:
      process.env.DATAFORDELER_BBR_GRAPHQL_URL?.trim() || "https://graphql.datafordeler.dk/BBR/v1",
    darGraphqlUrl:
      process.env.DATAFORDELER_DAR_GRAPHQL_URL?.trim() || "https://graphql.datafordeler.dk/DAR/v1",
    municipalityCodes: getCsvEnv("DATAFORDELER_MUNICIPALITY_CODES"),
    bbrUsageCodes: getCsvEnv("DATAFORDELER_BBR_USAGE_CODES"),
    pageSize: getOptionalNumber("DATAFORDELER_PAGE_SIZE", 200),
    requestTimeoutMs: getOptionalNumber("DATAFORDELER_REQUEST_TIMEOUT_MS", 30000),
    bitemporalTimestamp: process.env.DATAFORDELER_BITEMPORAL_TIMESTAMP?.trim() || new Date().toISOString(),
  };
}

export class DatafordelerOfficialSourceAdapter implements OfficialSourceAdapter {
  readonly sourceName = CANONICAL_SOURCE_NAME;
  readonly sourceUrl = BBR_DOCS_URL;
  private readonly config: DatafordelerAdapterConfig;
  private readonly bbrClient: DatafordelerGraphqlClient;
  private readonly darClient: DatafordelerGraphqlClient;

  constructor() {
    this.config = getConfig();
    this.bbrClient = new DatafordelerGraphqlClient({
      endpoint: this.config.bbrGraphqlUrl,
      apiKey: this.config.apiKey,
      requestTimeoutMs: this.config.requestTimeoutMs,
    });
    this.darClient = new DatafordelerGraphqlClient({
      endpoint: this.config.darGraphqlUrl,
      apiKey: this.config.apiKey,
      requestTimeoutMs: this.config.requestTimeoutMs,
    });
  }

  async fetchRecords(snapshot: { name: string }): Promise<ImportedShelterRecord[]> {
    void snapshot;

    console.log(
      `[importer] datafordeler: starting BBR fetch for municipalities ${this.config.municipalityCodes.join(", ")}`,
    );

    const buildings = await this.fetchAllBbrBuildings();
    console.log(`[importer] datafordeler: fetched ${buildings.length} BBR building records`);

    const darHouseNumbers = await this.fetchDarHouseNumbers(buildings);
    console.log(`[importer] datafordeler: fetched ${darHouseNumbers.size} DAR house-number records`);

    const records = buildings
      .map((building) => this.normalizeRecord(building, darHouseNumbers.get(building.husnummer ?? "")))
      .filter((record): record is ImportedShelterRecord => record !== null);

    console.log(`[importer] datafordeler: normalized ${records.length} shelter records`);

    return records;
  }

  private async fetchAllBbrBuildings() {
    const nodes: BbrBuildingNode[] = [];
    let after: string | null = null;
    let page = 1;

    while (true) {
      console.log(`[importer] datafordeler: fetching BBR page ${page}`);

      const payload: BbrBuildingsResponse = await this.bbrClient.query<
        BbrBuildingsResponse,
        Record<string, unknown>
      >({
        operationName: "FetchBbrBuildings",
        query: fetchBbrBuildingsQuery,
        variables: {
          first: this.config.pageSize,
          after,
          municipalityCodes: this.config.municipalityCodes,
          usageCodes: this.config.bbrUsageCodes,
          registreringstid: this.config.bitemporalTimestamp,
          virkningstid: this.config.bitemporalTimestamp,
        },
      });

      nodes.push(...payload.BBR_Bygning.edges.map((edge) => edge.node));

      if (!payload.BBR_Bygning.pageInfo.hasNextPage || !payload.BBR_Bygning.pageInfo.endCursor) {
        break;
      }

      after = payload.BBR_Bygning.pageInfo.endCursor;
      page += 1;
    }

    return nodes;
  }

  private async fetchDarHouseNumbers(buildings: BbrBuildingNode[]) {
    const houseNumberIds = [...new Set(buildings.map((building) => building.husnummer).filter(Boolean))] as string[];

    if (houseNumberIds.length === 0) {
      return new Map<string, DarHouseNumberNode>();
    }

    const batches: string[][] = [];

    for (let index = 0; index < houseNumberIds.length; index += this.config.pageSize) {
      batches.push(houseNumberIds.slice(index, index + this.config.pageSize));
    }

    const map = new Map<string, DarHouseNumberNode>();

    for (const [batchIndex, batch] of batches.entries()) {
      console.log(
        `[importer] datafordeler: fetching DAR house-number batch ${batchIndex + 1}/${batches.length}`,
      );

      const payload: DarHouseNumbersResponse = await this.darClient.query<
        DarHouseNumbersResponse,
        Record<string, unknown>
      >({
        operationName: "FetchDarHouseNumbers",
        query: fetchDarHouseNumbersQuery,
        variables: {
          first: batch.length,
          houseNumberIds: batch,
          registreringstid: this.config.bitemporalTimestamp,
          virkningstid: this.config.bitemporalTimestamp,
        },
      });

      for (const edge of payload.DAR_Husnummer.edges) {
        map.set(edge.node.id_lokalId, edge.node);
      }
    }

    return map;
  }

  private normalizeRecord(
    building: BbrBuildingNode,
    houseNumber: DarHouseNumberNode | undefined,
  ): ImportedShelterRecord | null {
    if (!building.husnummer || !houseNumber?.navngivenVej?.navn || !houseNumber.husnummertekst) {
      return null;
    }

    const municipality = getMunicipalityMetadata(building.kommunekode);
    const addressLine1 = `${houseNumber.navngivenVej.navn} ${houseNumber.husnummertekst}`.trim();
    const postalCode = houseNumber.postnummer?.nr?.trim() ?? "";
    const city = houseNumber.postnummer?.navn?.trim() ?? "";

    if (!postalCode || !city) {
      return null;
    }

    const coordinates = parseBbrPoint(building.byg404Koordinat);
    const canonicalSourceReference = building.id_lokalId;

    return {
      municipality,
      shelter: {
        slug: buildShelterSlug({
          municipalitySlug: municipality.slug,
          addressLine1,
          canonicalSourceReference,
        }),
        name: buildShelterName(addressLine1),
        addressLine1,
        postalCode,
        city,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        capacity: 0,
        status: "under_review",
        accessibilityNotes: null,
        summary: buildSummary(),
      },
      source: {
        canonicalSourceName: CANONICAL_SOURCE_NAME,
        canonicalSourceReference,
        sourceName: "Datafordeler BBR + DAR",
        sourceType: "official",
        sourceUrl: BBR_DOCS_URL,
        sourceReference: canonicalSourceReference,
        lastVerifiedAt: null,
        notes: `Normalized from BBR building ${building.byg007Bygningsnummer ?? canonicalSourceReference} with DAR address enrichment.`,
      },
      lifecycle: {
        importState: "active",
      },
    } satisfies ImportedShelterRecord;
  }
}
