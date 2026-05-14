import { afterEach, vi } from "vitest";
import { setSessionCookie } from "../src/tools/login";

export function setupTestIsolation(): void {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    setSessionCookie(null);
  });
}
