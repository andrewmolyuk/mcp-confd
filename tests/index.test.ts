import { describe, it, expect } from "vitest";
import { ping } from "../src/index";

describe("index", () => {
  it("returns pong", () => {
    expect(ping()).toBe("pong");
  });
});
