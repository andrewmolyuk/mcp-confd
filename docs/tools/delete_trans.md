# delete_trans

Deletes an open ConfD transaction by transaction handle.

## Input

```json
{
  "th": 42
}
```

## Output

```json
{}
```

## Behavior

- Calls ConfD JSON-RPC method `delete_trans` on `/jsonrpc`.
- Requires an active `sessionid` cookie (login session).
- If there is no active session (or session is invalid), returns a helpful error:
  - `delete_trans requires an active session, call login first`
