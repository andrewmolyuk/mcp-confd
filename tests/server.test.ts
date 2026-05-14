import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";
import { createServer, startServer } from "../src/index";
import { ping } from "../src/tools/ping";
import { setupTestIsolation } from "./testSetup";

describe("server", () => {
  setupTestIsolation();

  it("returns pong", () => {
    expect(ping()).toBe("pong");
  });

  it("registers all tools on server creation", () => {
    const toolSpy = vi.spyOn(McpServer.prototype, "tool");

    const server = createServer();

    expect(server).toBeInstanceOf(McpServer);
    expect(toolSpy).toHaveBeenCalledTimes(8);

    const [name, description, handler] = toolSpy.mock.calls[0] as [
      string,
      string,
      () => { content: Array<{ type: string; text: string }> },
    ];

    expect(name).toBe("ping");
    expect(description).toBe("Basic health-check endpoint");
    expect(handler()).toEqual({
      content: [{ type: "text", text: "pong" }],
    });
  });

  it("connects server with stdio transport on startServer", async () => {
    const connectSpy = vi
      .spyOn(McpServer.prototype, "connect")
      .mockResolvedValue(undefined);

    await startServer();

    expect(connectSpy).toHaveBeenCalledTimes(1);
  });
});
