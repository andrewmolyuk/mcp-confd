# get_schema

Exports a JSON schema for a selected part (or all) of a YANG module from an active transaction.

## Input

```json
{
  "th": <integer>,
  "namespace": "<string, optional>",
  "path": "<string, optional>",
  "levels": <integer, optional>,
  "insert_values": <boolean, optional>,
  "evaluate_when_entries": <boolean, optional>,
  "stop_on_list": <boolean, optional>
}
```

Notes:
- `th` is required.
- At least one of `namespace` or `path` must be provided.
- To export an entire module, use `namespace` (without `path`) and set `levels` to `-1`.
- Use `get_module_prefix_map` first to discover valid module namespaces.

## Output

```json
{
  "meta": { "<key>": "<value>" },
  "data": { "<key>": "<value>" }
}
```

The exact schema payload depends on the target module/path and ConfD version.

## Behavior

- Calls ConfD JSON-RPC method `get_schema` on `/jsonrpc`.
- Requires an active `sessionid` cookie (login session).
- Requires an active transaction handle (`th`).
- Propagates ConfD errors, including schema/transaction errors.
