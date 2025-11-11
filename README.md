# Snowflake.CortexAI.SearchAction

GitHub Action that executes a single Cortex Search query against Snowflake and returns the JSON response (including the original natural-language query).

## Inputs & environment

| Input / Env | Required? | Description |
|-------------|-----------|-------------|
| `service-name` / `SEARCH_SERVICE` | **Yes** | Fully-qualified Cortex Search service (e.g. `SNOWFLAKE_SAMPLE_CORTEXAI_DB.SEARCH_DATA.CUSTOMER_REVIEW_SEARCH`). |
| `query` / `SEARCH_QUERY` | **Yes** | Natural-language query text. |
| `limit` / `SEARCH_LIMIT` | No (defaults to `3`, minimum `1`) | Number of hits to request. Values below 1 are clamped to 1. |
| `filter` / `SEARCH_FILTER` | No | JSON filter expression per the Cortex Search API (see example below). |
| `fields` / `SEARCH_FIELDS` | No | Comma-separated list or JSON array of fields to include in each hit. |
| `offset` / `SEARCH_OFFSET` | No | Skip the first N hits (pagination). |
| `include-scores` / `SEARCH_INCLUDE_SCORES` | No | `true/false` toggle to include relevance scores. |
| `score-threshold` / `SEARCH_SCORE_THRESHOLD` | No | Only return hits whose scores meet this threshold. |
| `reranker` / `SEARCH_RERANKER` | No | Optional reranker model name. |
| `ranking-profile` / `SEARCH_RANKING_PROFILE` | No | Optional ranking profile. |
| `SNOWFLAKE_ACCOUNT_URL`, `SNOWFLAKE_PAT` **or** `SNOWFLAKE_PASSWORD` | **Yes** | Credentials used to call the Cortex Search REST API. Store them as repository/organization secrets. |

## Basic usage

```yaml
- name: Run Cortex Search
  uses: marcelinojackson-org/Snowflake.CortexAI.SearchAction@v1
  with:
    service-name: ${{ vars.SEARCH_SERVICE }}
    query: "Find orders with complaints about delivery"
    limit: 3
  env:
    SNOWFLAKE_ACCOUNT_URL: ${{ secrets.SNOWFLAKE_ACCOUNT_URL }}
    SNOWFLAKE_PAT: ${{ secrets.SNOWFLAKE_PAT }}
```

## Advanced usage

```yaml
- name: Run Cortex Search (advanced)
  id: cortex
  uses: marcelinojackson-org/Snowflake.CortexAI.SearchAction@v1
  with:
    service-name: ${{ vars.SEARCH_SERVICE }}
    query: ${{ vars.SEARCH_QUERY }}
    limit: ${{ vars.SEARCH_LIMIT || 1 }}
    filter: >
      {
        "@and": [
          { "@eq": { "NATION": "FRANCE" } },
          { "@eq": { "O_ORDERSTATUS": "F" } }
        ]
      }
    fields: "O_ORDERKEY,O_COMMENT"
    offset: 10
    include-scores: true
    score-threshold: 0.6
    reranker: ${{ vars.SEARCH_RERANKER }}
    ranking-profile: ${{ vars.SEARCH_RANKING_PROFILE }}
  env:
    SNOWFLAKE_ACCOUNT_URL: ${{ secrets.SNOWFLAKE_ACCOUNT_URL }}
    SNOWFLAKE_PAT: ${{ secrets.SNOWFLAKE_PAT }}

- name: Inspect JSON response
  run: |
    echo '${{ steps.cortex.outputs.result-json }}' | jq .
```

The `result-json` output contains both the original query and the JSON response:

```json
{
  "query": "Find orders with complaints about delivery",
  "response": { "...": "Snowflake Cortex Search JSON" }
}
```

## Filter example

```bash
export SEARCH_FILTER='{
  "@and": [
    { "@eq": { "NATION": "FRANCE" } },
    { "@eq": { "O_ORDERSTATUS": "F" } }
  ]
}'
```

### Other parameter samples

```bash
export SEARCH_FIELDS='O_ORDERKEY,O_COMMENT'
export SEARCH_OFFSET=10
export SEARCH_INCLUDE_SCORES=true
export SEARCH_SCORE_THRESHOLD=0.6
export SEARCH_RERANKER='CUSTOM_RERANKER'
export SEARCH_RANKING_PROFILE='DEFAULT_PROFILE'
```

## Outputs

- `result-json`: stringified JSON containing `{ query, response }` from Cortex Search.
