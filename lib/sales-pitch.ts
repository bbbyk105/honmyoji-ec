/* ------------------------------------------------------------------
   お問い合わせのうち、営業・売り込みらしいものを見分ける（純粋。テストで直に叩く）。

   **見分けるだけで、捨てない**。お店へのメールの件名に印を付け、Gmail のフィルタで別の
   ラベルへ振り分けてもらう。海外のお店からの卸の相談のような本物の商談も「弊社」と書くので、
   捨てると取りこぼす。人が手で送る営業は Turnstile では止まらないので、ここで受信箱から外す。

   語は「お客さまがバッグについて書くときにまず使わない言葉」だけにする。「営業」単体は
   「営業時間」と書くお客さまがいるので入れない。
   ------------------------------------------------------------------ */

/** 和文の語（全角・半角の違いは NFKC で揃えてから見る）。 */
const JA_TERMS = [
  "弊社",
  "御社",
  "貴社",
  "ご担当者様",
  "ご担当者さま",
  "ご担当者各位",
  "業務提携",
  "集客",
  "営業代行",
  "広告運用",
  "ホームページ制作",
  "Web制作",
  "ウェブ制作",
  "補助金",
];

/** 英語の語。語の切れ目で見る（"seo" が "Seoul" に当たらないように）。 */
const EN_TERMS: { label: string; pattern: RegExp }[] = [
  { label: "SEO", pattern: /\bseo\b/ },
  { label: "MEO", pattern: /\bmeo\b/ },
  { label: "backlinks", pattern: /\bback-?links?\b/ },
  { label: "guest post", pattern: /\bguest\s+post/ },
  { label: "web design", pattern: /\b(?:web|website)\s+(?:design|development|redesign)/ },
  { label: "Google ranking", pattern: /\b(?:first\s+page\s+of\s+google|rank(?:ing)?\s+(?:higher\s+)?on\s+google)\b/ },
  { label: "traffic", pattern: /\b(?:more|increase\s+(?:your\s+)?|website)\s*traffic\b/ },
  { label: "lead generation", pattern: /\blead\s+generation\b/ },
  { label: "digital marketing", pattern: /\bdigital\s+marketing\b/ },
  { label: "marketing agency", pattern: /\b(?:marketing|our)\s+agency\b/ },
  { label: "outsourcing", pattern: /\boutsourc/ },
  { label: "virtual assistant", pattern: /\bvirtual\s+assistant/ },
];

/** 営業らしさの手がかりになった語を返す（無ければ空）。名前と本文を合わせて見る。 */
export function salesSignals(...texts: string[]): string[] {
  const lower = texts.join("\n").normalize("NFKC").toLowerCase();
  const found = JA_TERMS.filter((term) => lower.includes(term.normalize("NFKC").toLowerCase()));
  for (const { label, pattern } of EN_TERMS) {
    if (pattern.test(lower)) found.push(label);
  }
  return found;
}
