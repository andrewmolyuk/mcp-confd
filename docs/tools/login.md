# login

Creates a ConfD user session.

## Input

- `user` (string, optional if `MCP_CONFD_USER` is set)
- `passwd` (string, optional if `MCP_CONFD_PASSWORD` is set)
- `ack_warning` (boolean, optional, default `false`)

## Output

JSON string with optional fields:

- `warning`
- `challenge_id`
- `challenge_prompt`
- `sessionid` (parsed from `Set-Cookie`)

## Login Request Details

The tool calls ConfD JSON-RPC method `login` on `/jsonrpc` and:

- Sends payload:
  - `{"jsonrpc":"2.0","id":1,"method":"login","params":{"user":"...","passwd":"...","ack_warning":false}}`
- Stores the full `sessionid` cookie from the HTTP `Set-Cookie` response header.
- Returns `sessionid` extracted from the cookie as a convenience field.

If ConfD returns a JSON-RPC error object, the tool raises an error that includes:

- `code`
- `type`
- `message`
- `warning` (when present)

## Authentication Challenge Behavior

ConfD may require challenge-based authentication. In that case:

- The tool returns `challenge_id` and `challenge_prompt` if present in login result data.
- The tool does not call `challenge_response` automatically.

Challenge completion is currently a caller responsibility.
