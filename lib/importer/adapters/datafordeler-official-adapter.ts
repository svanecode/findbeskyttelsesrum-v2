import type { OfficialSourceAdapter } from "@/lib/importer/source-adapter";
import type {
  ImportedShelterRecord,
  ImporterFetchResult,
  ImporterWarning,
} from "@/lib/importer/types";

import { DatafordelerGraphqlClient } from "@/lib/importer/clients/datafordeler";

type BbrBuildingNode = {
  id_lokalId: string;
  kommunekode: string;
  status: string | null;
  husnummer: string | null;
  byg007Bygningsnummer: string | null;
  byg021BygningensAnvendelse: string | null;
};

type DarHouseNumberNode = {
  id_lokalId: string;
  status: string | null;
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
  municipalityOverrides: Record<string, MunicipalityMetadata>;
  shelterUsageCodes: Set<string>;
  acceptedDarStatuses: Set<string>;
  pageSize: number;
  requestTimeoutMs: number;
  bitemporalTimestamp: string;
};

type AdapterCounters = {
  skippedRecords: number;
  missingAddressCount: number;
  missingMunicipalityCount: number;
  missingCoordinatesCount: number;
};

const CANONICAL_SOURCE_NAME = "datafordeler-bbr-dar";
const BBR_DOCS_URL = "https://datafordeler.dk/dataoversigt/bygnings-og-boligregistret-bbr/bbr-graphql/";
const defaultMunicipalityOverrides: Record<string, MunicipalityMetadata> = {
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

const BBR_ACTIVE_STATUS = "6";

function buildFetchBbrBuildingsQuery(options: {
  hasMunicipalityFilter: boolean;
  hasUsageCodeFilter: boolean;
}) {
  const variableDefinitions = [
    "$first: Int!",
    "$after: String",
    "$registreringstid: DafDateTime",
    "$virkningstid: DafDateTime",
  ];

  if (options.hasMunicipalityFilter) {
    variableDefinitions.push("$municipalityCodes: [String!]");
  }

  if (options.hasUsageCodeFilter) {
    variableDefinitions.push("$usageCodes: [String!]");
  }

  const whereParts = [`status: { eq: "${BBR_ACTIVE_STATUS}" }`];

  if (options.hasMunicipalityFilter) {
    whereParts.push("kommunekode: { in: $municipalityCodes }");
  }

  if (options.hasUsageCodeFilter) {
    whereParts.push("byg021BygningensAnvendelse: { in: $usageCodes }");
  }

  return `
    query FetchBbrBuildings(
      ${variableDefinitions.join("\n      ")}
    ) {
      BBR_Bygning(
        first: $first
        after: $after
        registreringstid: $registreringstid
        virkningstid: $virkningstid
        where: {
          ${whereParts.join("\n          ")}
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
            status
            husnummer
            byg007Bygningsnummer
            byg021BygningensAnvendelse
          }
        }
      }
    }
  `;
}

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
      }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id_lokalId
          status
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

