/**
 * Icelandic function words. Content words are no use here: an English sentence
 * about "Umhverfis-, orku- og loftslagsráðuneyti" is still English, and telling
 * a screen reader otherwise would make it unintelligible.
 */
const FUNCTION_WORDS = [
  "af", "að", "eða", "ekki", "en", "er", "eru", "fyrir", "hafa", "hefur",
  "hjá", "í", "með", "nema", "samkvæmt", "sem", "sinn", "sína", "skal",
  "til", "um", "var", "verið", "við", "yfir", "þá", "þar", "þess", "á",
  "ári", "árið", "og",
];

/**
 * English function words, for the other side of the comparison. Several
 * quotations are English sentences that list Icelandic organisation names, and
 * the `og` and `í` inside those names must not outvote the surrounding prose.
 */
const ENGLISH_WORDS = [
  "the", "of", "and", "that", "for", "is", "are", "with", "from", "this",
  "its", "an", "in", "on", "to", "by", "says", "said", "prints", "as",
  "under", "inside", "no", "not", "a",
];

function distinctHits(text: string, words: readonly string[]): number {
  const pattern = new RegExp(
    `(?<![\\p{L}-])(${words.join("|")})(?![\\p{L}-])`,
    "giu",
  );
  const hits = new Set<string>();
  for (const match of text.matchAll(pattern)) hits.add(match[1]!.toLowerCase());
  return hits.size;
}

/** How many distinct function words a text needs before it reads as Icelandic. */
const THRESHOLD = 2;

/**
 * `"is"` when a quotation is Icelandic prose, `undefined` when it is English
 * prose or a bare ledger row of names and figures.
 *
 * Pass the result straight to `lang` — React drops the attribute on
 * `undefined`, so an English sentence is never announced as Icelandic.
 */
export function icelandicLang(text: string): "is" | undefined {
  const icelandic = distinctHits(text, FUNCTION_WORDS);
  if (icelandic < THRESHOLD) return undefined;
  return icelandic > distinctHits(text, ENGLISH_WORDS) ? "is" : undefined;
}
