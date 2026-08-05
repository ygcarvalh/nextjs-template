import { describe, expect, it } from "vitest";
import { verifyCredentials } from "@/features/auth/server/credentials";

const VALID = { email: "demo@example.com", password: "demo-password" };

describe("verifyCredentials", () => {
  it("returns an identity for the seeded account", async () => {
    await expect(verifyCredentials(VALID)).resolves.toEqual({
      userId: "demo-user",
      email: "demo@example.com",
    });
  });

  it("ignores email casing", async () => {
    await expect(
      verifyCredentials({ ...VALID, email: "DEMO@Example.COM" }),
    ).resolves.not.toBeNull();
  });

  it("rejects a wrong password", async () => {
    await expect(verifyCredentials({ ...VALID, password: "wrong" })).resolves.toBeNull();
  });

  it("rejects an unknown email", async () => {
    await expect(verifyCredentials({ ...VALID, email: "someone@else.com" })).resolves.toBeNull();
  });

  it("rejects a password that is a prefix of the real one", async () => {
    await expect(verifyCredentials({ ...VALID, password: "demo" })).resolves.toBeNull();
  });
});
