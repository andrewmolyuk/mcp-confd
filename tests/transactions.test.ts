import { describe, expect, it, vi } from "vitest";
import { deleteTrans } from "../src/tools/deleteTrans";
import { getModulePrefixMap } from "../src/tools/getModulePrefixMap";
import { query } from "../src/tools/query";
import { getSchema } from "../src/tools/getSchema";
import { getTrans } from "../src/tools/getTrans";
import { setSessionCookie } from "../src/tools/login";
import { newTrans } from "../src/tools/newTrans";
import { setupTestIsolation } from "./testSetup";

describe("transactions and schema", () => {
  setupTestIsolation();

  it("returns open transactions from get_trans", async () => {
    setSessionCookie("sessionid=sess123; Path=/; HttpOnly");

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            trans: [{ db: "running", mode: "read_write", conf_mode: "private", tag: "", th: 2 }],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await getTrans();

    expect(result.trans).toHaveLength(1);
    expect(result.trans[0]).toMatchObject({ db: "running", mode: "read_write", th: 2 });
  });

  it("gets module prefix map via get_module_prefix_map", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            module_prefix_map: [
              {
                module: "ietf-interfaces",
                prefix: "if",
                namespace: "urn:ietf:params:xml:ns:yang:ietf-interfaces",
              },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await getModulePrefixMap();

    expect(result.module_prefix_map).toHaveLength(1);
    expect(result.module_prefix_map[0]).toEqual({
      module: "ietf-interfaces",
      prefix: "if",
      namespace: "urn:ietf:params:xml:ns:yang:ietf-interfaces",
    });
  });

  it("runs query via query method", async () => {
    setSessionCookie("sessionid=sess123; Path=/; HttpOnly");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            current_position: 2,
            total_number_of_results: 4,
            number_of_results: 2,
            number_of_elements_per_result: 2,
            result: [["foo", "bar"]],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await query({
      th: 1,
      xpath_expr: "/dhcp:dhcp/dhcp:foo",
      result_as: "keypath-value",
      chunk_size: 2,
    });

    expect(result).toMatchObject({
      current_position: 2,
      total_number_of_results: 4,
      number_of_results: 2,
    });

    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.method).toBe("query");
    expect(body.params).toMatchObject({
      th: 1,
      xpath_expr: "/dhcp:dhcp/dhcp:foo",
      result_as: "keypath-value",
      chunk_size: 2,
    });
  });

  it("fails query when no active session", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(query({ th: 1, xpath_expr: "/dhcp:dhcp/dhcp:foo" })).rejects.toThrow(
      "query requires an active session, call login first",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails query when neither xpath_expr nor path is provided", async () => {
    setSessionCookie("sessionid=sess123; Path=/; HttpOnly");

    await expect(query({ th: 1 })).rejects.toThrow(
      "query requires either xpath_expr or path",
    );
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

  it("gets schema via get_schema", async () => {
    setSessionCookie("sessionid=sess123; Path=/; HttpOnly");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            meta: { namespace: "http://example.com/ns" },
            data: { root: { type: "container" } },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await getSchema({ th: 2, path: "/dhcp:dhcp", levels: 1 });

    expect(result).toMatchObject({
      meta: { namespace: "http://example.com/ns" },
      data: { root: { type: "container" } },
    });

    const request = fetchSpy.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(request.body as string);
    expect(body.method).toBe("get_schema");
    expect(body.params).toMatchObject({ th: 2, path: "/dhcp:dhcp", levels: 1 });
  });

  it("fails get_schema when no active session", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(getSchema({ th: 2, path: "/dhcp:dhcp" })).rejects.toThrow(
      "get_schema requires an active session, call login first",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails get_schema when neither namespace nor path is provided", async () => {
    setSessionCookie("sessionid=sess123; Path=/; HttpOnly");

    await expect(getSchema({ th: 2 })).rejects.toThrow(
      "get_schema requires either namespace or path",
    );
  });
});
