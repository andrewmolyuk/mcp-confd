import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createServer, startServer } from "../src/index";
import { deleteTrans } from "../src/tools/deleteTrans";
import { getTrans } from "../src/tools/getTrans";
import { getSessionCookie, login, setSessionCookie } from "../src/tools/login";
import { logout } from "../src/tools/logout";
import { newTrans } from "../src/tools/newTrans";
import { ping } from "../src/tools/ping";

describe("index", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    setSessionCookie(null);
  });

  it("returns pong", () => {
    expect(ping()).toBe("pong");
  });

  it("registers ping tool on server creation", () => {
    const toolSpy = vi.spyOn(McpServer.prototype, "tool");

    const server = createServer();

    expect(server).toBeInstanceOf(McpServer);
    expect(toolSpy).toHaveBeenCalledTimes(6);

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

  it("calls ConfD login and stores session cookie", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: {} }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": "sessionid=sess123; Path=/; HttpOnly",
        },
      }),
    );

    const result = await login({ user: "admin", passwd: "admin" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ sessionid: "sess123" });
    expect(getSessionCookie()).toBe("sessionid=sess123; Path=/; HttpOnly");
  });

  it("calls ConfD logout with session cookie and clears local cookie", async () => {
    setSessionCookie("sessionid=sess123; Path=/; HttpOnly");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: {} }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const result = await logout();

    expect(result).toEqual({});
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const request = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const headers = request.headers as Record<string, string>;
    expect(headers.Cookie).toBe("sessionid=sess123");
    expect(getSessionCookie()).toBeNull();
  });

  it("returns success logout when there is no active session cookie", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(logout()).resolves.toEqual({});
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns open transactions from get_trans", async () => {
    setSessionCookie("sessionid=sess123; Path=/; HttpOnly");

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            trans: [
              { db: "running", mode: "read_write", conf_mode: "private", tag: "", th: 2 },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await getTrans();

    expect(result.trans).toHaveLength(1);
    expect(result.trans[0]).toMatchObject({ db: "running", mode: "read_write", th: 2 });
  });

  it("accepts minimal transaction shape from get_trans", async () => {
    setSessionCookie("sessionid=sess123; Path=/; HttpOnly");

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            trans: [{ db: "running", th: 3 }],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await getTrans();

    expect(result.trans).toHaveLength(1);
    expect(result.trans[0]).toEqual({ db: "running", th: 3 });
  });

  it("returns empty trans list from get_trans when no open transactions", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ jsonrpc: "2.0", id: 1, result: { trans: [] } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await getTrans();

    expect(result.trans).toEqual([]);
  });

  it("propagates invalid session error from get_trans", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          error: { code: -32000, type: "session.invalid_sessionid", message: "Invalid sessionid" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(getTrans()).rejects.toMatchObject({
      name: "ConfdRpcError",
      errorType: "session.invalid_sessionid",
    });
  });

  it("creates a new read transaction via new_trans", async () => {
    setSessionCookie("sessionid=sess123; Path=/; HttpOnly");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ jsonrpc: "2.0", id: 1, result: { th: 42 } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await newTrans({ db: "running", mode: "read" });

    expect(result).toEqual({ th: 42 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.method).toBe("new_trans");
    expect(body.params).toMatchObject({ db: "running", mode: "read" });
  });

  it("deletes a transaction via delete_trans", async () => {
    setSessionCookie("sessionid=sess123; Path=/; HttpOnly");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ jsonrpc: "2.0", id: 1, result: {} }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await deleteTrans(42);

    expect(result).toEqual({});
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.method).toBe("delete_trans");
    expect(body.params).toEqual({ th: 42 });
  });

  it("fails new_trans with helpful message when session is invalid", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(newTrans()).rejects.toThrow(
      "new_trans requires an active session, call login first",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails delete_trans with helpful message when no active session", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(deleteTrans(42)).rejects.toThrow(
      "delete_trans requires an active session, call login first",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns warning and challenge payload fields", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            warning: "Need acknowledgment",
            challenge_id: "challenge-1",
            challenge_prompt: "QWxhZGRpbjpPcGVuU2VzYW1l",
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const result = await login({ user: "admin", passwd: "admin", ack_warning: true });

    expect(result.warning).toBe("Need acknowledgment");
    expect(result.challenge_id).toBe("challenge-1");
    expect(result.challenge_prompt).toBe("QWxhZGRpbjpPcGVuU2VzYW1l");
  });

  it("throws on JSON-RPC error response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          error: {
            code: -32000,
            type: "rpc.method.failed",
            message: "Method failed",
            warning: "Password expires soon",
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    await expect(login({ user: "admin", passwd: "bad" })).rejects.toThrow(
      "[-32000] rpc.method.failed: Method failed Warning: Password expires soon",
    );
  });

  it("uses env vars for host, port, and default credentials", async () => {
    vi.stubEnv("MCP_CONFD_PROTOCOL", "http");
    vi.stubEnv("MCP_CONFD_HOST", "localhost");
    vi.stubEnv("MCP_CONFD_PORT", "8888");
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

  it("uses https when MCP_CONFD_PROTOCOL is set to https", async () => {
    vi.stubEnv("MCP_CONFD_PROTOCOL", "https");
    vi.stubEnv("MCP_CONFD_HOST", "localhost");
    vi.stubEnv("MCP_CONFD_PORT", "8888");
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

  it("fails when MCP_CONFD_PROTOCOL is invalid", async () => {
    vi.stubEnv("MCP_CONFD_PROTOCOL", "ftp");
    vi.stubEnv("MCP_CONFD_USER", "admin");
    vi.stubEnv("MCP_CONFD_PASSWORD", "admin");

    await expect(login({})).rejects.toThrow("MCP_CONFD_PROTOCOL must be http or https");
  });

  it("ignores TLS verification when MCP_CONFD_IGNORE_SSL_ERRORS is enabled", async () => {
    vi.stubEnv("MCP_CONFD_PROTOCOL", "https");
    vi.stubEnv("MCP_CONFD_HOST", "localhost");
    vi.stubEnv("MCP_CONFD_PORT", "8888");
    vi.stubEnv("MCP_CONFD_USER", "admin");
    vi.stubEnv("MCP_CONFD_PASSWORD", "admin");
    vi.stubEnv("MCP_CONFD_IGNORE_SSL_ERRORS", "true");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBeUndefined();
      expect(init && "dispatcher" in (init as RequestInit)).toBe(true);
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

  it("fails when credentials are missing in both params and env", async () => {
    vi.stubEnv("MCP_CONFD_USER", "");
    vi.stubEnv("MCP_CONFD_PASSWORD", "");
    await expect(login({})).rejects.toThrow(
      "login requires user, provide params.user or MCP_CONFD_USER",
    );
  });

  it("isolates session cookies by session key", () => {
    setSessionCookie("sessionid=defaultSess; Path=/; HttpOnly");
    setSessionCookie("sessionid=otherSess; Path=/; HttpOnly", "client-b");

    expect(getSessionCookie()).toBe("sessionid=defaultSess; Path=/; HttpOnly");
    expect(getSessionCookie("client-b")).toBe("sessionid=otherSess; Path=/; HttpOnly");

    setSessionCookie(null, "client-b");
    expect(getSessionCookie("client-b")).toBeNull();
    expect(getSessionCookie()).toBe("sessionid=defaultSess; Path=/; HttpOnly");
  });

});
