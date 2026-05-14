# logout

Removes the active ConfD user session.

## Input

None.

## Output

JSON string: `{}` on success.

## Behavior

- Calls ConfD JSON-RPC method `logout` on `/jsonrpc`.
- Uses the current `sessionid` cookie stored from a successful `login` call.
- Clears local stored session cookie on success.
- If no local session cookie exists, returns `{}` and does not call ConfD.

If ConfD returns `session.invalid_sessionid`, the tool clears local session cookie and raises an error.

## Prerequisite

- Optional. If no session is active, `logout` is treated as a no-op success.
