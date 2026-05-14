import { describe, expect, it, vi } from "vitest";
import { getSessionCookie, login, setSessionCookie } from "../src/tools/login";
import { logout } from "../src/tools/logout";
import { setupTestIsolation } from "./testSetup";

describe("auth and session", () => {
  setupTestIsolation();

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

  it("isolates session cookies by session key", () => {
    setSessionCookie("sessionid=defaultSess; Path=/; HttpOnly");
    setSessionCookie("sessionid=otherSess; Path=/; HttpOnly", "client-b");

    expect(getSessionCookie()).toBe("sessionid=defaultSess; Path=/; HttpOnly");
    expect(getSessionCookie("client-b")).toBe("sessionid=otherSess; Path=/; HttpOnly");

    setSessionCookie(null, "client-b");
    expect(getSessionCookie("client-b")).toBeNull();
    expect(getSessionCookie()).toBe("sessionid=defaultSess; Path=/; HttpOnly");
  });

  it("fails when credentials are missing in both params and env", async () => {
    vi.stubEnv("MCP_CONFD_USER", "");
    vi.stubEnv("MCP_CONFD_PASSWORD", "");
    await expect(login({})).rejects.toThrow(
      "login requires user, provide params.user or MCP_CONFD_USER",
    );
  });
});
