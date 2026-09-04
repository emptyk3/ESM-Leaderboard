import { describe, expect, it } from "vitest";
import { parseLoginIdentifier } from "./login";

describe("Login-Auswahl", () => {
  it("erkennt und normalisiert E-Mail-Adressen", () => {
    expect(parseLoginIdentifier(" USER@Example.at ")).toEqual({
      kind: "email",
      normalized: "user@example.at",
    });
  });
  it("behandelt andere Eingaben als Alias", () => {
    expect(parseLoginIdentifier("  MÍCHI_92 ")).toEqual({
      kind: "alias",
      normalized: "míchi_92",
    });
  });
});
