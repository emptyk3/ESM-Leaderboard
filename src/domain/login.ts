import { normalizeAlias, normalizeEmail } from "./identity";

export type LoginIdentifier =
  { kind: "email"; normalized: string } | { kind: "alias"; normalized: string };

export function parseLoginIdentifier(value: string): LoginIdentifier {
  return value.includes("@")
    ? { kind: "email", normalized: normalizeEmail(value) }
    : { kind: "alias", normalized: normalizeAlias(value) };
}
