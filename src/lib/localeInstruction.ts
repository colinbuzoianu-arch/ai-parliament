import type { Locale } from "@/src/i18n/locale";

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "English",
  de: "German",
  fr: "French",
};

// Appended to every agent's and the aggregator's system prompt. Output language is driven
// by the visitor's selected UI locale, not by whatever language the case brief happens to be
// written in — always instructed explicitly (even for "en") so the model's output language
// is deterministic rather than following whatever it infers from the input text.
export function localeInstruction(locale: Locale | undefined): string {
  const lang = LANGUAGE_NAMES[locale ?? "en"];
  return (
    `\n\nLANGUAGE: Write all prose text in your response in ${lang}, regardless of what ` +
    `language the case brief or other agents' text is written in. Do not translate or repeat ` +
    `this instruction back — just write your actual content in ${lang}. JSON field names ` +
    `stay in English exactly as specified by the schema; only the natural-language values change.`
  );
}
