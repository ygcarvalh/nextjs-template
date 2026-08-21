import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/features/auth/server/safe-redirect";

describe("safeRedirectPath", () => {
  it.each(["/notes", "/notes?filter=recent", "/a/b/c#hash", "/"])("allows %s", (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  it.each([
    ["protocol-relative", "//evil.example"],
    ["backslash-smuggled", "/\\evil.example"],
    ["absolute http", "http://evil.example"],
    ["absolute https", "https://evil.example"],
    ["scheme-relative with credentials", "//user:pass@evil.example"],
    ["javascript scheme", "javascript:alert(1)"],
    ["data scheme", "data:text/html,<script>"],
    ["relative without leading slash", "notes"],
    ["newline injection", "/notes\nLocation: http://evil.example"],
    ["carriage return injection", "/notes\r\nSet-Cookie: a=b"],
    ["null byte", "/notes\u0000"],
    ["tab", "/notes\t"],
    ["empty", ""],
  ])("rejects %s", (_label, path) => {
    expect(safeRedirectPath(path)).toBe("/");
  });

  it.each([null, undefined, 42, {}, []])("rejects the non-string %s", (value) => {
    expect(safeRedirectPath(value)).toBe("/");
  });

  it("uses the supplied fallback", () => {
    expect(safeRedirectPath("//evil.example", "/notes")).toBe("/notes");
  });
});
