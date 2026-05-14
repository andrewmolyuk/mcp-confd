import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ConfdRpcError, getConfdJsonRpcUrlFromEnv } from "../shared/confdRpc.js";
import { callConfdJsonRpc } from "../shared/jsonRpcClient.js";
import { getSessionCookie } from "../shared/sessionCookie.js";

const RunActionShape = {
  th: z.number().int().describe("Transaction handle"),
  path: z.string().describe("Keypath to action or rpc"),
  params: z.record(z.string(), z.unknown()).optional(),
  format: z.enum(["normal", "bracket", "json"]).optional(),
  comet_id: z.string().optional(),
  handle: z.string().optional(),
  details: z.enum(["normal", "verbose", "very_verbose", "debug"]).optional(),
};

export type RunActionParams = z.infer<z.ZodObject<typeof RunActionShape>>;

export type RunActionResponse = unknown;

export async function runAction(
  params: RunActionParams,
  baseUrl = getConfdJsonRpcUrlFromEnv(),
): Promise<RunActionResponse> {
  const storedCookie = getSessionCookie();
  if (typeof storedCookie !== "string" || storedCookie.length === 0) {
    throw new Error("run_action requires an active session, call login first");
  }

  const hasCometId = typeof params.comet_id === "string" && params.comet_id.length > 0;
  const hasHandle = typeof params.handle === "string" && params.handle.length > 0;
  if (hasCometId !== hasHandle) {
    throw new Error("run_action requires both comet_id and handle when one is provided");
  }

  const rpcParams: Record<string, unknown> = {
    th: params.th,
    path: params.path,
  };
  if (params.params !== undefined) rpcParams.params = params.params;
  if (params.format !== undefined) rpcParams.format = params.format;
  if (params.comet_id !== undefined) rpcParams.comet_id = params.comet_id;
  if (params.handle !== undefined) rpcParams.handle = params.handle;
  if (params.details !== undefined) rpcParams.details = params.details;

  try {
    return await callConfdJsonRpc<RunActionResponse>(baseUrl, "run_action", rpcParams);
  } catch (e) {
    if (e instanceof ConfdRpcError && e.errorType === "session.invalid_sessionid") {
      throw new Error("run_action requires an active session, call login first");
    }
    throw e;
  }
}

export function registerRunActionTool(server: McpServer): void {
  server.tool(
    "run_action",
    "Invokes a YANG action or rpc with optional input parameters.",
    RunActionShape,
    async (params) => {
      const result = await runAction(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
}
