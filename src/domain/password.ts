export const MIN_PASSWORD_LENGTH = 4;
export const MAX_PASSWORD_LENGTH = 256;

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

export function passwordCharacterCount(password: string): number {
  return Array.from(graphemeSegmenter.segment(password)).length;
}

export function validatePassword(password: string): string | null {
  const characterCount = passwordCharacterCount(password);
  if (characterCount < MIN_PASSWORD_LENGTH) {
    return `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`;
  }
  if (characterCount > MAX_PASSWORD_LENGTH) {
    return `Das Passwort darf höchstens ${MAX_PASSWORD_LENGTH} Zeichen lang sein.`;
  }
  return null;
}
