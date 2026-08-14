import assert from "node:assert/strict";
import test from "node:test";

import {
  searchPublicAtlasWithDependencies,
  searchResultLimit,
  type PublicSearchPlace,
  type PublicSearchStory,
  type PublicSearchTheme,
} from "../../app/_lib/search-core.ts";

type QueryCall = {
  ascending: boolean;
  column: string;
  fields: string;
  limit: number;
  orderColumn: string;
  pattern: string;
  table: string;
};

type QueryResponse = {
  data: unknown[] | null;
  error: unknown | null;
};

type QueryResponses = Record<string, QueryResponse>;

function createSearchClient(
  responses: QueryResponses,
  calls: QueryCall[] = [],
) {
  return {
    calls,
    client: {
      from(table: string) {
        return {
          select(fields: string) {
            return {
              ilike(column: string, pattern: string) {
                return {
                  order(
                    orderColumn: string,
                    { ascending }: { ascending: boolean },
                  ) {
                    return {
                      limit(limit: number) {
                        calls.push({
                          ascending,
                          column,
                          fields,
                          limit,
                          orderColumn,
                          pattern,
                          table,
                        });
                        return Promise.resolve(
                          responses[`${table}.${column}`] ?? {
                            data: [],
                            error: null,
                          },
                        );
                      },
                    };
                  },
                };
              },
            };
          },
        };
      },
    },
  };
}

function createStory(id: string): PublicSearchStory {
  return {
    id,
    slug: `story-${id}`,
    summary: `Summary ${id}`,
    title: `Story ${id}`,
  };
}

test("Search builds the four bounded public queries and escapes LIKE patterns", async () => {
  const { calls, client } = createSearchClient({});

  const result = await searchPublicAtlasWithDependencies("50%_\\dish", {
    createClient: () => client as never,
    logFailure: assert.fail,
  });

  assert.equal(result.error, false);
  assert.deepEqual(
    calls.map(({ table, fields, column, orderColumn, ascending, limit }) => ({
      table,
      fields,
      column,
      orderColumn,
      ascending,
      limit,
    })),
    [
      {
        table: "stories",
        fields: "id, title, slug, summary",
        column: "title",
        orderColumn: "published_at",
        ascending: false,
        limit: searchResultLimit,
      },
      {
        table: "stories",
        fields: "id, title, slug, summary",
        column: "summary",
        orderColumn: "published_at",
        ascending: false,
        limit: searchResultLimit,
      },
      {
        table: "places",
        fields: "id, name, slug, place_type, country_code",
        column: "name",
        orderColumn: "name",
        ascending: true,
        limit: searchResultLimit,
      },
      {
        table: "themes",
        fields: "id, name, slug, description",
        column: "name",
        orderColumn: "name",
        ascending: true,
        limit: searchResultLimit,
      },
    ],
  );
  assert.deepEqual(
    calls.map(({ pattern }) => pattern),
    Array(4).fill("%50\\%\\_\\\\dish%"),
  );
});

test("Search deduplicates and caps Stories while preserving Place and Theme groups", async () => {
  const place: PublicSearchPlace = {
    country_code: "JP",
    id: "place-1",
    name: "Osaka",
    place_type: "city",
    slug: "osaka",
  };
  const theme: PublicSearchTheme = {
    description: "Everyday food work.",
    id: "theme-1",
    name: "Daily Life",
    slug: "daily-life",
  };
  const { client } = createSearchClient({
    "places.name": { data: [place], error: null },
    "stories.summary": {
      data: ["3", "4", "5", "6", "7", "8"].map(createStory),
      error: null,
    },
    "stories.title": {
      data: ["1", "2", "3", "4"].map(createStory),
      error: null,
    },
    "themes.name": { data: [theme], error: null },
  });

  const result = await searchPublicAtlasWithDependencies("food", {
    createClient: () => client as never,
    logFailure: assert.fail,
  });

  assert.equal(result.error, false);
  assert.deepEqual(
    result.data.stories.map(({ id }) => id),
    ["1", "2", "3", "4", "5", "6"],
  );
  assert.deepEqual(result.data.places, [place]);
  assert.deepEqual(result.data.themes, [theme]);
});

test("Search returns the safe error result for query and configuration failures", async () => {
  const queryError = { message: "private database detail" };
  const loggedErrors: unknown[] = [];
  const { client } = createSearchClient({
    "stories.title": { data: null, error: queryError },
  });

  const failedQuery = await searchPublicAtlasWithDependencies("food", {
    createClient: () => client as never,
    logFailure: (error) => loggedErrors.push(error),
  });
  const configurationError = new Error("missing local configuration");
  const failedConfiguration = await searchPublicAtlasWithDependencies("food", {
    createClient: () => {
      throw configurationError;
    },
    logFailure: (error) => loggedErrors.push(error),
  });

  assert.deepEqual(failedQuery, { data: null, error: true });
  assert.deepEqual(failedConfiguration, { data: null, error: true });
  assert.deepEqual(loggedErrors, [queryError, configurationError]);
  assert.equal("message" in failedQuery, false);
  assert.equal("message" in failedConfiguration, false);
});