function getOptionalCsvEnv(name: string) {
  const raw = process.env[name]?.trim();

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getDatafordelerShelterUsageCodes() {
  const next = process.env.DATAFORDELER_BBR_SHELTER_USAGE_CODES?.trim();

  if (next) {
    return next
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return getOptionalCsvEnv("DATAFORDELER_BBR_USAGE_CODES");
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

function parseMunicipalityOverrides(raw: string | undefined) {
  if (!raw?.trim()) {
    return {};
  }

  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return Object.fromEntries(
    entries.map((entry) => {
      const [code, slug, name, regionName] = entry.split(":").map((part) => part.trim());

      if (!code || !slug || !name) {
        throw new Error(
          "DATAFORDELER_MUNICIPALITY_METADATA must use code:slug:name:region format for each entry.",
        );
      }

      return [
        code,
        {
          slug,
          name,
          regionName: regionName || null,
        } satisfies MunicipalityMetadata,
      ];
    }),
  ) as Record<string, MunicipalityMetadata>;
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
  return "Imported from Datafordeler BBR and DAR. Shelter-specific capacity, accessibility, and readiness details are still being confirmed.";
}

function getConfig(): DatafordelerAdapterConfig {
  return {
    apiKey: getRequiredEnv("DATAFORDELER_API_KEY"),
    bbrGraphqlUrl:
      process.env.DATAFORDELER_BBR_GRAPHQL_URL?.trim() || "https://graphql.datafordeler.dk/BBR/v1",
    darGraphqlUrl:
      process.env.DATAFORDELER_DAR_GRAPHQL_URL?.trim() || "https://graphql.datafordeler.dk/DAR/v1",
    municipalityCodes: getOptionalCsvEnv("DATAFORDELER_MUNICIPALITY_CODES"),
    municipalityOverrides: {
      ...defaultMunicipalityOverrides,
      ...parseMunicipalityOverrides(process.env.DATAFORDELER_MUNICIPALITY_METADATA),
    },
    shelterUsageCodes: new Set(getDatafordelerShelterUsageCodes()),
    acceptedDarStatuses: new Set(
      getOptionalCsvEnv("DATAFORDELER_DAR_ACTIVE_STATUSES").length > 0
        ? getOptionalCsvEnv("DATAFORDELER_DAR_ACTIVE_STATUSES")
        : ["3"],
    ),
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

  async fetchRecords(snapshot: { name: string }): Promise<ImporterFetchResult> {
    void snapshot;

    console.log(
      `[importer] datafordeler: starting nationwide BBR status-${BBR_ACTIVE_STATUS} fetch${this.config.municipalityCodes.length > 0 ? ` with municipality narrowing (${this.config.municipalityCodes.join(", ")})` : ""}${this.config.shelterUsageCodes.size > 0 ? ` and usage-code narrowing (${[...this.config.shelterUsageCodes].join(", ")})` : ""}`,
    );

    const warnings: ImporterWarning[] = [];
    const counters: AdapterCounters = {
      skippedRecords: 0,
      missingAddressCount: 0,
      missingMunicipalityCount: 0,
      missingCoordinatesCount: 0,
    };

    const buildings = await this.fetchAllBbrBuildings(warnings);
    console.log(`[importer] datafordeler: fetched ${buildings.length} BBR building records`);

    const eligibleBuildings = buildings.filter((building) => this.isEligibleBuilding(building, warnings, counters));
    console.log(`[importer] datafordeler: ${eligibleBuildings.length} BBR records passed eligibility checks`);

    const darHouseNumbers = await this.fetchDarHouseNumbers(eligibleBuildings, warnings);
    console.log(`[importer] datafordeler: fetched ${darHouseNumbers.size} DAR house-number records`);

    const records: ImportedShelterRecord[] = [];

    for (const building of eligibleBuildings) {
      const record = this.normalizeRecord(
        building,
        darHouseNumbers.get(building.husnummer ?? ""),
        warnings,
        counters,
      );

      if (!record) {
        counters.skippedRecords += 1;
        continue;
      }

      records.push(record);
    }

    console.log(
      `[importer] datafordeler: normalized ${records.length} shelter records, skipped ${counters.skippedRecords}`,
    );

    return {
      records,
      warnings,
      stats: {
        fetchedRecords: buildings.length,
        normalizedRecords: records.length,
        skippedRecords: counters.skippedRecords,
        missingAddressCount: counters.missingAddressCount,
        missingMunicipalityCount: counters.missingMunicipalityCount,
        missingCoordinatesCount: counters.missingCoordinatesCount,
      },
    };
  }

  private async fetchAllBbrBuildings(warnings: ImporterWarning[]) {
    const nodes: BbrBuildingNode[] = [];
    let after: string | null = null;
    let page = 1;
    const hasMunicipalityFilter = this.config.municipalityCodes.length > 0;
    const hasUsageCodeFilter = this.config.shelterUsageCodes.size > 0;
    const query = buildFetchBbrBuildingsQuery({
      hasMunicipalityFilter,
      hasUsageCodeFilter,
    });

    while (true) {
      console.log(`[importer] datafordeler: fetching BBR page ${page}`);

      let payload: BbrBuildingsResponse;

      try {
        payload = await this.bbrClient.query<BbrBuildingsResponse, Record<string, unknown>>({
          operationName: "FetchBbrBuildings",
          query,
          variables: {
            first: this.config.pageSize,
            after,
            registreringstid: this.config.bitemporalTimestamp,
            virkningstid: this.config.bitemporalTimestamp,
            ...(hasMunicipalityFilter
              ? { municipalityCodes: this.config.municipalityCodes }
              : {}),
            ...(hasUsageCodeFilter
              ? { usageCodes: [...this.config.shelterUsageCodes] }
              : {}),
          },
        });
      } catch (error) {
        throw new Error(
          `BBR fetch failed on page ${page}: ${error instanceof Error ? error.message : "Unknown error."}`,
        );
      }

      nodes.push(...payload.BBR_Bygning.edges.map((edge) => edge.node));

      if (payload.BBR_Bygning.edges.length === 0) {
        warnings.push({
          level: "warning",
          code: "bbr_empty_page",
          message: `BBR returned an empty page ${page}.`,
        });
      }

      if (!payload.BBR_Bygning.pageInfo.hasNextPage || !payload.BBR_Bygning.pageInfo.endCursor) {
        break;
      }

      after = payload.BBR_Bygning.pageInfo.endCursor;
      page += 1;
    }

    return nodes;
  }

  private async fetchDarHouseNumbers(buildings: BbrBuildingNode[], warnings: ImporterWarning[]) {
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

      let payload: DarHouseNumbersResponse;

      try {
        payload = await this.darClient.query<DarHouseNumbersResponse, Record<string, unknown>>({
          operationName: "FetchDarHouseNumbers",
          query: fetchDarHouseNumbersQuery,
          variables: {
            first: batch.length,
            houseNumberIds: batch,
            registreringstid: this.config.bitemporalTimestamp,
            virkningstid: this.config.bitemporalTimestamp,
          },
        });
      } catch (error) {
        throw new Error(
          `DAR fetch failed on batch ${batchIndex + 1}: ${error instanceof Error ? error.message : "Unknown error."}`,
        );
      }

      for (const edge of payload.DAR_Husnummer.edges) {
        map.set(edge.node.id_lokalId, edge.node);
      }
    }

    const missingIds = houseNumberIds.filter((id) => !map.has(id));

    if (missingIds.length > 0) {
      warnings.push({
        level: "warning",
        code: "dar_missing_house_numbers",
        message: `DAR did not return ${missingIds.length} referenced house-number rows.`,
      });
    }

    return map;
  }

  private isEligibleBuilding(
    building: BbrBuildingNode,
    warnings: ImporterWarning[],
    counters: AdapterCounters,
  ) {
    if (building.status !== BBR_ACTIVE_STATUS) {
      warnings.push({
        level: "warning",
        code: "bbr_ineligible_status",
        message: `Skipped BBR building because status ${building.status ?? "unknown"} is not the official shelter inclusion status ${BBR_ACTIVE_STATUS}.`,
        reference: building.id_lokalId,
      });
      counters.skippedRecords += 1;
      return false;
    }

    if (
      this.config.municipalityCodes.length > 0 &&
      !this.config.municipalityCodes.includes(building.kommunekode)
    ) {
      warnings.push({
        level: "warning",
        code: "bbr_excluded_municipality_filter",
        message: `Skipped BBR building because municipality ${building.kommunekode} is outside the optional municipality filter.`,
        reference: building.id_lokalId,
      });
      counters.skippedRecords += 1;
      return false;
    }

    if (
      this.config.shelterUsageCodes.size > 0 &&
      (!building.byg021BygningensAnvendelse ||
        !this.config.shelterUsageCodes.has(building.byg021BygningensAnvendelse))
    ) {
      warnings.push({
        level: "warning",
        code: "bbr_excluded_usage_filter",
        message: `Skipped BBR building because usage code ${building.byg021BygningensAnvendelse ?? "unknown"} is outside the optional usage-code filter.`,
        reference: building.id_lokalId,
      });
      counters.skippedRecords += 1;
      return false;
    }

    if (!building.husnummer) {
      warnings.push({
        level: "warning",
        code: "bbr_missing_house_number",
        message: "Skipped BBR building because no DAR house-number reference was present.",
        reference: building.id_lokalId,
      });
      counters.missingAddressCount += 1;
      counters.skippedRecords += 1;
      return false;
    }

    return true;
  }

  private normalizeRecord(
    building: BbrBuildingNode,
    houseNumber: DarHouseNumberNode | undefined,
    warnings: ImporterWarning[],
    counters: AdapterCounters,
  ): ImportedShelterRecord | null {
    const municipality = this.getMunicipalityMetadata(building.kommunekode, warnings);

    if (!municipality) {
      counters.missingMunicipalityCount += 1;
      return null;
    }

    if (!houseNumber) {
      warnings.push({
        level: "warning",
        code: "dar_house_number_not_found",
        message: "Skipped building because the referenced DAR house-number row was not returned.",
        reference: building.id_lokalId,
      });
      counters.missingAddressCount += 1;
      return null;
    }

    if (!houseNumber.status || !this.config.acceptedDarStatuses.has(houseNumber.status)) {
      warnings.push({
        level: "warning",
        code: "dar_ineligible_status",
        message: `Skipped building because DAR house-number status ${houseNumber.status ?? "unknown"} is not active.`,
        reference: building.id_lokalId,
      });
      counters.missingAddressCount += 1;
      return null;
    }

    const roadName = houseNumber.navngivenVej?.navn?.trim() ?? "";
    const houseNumberText = houseNumber.husnummertekst?.trim() ?? "";
    const postalCode = houseNumber.postnummer?.nr?.trim() ?? "";
    const city = houseNumber.postnummer?.navn?.trim() ?? "";

    if (!roadName || !houseNumberText || !postalCode || !city) {
      warnings.push({
        level: "warning",
        code: "dar_incomplete_address",
        message: "Skipped building because DAR address data was incomplete.",
        reference: building.id_lokalId,
      });
      counters.missingAddressCount += 1;
      return null;
    }

    const addressLine1 = `${roadName} ${houseNumberText}`.trim();
    warnings.push({
      level: "warning",
      code: "bbr_coordinates_deferred",
      message:
        "BBR coordinates are temporarily deferred in the real adapter until the GraphQL coordinate field shape is confirmed.",
      reference: building.id_lokalId,
    });
    counters.missingCoordinatesCount += 1;

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
        latitude: null,
        longitude: null,
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
    };
  }

  private getMunicipalityMetadata(code: string, warnings: ImporterWarning[]) {
    const known = this.config.municipalityOverrides[code];

    if (known) {
      return known;
    }

    warnings.push({
      level: "warning",
      code: "municipality_metadata_fallback",
      message: `No municipality metadata override was configured for municipality code ${code}. Using a generated fallback value.`,
      reference: code,
    });

    return {
      slug: `kommune-${code}`,
      name: `Municipality ${code}`,
      regionName: null,
    } satisfies MunicipalityMetadata;
  }
}
