# get_module_prefix_map

Lists loaded YANG modules with their module name, prefix, and namespace.

## Input

```json
{}
```

## Output

```json
{
  "module_prefix_map": [
    {
      "module": "ietf-interfaces",
      "prefix": "if",
      "namespace": "urn:ietf:params:xml:ns:yang:ietf-interfaces"
    }
  ]
}
```

## Behavior

- Calls ConfD JSON-RPC method `get_module_prefix_map` on `/jsonrpc`.
- Returns module-to-prefix-and-namespace mapping for loaded YANG modules.
- Useful for finding valid `namespace` values for `get_schema`.

## Use With get_schema

1. Call `get_module_prefix_map` and choose a target module.
2. Copy that module's `namespace` value.
3. Call `get_schema` with the same transaction handle (`th`) and that `namespace`.

Example flow:

```json
// get_module_prefix_map result excerpt
{
  "module_prefix_map": [
    {
      "module": "ietf-interfaces",
      "prefix": "if",
      "namespace": "urn:ietf:params:xml:ns:yang:ietf-interfaces"
    }
  ]
}
```

```json
// get_schema request for full module schema
{
  "th": 42,
  "namespace": "urn:ietf:params:xml:ns:yang:ietf-interfaces",
  "levels": -1
}
```
