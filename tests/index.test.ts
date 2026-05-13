import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createServer, isMainModule, ping, startServer } from "../src/index";

describe("index", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns pong", () => {
    expect(ping()).toBe("pong");
  });

  it("registers ping tool on server creation", () => {
    const toolSpy = vi.spyOn(McpServer.prototype, "tool");

    const server = createServer();

    expect(server).toBeInstanceOf(McpServer);
    expect(toolSpy).toHaveBeenCalledTimes(1);

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

  it("treats symlinked argv path as entrypoint", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-confd-test-"));
    const targetPath = join(dir, "target.js");
    const linkPath = join(dir, "link.js");

    writeFileSync(targetPath, "console.log('x')\n");
    symlinkSync(targetPath, linkPath);

    expect(isMainModule(pathToFileURL(targetPath).href, linkPath)).toBe(true);
  });
});
