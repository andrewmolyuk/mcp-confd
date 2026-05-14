import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ConfdRpcError, getConfdJsonRpcUrlFromEnv } from "../shared/confdRpc.js";
import { callConfdJsonRpc } from "../shared/jsonRpcClient.js";
import { getSessionCookie } from "../shared/sessionCookie.js";

const QueryShape = {
  th: z.number().int().describe("Transaction handle"),
  xpath_expr: z.string().optional(),
  path: z.string().optional(),
  selection: z.array(z.string()).optional(),
  chunk_size: z.number().int().positive().optional(),
  initial_offset: z.number().int().positive().optional(),
  sort: z.array(z.string()).optional(),
  sort_order: z.enum(["ascending", "descending"]).optional(),
  context_node: z.string().optional(),
  result_as: z.enum(["string", "keypath-value", "leaf_value_as_string"]).optional(),
};

export type QueryParams = z.infer<z.ZodObject<typeof QueryShape>>;

export interface QueryResult {
  current_position?: number;
  total_number_of_results?: number;
  number_of_results?: number;
  number_of_elements_per_result?: number;
  result?: unknown[];
  [key: string]: unknown;
}

export async function query(
  params: QueryParams,
  baseUrl = getConfdJsonRpcUrlFromEnv(),
): Promise<QueryResult> {
  const storedCookie = getSessionCookie();
  if (typeof storedCookie !== "string" || storedCookie.length === 0) {
    throw new Error("query requires an active session, call login first");
  }

  if (params.xpath_expr === undefined && params.path === undefined) {
    throw new Error("query requires either xpath_expr or path");
  }

  const rpcParams: Record<string, unknown> = { th: params.th };
  if (params.xpath_expr !== undefined) rpcParams.xpath_expr = params.xpath_expr;
  if (params.path !== undefined) rpcParams.path = params.path;
  if (params.selection !== undefined) rpcParams.selection = params.selection;
  if (params.chunk_size !== undefined) rpcParams.chunk_size = params.chunk_size;
  if (params.initial_offset !== undefined) rpcParams.initial_offset = params.initial_offset;
  if (params.sort !== undefined) rpcParams.sort = params.sort;
  if (params.sort_order !== undefined) rpcParams.sort_order = params.sort_order;
  if (params.context_node !== undefined) rpcParams.context_node = params.context_node;
  if (params.result_as !== undefined) rpcParams.result_as = params.result_as;

  try {
    return await callConfdJsonRpc<QueryResult>(baseUrl, "query", rpcParams);
  } catch (e) {
    if (e instanceof ConfdRpcError && e.errorType === "session.invalid_sessionid") {
      throw new Error("query requires an active session, call login first");
    }
    throw e;
  }
}

export function registerQueryTool(server: McpServer): void {
  server.tool(
    "query",
    "Runs a one-shot ConfD XPath query and returns the result chunk.",
    QueryShape,
    async (params) => {
      const result = await query(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
}
