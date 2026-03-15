type DatafordelerClientOptions = {
  endpoint: string;
  apiKey: string;
  requestTimeoutMs: number;
};

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{
    message?: string;
  }>;
};

export class DatafordelerGraphqlClient {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly requestTimeoutMs: number;

  constructor(options: DatafordelerClientOptions) {
    this.endpoint = options.endpoint;
    this.apiKey = options.apiKey;
    this.requestTimeoutMs = options.requestTimeoutMs;
  }

  async query<TData, TVariables extends Record<string, unknown>>(input: {
    query: string;
    variables: TVariables;
    operationName: string;
  }): Promise<TData> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    const url = new URL(this.endpoint);

    if (!url.searchParams.has("api-key")) {
      url.searchParams.set("api-key", this.apiKey);
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-gravitee-api-key": this.apiKey,
          "api-key": this.apiKey,
        },
        body: JSON.stringify({
          operationName: input.operationName,
          query: input.query,
          variables: input.variables,
        }),
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Datafordeler request for ${input.operationName} failed with ${response.status} ${response.statusText}.`,
        );
      }

      let payload: GraphqlResponse<TData>;

      try {
        payload = (await response.json()) as GraphqlResponse<TData>;
      } catch {
        throw new Error(`Datafordeler response for ${input.operationName} was not valid JSON.`);
      }

      if (payload.errors && payload.errors.length > 0) {
        const summary = payload.errors.map((error) => error.message ?? "Unknown GraphQL error").join("; ");
        throw new Error(`Datafordeler GraphQL error in ${input.operationName}: ${summary}`);
      }

      if (!payload.data) {
        throw new Error(`Datafordeler GraphQL response for ${input.operationName} did not include data.`);
      }

      return payload.data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Datafordeler request for ${input.operationName} timed out after ${this.requestTimeoutMs}ms.`);
      }

      if (error instanceof TypeError) {
        throw new Error(`Datafordeler network error in ${input.operationName}: ${error.message}`);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
