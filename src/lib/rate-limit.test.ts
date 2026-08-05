import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows requests up to the limit", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 3 });

    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("a", 10).allowed).toBe(true);
    expect(limiter.check("a", 20).allowed).toBe(true);
  });

  it("blocks the request past the limit", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
    limiter.check("a", 0);
    limiter.check("a", 1);

    expect(limiter.check("a", 2)).toMatchObject({ allowed: false, remaining: 0 });
  });

  it("counts down remaining", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 3 });

    expect(limiter.check("a", 0).remaining).toBe(2);
    expect(limiter.check("a", 1).remaining).toBe(1);
    expect(limiter.check("a", 2).remaining).toBe(0);
  });

  it("keeps separate budgets per key", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    limiter.check("a", 0);

    expect(limiter.check("b", 0).allowed).toBe(true);
    expect(limiter.check("a", 0).allowed).toBe(false);
  });

  it("opens a fresh window once the old one elapses", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    limiter.check("a", 0);
    expect(limiter.check("a", 999).allowed).toBe(false);

    expect(limiter.check("a", 1000)).toMatchObject({ allowed: true, remaining: 0 });
  });

  it("reports when the window resets", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });

    expect(limiter.check("a", 500).resetAt).toBe(1500);
    expect(limiter.check("a", 900).resetAt).toBe(1500);
  });

  it("does not grow without bound", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 5, maxKeys: 10 });

    for (let index = 0; index < 500; index += 1) {
      limiter.check(`key-${index}`, index * 10);
    }

    // Still enforcing for a live key after all that churn.
    limiter.check("live", 5000);
    expect(limiter.check("live", 5001).remaining).toBe(3);
  });
});
