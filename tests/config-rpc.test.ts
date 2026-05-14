import { describe, expect, it, vi } from "vitest";
import { getTrans } from "../src/tools/getTrans";
import { login } from "../src/tools/login";
import { setupTestIsolation } from "./testSetup";

describe("environment and RPC handling", () => {
  setupTestIsolation();

  it("uses MCP_CONFD_URL and default credentials from env", async () => {
    vi.stubEnv("MCP_CONFD_URL", "http://localhost:8888/jsonrpc");
    vi.stubEnv("MCP_CONFD_USER", "admin");
    vi.stubEnv("MCP_CONFD_PASSWORD", "admin");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: {} }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await login({});

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("http://localhost:8888/jsonrpc");

    const request = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    expect(typeof request.body).toBe("string");
    expect(request.body).toContain('"user":"admin"');
    expect(request.body).toContain('"passwd":"admin"');
  });

  it("uses https when MCP_CONFD_URL is https", async () => {
    vi.stubEnv("MCP_CONFD_URL", "https://localhost:8888/jsonrpc");
    vi.stubEnv("MCP_CONFD_USER", "admin");
    vi.stubEnv("MCP_CONFD_PASSWORD", "admin");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: {} }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await login({});

    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://localhost:8888/jsonrpc");
  });

  it("fails when MCP_CONFD_URL is invalid", async () => {
    vi.stubEnv("MCP_CONFD_URL", "not-a-url");
    vi.stubEnv("MCP_CONFD_USER", "admin");
    vi.stubEnv("MCP_CONFD_PASSWORD", "admin");

    await expect(login({})).rejects.toThrow("MCP_CONFD_URL must be a valid URL");
  });

  it("fails when MCP_CONFD_URL uses unsupported protocol", async () => {
    vi.stubEnv("MCP_CONFD_URL", "ftp://localhost:8888/jsonrpc");
    vi.stubEnv("MCP_CONFD_USER", "admin");
    vi.stubEnv("MCP_CONFD_PASSWORD", "admin");

    await expect(login({})).rejects.toThrow(
      "MCP_CONFD_URL must start with http:// or https://",
    );
  });

  it("ignores TLS verification when MCP_CONFD_IGNORE_SSL_ERRORS is enabled", async () => {
    vi.stubEnv("MCP_CONFD_URL", "https://localhost:8888/jsonrpc");
    vi.stubEnv("MCP_CONFD_USER", "admin");
    vi.stubEnv("MCP_CONFD_PASSWORD", "admin");
    vi.stubEnv("MCP_CONFD_IGNORE_SSL_ERRORS", "true");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBeUndefined();
      const requestInit = (init ?? {}) as Record<string, unknown>;
      expect(Boolean(requestInit.dispatcher || requestInit.tls)).toBe(true);
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: {} }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    await login({});

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBeUndefined();
  });

  it("throws rpc.http_error when get_trans receives a non-JSON HTTP error response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Gateway down", {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "text/plain" },
      }),
    );

    await expect(getTrans()).rejects.toMatchObject({
      name: "ConfdRpcError",
      errorType: "rpc.http_error",
    });
  });

  it("throws rpc.invalid_response when get_trans receives a malformed JSON body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not-json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(getTrans()).rejects.toMatchObject({
      name: "ConfdRpcError",
      errorType: "rpc.invalid_response",
    });
  });
});
