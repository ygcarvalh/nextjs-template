import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "@/features/auth/server/session-token";
import type { Session } from "@/features/auth/types";

const SECRET = "a-test-secret-that-is-at-least-32-characters";
const OTHER_SECRET = "a-different-secret-also-at-least-32-chars";

function sessionExpiringIn(milliseconds: number): Session {
  return {
    userId: "user_1",
    email: "demo@example.com",
    expiresAt: Date.now() + milliseconds,
  };
}

describe("session token", () => {
  it("round-trips a session", async () => {
    const session = sessionExpiringIn(60_000);

    const token = await signSessionToken(session, SECRET);

    await expect(verifySessionToken(token, SECRET)).resolves.toEqual(session);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSessionToken(sessionExpiringIn(60_000), OTHER_SECRET);

    await expect(verifySessionToken(token, SECRET)).resolves.toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const token = await signSessionToken(sessionExpiringIn(60_000), SECRET);
    const [, signature] = token.split(".");
    const forged = btoa(
      JSON.stringify({ userId: "admin", email: "a@b.co", expiresAt: Date.now() + 60_000 }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await expect(verifySessionToken(`${forged}.${signature}`, SECRET)).resolves.toBeNull();
  });

  it("rejects an expired session", async () => {
    const token = await signSessionToken(sessionExpiringIn(-1), SECRET);

    await expect(verifySessionToken(token, SECRET)).resolves.toBeNull();
  });

  it("treats the expiry boundary as expired", async () => {
    const expiresAt = Date.now() + 60_000;
    const token = await signSessionToken(
      { userId: "user_1", email: "demo@example.com", expiresAt },
      SECRET,
    );

    await expect(verifySessionToken(token, SECRET, expiresAt)).resolves.toBeNull();
  });

  it.each([
    ["empty", ""],
    ["no separator", "onlyonepart"],
    ["empty signature", "payload."],
    ["non-base64 signature", "payload.!!!!"],
    ["valid shape but nonsense", "abc.def"],
  ])("rejects a malformed token (%s)", async (_label, token) => {
    await expect(verifySessionToken(token, SECRET)).resolves.toBeNull();
  });

  it("rejects a correctly signed payload that is not a session", async () => {
    const payload = btoa(JSON.stringify({ nope: true }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signatureBytes = new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)),
    );
    let binary = "";
    for (const byte of signatureBytes) {
      binary += String.fromCharCode(byte);
    }
    const signature = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    await expect(verifySessionToken(`${payload}.${signature}`, SECRET)).resolves.toBeNull();
  });
});
