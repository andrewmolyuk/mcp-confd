# query

Runs a one-shot ConfD query on a transaction handle and returns results immediately.

This is a convenience method equivalent to `start_query` + `run_query` + `stop_query`.

## Input

```json
{
  "th": <integer>,
  "xpath_expr": "<string, optional if path is given>",
  "path": "<string, optional if xpath_expr is given>",
  "selection": ["<xpath expression>", "..."],
  "chunk_size": <integer > 0, optional>,
  "initial_offset": <integer > 0, optional>,
  "sort": ["<xpath expression>", "..."],
  "sort_order": "ascending | descending (optional)",
  "context_node": "<string, keypath, optional>",
  "result_as": "string | keypath-value | leaf_value_as_string (optional)"
}
```

Notes:
- `th` is required.
- At least one of `xpath_expr` or `path` must be provided.
- For paginated/large result sets, ConfD recommends using `start_query` + `run_query` + `stop_query` directly.

## Output

```json
{
  "current_position": <integer>,
  "total_number_of_results": <integer>,
  "number_of_results": <integer>,
  "number_of_elements_per_result": <integer>,
  "result": ["... or keypath/value objects depending on result_as ..."]
}
```

The exact result item shape depends on `result_as`.

## Behavior

- Calls ConfD JSON-RPC method `query` on `/jsonrpc`.
- Requires an active `sessionid` cookie (login session).
- Requires `th` and one of `xpath_expr` or `path`.
- If session is missing/invalid, returns a helpful error:
  - `query requires an active session, call login first`
