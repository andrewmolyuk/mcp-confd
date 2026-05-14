# get_trans

Lists all open ConfD transactions for the current session.

## Input

None.

## Output

```json
{
  "trans": [
    {
      "db": "running" | "startup" | "candidate",
      "mode": "read" | "read_write",
      "conf_mode": "private" | "shared" | "exclusive",
      "tag": "<string>",
      "th": <integer>
    }
  ]
}
```

Returns an empty `trans` array if there are no open transactions.

## Behavior

- Calls ConfD JSON-RPC method `get_trans` on `/jsonrpc`.
- Sends the active `sessionid` cookie if a login session exists.
- Can be called without an active session (returns empty list).

## Notes

- The `th` (transaction handle) returned here is used as input to transaction-scoped methods such as `get_value`, `set_value`, `validate_commit`, etc.
- `mode`, `conf_mode`, and `tag` may be absent from entries returned by older ConfD versions; treat them as optional when consuming the result.
