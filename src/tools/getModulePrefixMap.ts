import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfdJsonRpcUrlFromEnv } from "../shared/confdRpc.js";
import { callConfdJsonRpc } from "../shared/jsonRpcClient.js";

export interface ModulePrefix {
  module: string;
  prefix: string;
  namespace: string;
}

export interface GetModulePrefixMapResponse {
  module_prefix_map: ModulePrefix[];
}

export async function getModulePrefixMap(
  baseUrl = getConfdJsonRpcUrlFromEnv(),
): Promise<GetModulePrefixMapResponse> {
  return callConfdJsonRpc<GetModulePrefixMapResponse>(baseUrl, "get_module_prefix_map");
}

export function registerGetModulePrefixMapTool(server: McpServer): void {
  server.tool(
    "get_module_prefix_map",
    "Lists loaded YANG modules with their prefixes and namespaces.",
    {},
    async () => {
      const result = await getModulePrefixMap();
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
}
