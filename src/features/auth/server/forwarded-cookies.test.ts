import { describe, expect, it } from "vitest";
import { withCookie } from "@/features/auth/server/forwarded-cookies";

describe("withCookie", () => {
  it("replaces a cookie that is already there", () => {
    expect(withCookie("access=old; locale=pt-BR", "access", "new")).toBe(
      "locale=pt-BR; access=new",
    );
  });

  it("appends one that is missing", () => {
    expect(withCookie("locale=pt-BR", "access", "new")).toBe("locale=pt-BR; access=new");
  });

  it("handles a request that sent no cookies", () => {
    expect(withCookie(null, "access", "new")).toBe("access=new");
  });
});
