const ALIAS_PATTERN = /^[\p{L}\p{N} _-]+$/u;

export function normalizeAlias(alias: string): string {
  return alias.normalize("NFKC").trim().toLocaleLowerCase("de-AT");
}

export function validateAlias(alias: string): string | null {
  if (alias !== alias.trim())
    return "Der Alias darf keine führenden oder abschließenden Leerzeichen enthalten.";
  const normalized = alias.normalize("NFKC");
  if (Array.from(normalized).length < 3 || Array.from(normalized).length > 30)
    return "Der Alias muss 3 bis 30 Zeichen lang sein.";
  if (!ALIAS_PATTERN.test(normalized))
    return "Der Alias enthält nicht erlaubte Zeichen.";
  return null;
}

export function normalizeEmail(email: string): string {
  return email.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}
