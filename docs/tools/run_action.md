# run_action

Invokes an action or rpc defined in a YANG module.

## Input

```json
{
  "th": <integer>,
  "path": "<string>",
  "params": { "<inputName>": "<inputValue>" },
  "format": "normal | bracket | json (optional)",
  "comet_id": "<string, optional>",
  "handle": "<string, optional>",
  "details": "normal | verbose | very_verbose | debug (optional)"
}
```

Notes:
- `th` and `path` are required.
- If one of `comet_id` or `handle` is provided, both must be provided.

## Output

```json
"<string>" | [{ "name": "<string>", "value": "<string>" }] | { "<key>": "<value>" }
```

The exact result shape depends on action/rpc definition and `format`.

## Behavior

- Calls ConfD JSON-RPC method `run_action` on `/jsonrpc`.
- Requires an active `sessionid` cookie (login session).
- Requires both `comet_id` and `handle` when using action progress notifications.
- If session is missing/invalid, returns a helpful error:
  - `run_action requires an active session, call login first`
