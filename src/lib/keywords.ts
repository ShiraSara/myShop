/**
 * Lightweight Hebrew/English keyword extraction used by search and by the
 * rule-based request matching engine. Deliberately simple and dependency-free;
 * the matching engine interface allows replacing this with embeddings / AI later.
 */

const STOPWORDS = new Set([
  // Hebrew function words & request phrasing
  "מחפש", "מחפשת", "מחפשים", "מחפשות", "צריך", "צריכה", "רוצה", "רוצים", "מעוניין", "מעוניינת", "אשמח", "לקנות",
  "עד", "של", "את", "עם", "על", "או", "גם", "לא", "כן", "יש", "אין", "בן", "בת", "שנים", "שנה", "גיל", "בגיל",
  "זה", "זו", "הוא", "היא", "אני", "אנחנו", "כל", "רק", "מאוד", "הכי", "אחד", "אחת", "שני", "שתי", "עבור", "בשביל",
  "באזור", "אזור", "האזור", "בסביבת", "סביבה", "ליד", "קרוב", "בערך", "כמו", "מצב", "במצב", "טוב", "טובה", "חדש",
  "חדשה", "משומש", "משומשת", "יד", "שנייה", "שקל", "שקלים", "שח", "ש\"ח", "ש״ח", "ils", "nis", "כולל", "משלוח",
  "מרכז", "המרכז", "צפון", "הצפון", "דרום", "הדרום", "שרון", "השרון", "שפלה", "השפלה", "בתל", "תל", "אביב",
  "פלוס", "מינוס", "וגם", "אבל", "כי", "אם", "מה", "מי", "איפה", "שלי", "שלו", "שלה", "לי", "לו", "לה", "בלי",
  // English
  "the", "a", "an", "for", "and", "or", "of", "with", "to", "in", "on", "looking", "want", "need", "new", "used",
]);

const HEB_PREFIXES = ["ו", "ה", "ב", "ל", "מ", "ש", "כ"];
const HEB_SUFFIXES = ["יים", "ים", "ות", "יות"];

export function normalizeText(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[֑-ׇ]/g, "") // niqqud & cantillation
    .replace(/[״"׳']/g, "")
    .toLowerCase();
}

export function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(/[^a-z0-9א-ת]+/)
    .filter(Boolean);
}

/** Variants of a token: itself, without one prefix letter, without plural suffix. */
export function tokenVariants(token: string): string[] {
  const out = new Set<string>([token]);
  const isHebrew = /[א-ת]/.test(token);
  if (isHebrew) {
    const bases = [token];
    if (token.length >= 4 && HEB_PREFIXES.includes(token[0])) bases.push(token.slice(1));
    // e.g. "ולילד" → "לילד" → "ילד"
    if (token.length >= 5 && HEB_PREFIXES.includes(token[0]) && HEB_PREFIXES.includes(token[1])) bases.push(token.slice(2));
    for (const b of bases) {
      out.add(b);
      for (const suf of HEB_SUFFIXES) {
        if (b.length - suf.length >= 2 && b.endsWith(suf)) out.add(b.slice(0, -suf.length));
      }
      if (b.length >= 4 && b.endsWith("י")) out.add(b.slice(0, -1)); // "אופני" ~ "אופן"
    }
  } else if (token.length > 3 && token.endsWith("s")) {
    out.add(token.slice(0, -1));
  }
  return [...out];
}

/** Meaningful keywords (deduplicated, no stopwords, no pure numbers). */
export function extractKeywords(input: string, limit = 12): string[] {
  const seen = new Set<string>();
  for (const t of tokenize(input)) {
    if (t.length < 2 || STOPWORDS.has(t) || /^\d+$/.test(t)) continue;
    // Drop stopwords hidden behind a prefix ("באזור" handled, "והמרכז" etc.)
    if (tokenVariants(t).some((v) => STOPWORDS.has(v) && v.length > 2)) continue;
    seen.add(t);
    if (seen.size >= limit) break;
  }
  return [...seen];
}

/** True when two tokens refer to the same word (prefix / plural tolerant). */
export function tokensMatch(a: string, b: string) {
  const va = tokenVariants(a);
  const vb = tokenVariants(b);
  for (const x of va) {
    for (const y of vb) {
      if (x === y) return true;
      if (x.length >= 3 && y.length >= 3) {
        const [short, long] = x.length <= y.length ? [x, y] : [y, x];
        if (long.startsWith(short) && long.length - short.length <= 2) return true;
      }
    }
  }
  return false;
}

/** Parses a budget like "עד 500 ש״ח" / "500₪" from free text. */
export function extractBudget(input: string): number | null {
  const m = normalizeText(input).match(/(?:עד|מקסימום|תקציב(?: של)?)\s*(\d[\d,]*)/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}
