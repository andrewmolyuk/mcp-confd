# new_trans

Creates a new ConfD transaction and returns a transaction handle.

## Input

```json
{
  "db": "running | startup | candidate (optional)",
  "mode": "read | read_write (optional)",
  "conf_mode": "private | shared | exclusive (optional)",
  "tag": "<string, optional>",
  "action_path": "<string, optional>",
  "on_pending_changes": "reuse | reject | discard (optional)"
}
```

All fields are optional.

## Output

```json
{
  "th": 42
}
```

## Behavior

- Calls ConfD JSON-RPC method `new_trans` on `/jsonrpc`.
- Requires an active `sessionid` cookie (login session).
- If there is no active session (or session is invalid), returns a helpful error:
  - `new_trans requires an active session, call login first`
