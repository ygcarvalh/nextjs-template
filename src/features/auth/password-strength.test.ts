import { describe, expect, it } from "vitest";
import { passwordStrength } from "@/features/auth/password-strength";

describe("passwordStrength", () => {
  it("rates an untouched box as nothing at all", () => {
    expect(passwordStrength("")).toBe("empty");
  });

  it("rates anything under the API floor weak", () => {
    expect(passwordStrength("Sh0rt!")).toBe("weak");
  });

  it("rates one repeated character weak however long it runs", () => {
    expect(passwordStrength("aaaaaaaaaaaaaaaa")).toBe("weak");
  });

  it("rates a single class weak however long it runs", () => {
    expect(passwordStrength("khtqmwbrvzsp")).toBe("weak");
  });

  it("rates a straight run weak even when a capital lifts it off one class", () => {
    expect(passwordStrength("Abcdefghijkl")).toBe("weak");
  });

  it("rates a run counted backwards weak too", () => {
    expect(passwordStrength("Zyxwvutsrqpo")).toBe("weak");
  });

  it("rates a password that clears the floor on two classes fair", () => {
    expect(passwordStrength("marmalade42")).toBe("fair");
  });

  it("rates three classes fair while the password stays short of the long mark", () => {
    expect(passwordStrength("Marmalade4")).toBe("fair");
  });

  it("rates a long password on three classes strong", () => {
    expect(passwordStrength("Marmalade4Toast")).toBe("strong");
  });

  it("counts symbols as a class of their own", () => {
    expect(passwordStrength("marmalade-toast!")).toBe("strong");
  });
});
