/* ------------------------------------------------------------------
   お問い合わせのうち、営業・売り込みらしいものを見分ける（純粋。テストで直に叩く）。

   **見分けるだけで、捨てない**。お店へのメールの件名に印を付け、Gmail のフィルタで別の
   ラベルへ振り分けてもらう。海外のお店からの卸の相談のような本物の商談も「弊社」と書くので、
   捨てると取りこぼす。人が手で送る営業は Turnstile では止まらないので、ここで受信箱から外す。

   語は「お客さまがバッグについて書くときにまず使わない言葉」だけにする。「営業」単体は
   「営業時間」と書くお客さまがいるので入れない。「ご担当者様」「御社」「貴社」は、丁寧に書く
   日本のお客さまも使うので入れない（売り込みはまず「弊社」と名乗る）。英語も、サイトを褒める・
   作り手に尋ねる・訪問を相談する言い回し（website design・outsource・more traffic）に当たらない形にする。

   正規表現は空白の繰り返しを二つ並べない（`\s+` の直後に `\s*` など）。本文は 5,000 字まで来るので、
   区切りが曖昧だと計算量が 2 乗になり、Workers の CPU 10ms を超える。
   ------------------------------------------------------------------ */

/** 和文の語（全角・半角の違いは NFKC で揃えてから見る）。 */
const JA_WORDS = [
  "弊社",
  "業務提携",
  "集客",
  "営業代行",
  "広告運用",
  "ホームページ制作",
  "Web制作",
  "ウェブ制作",
  "補助金",
];
const JA_TERMS = JA_WORDS.map((label) => ({ label, needle: label.normalize("NFKC").toLowerCase() }));

/**
 * 略語は大文字で書かれたときだけ、本文だけで見る（韓国の姓 Seo〈서〉のお客さまを取り違えない。
 * 名前の欄はパスポートの書き方で「SEO Jiwoo」と大文字で入れる人がいる）。小文字の「seo」は、
 * 売り込みの決まり文句と組になったときだけ下の EN_TERMS で拾う。
 */
const CASED_TERMS: { label: string; pattern: RegExp }[] = [
  { label: "SEO", pattern: /\bSEO\b/ },
  { label: "MEO", pattern: /\bMEO\b/ },
];

/**
 * 英語の語（小文字にしてから見る）。語の切れ目で見る。「our agency」「digital marketing」の
 * ような、旅行会社やその仕事をしているお客さまも書く言い回しは入れない。
 */
const EN_TERMS: { label: string; pattern: RegExp }[] = [
  { label: "SEO", pattern: /\bseo\s+(?:services?|agency|experts?|optimi[sz]ation|packages?|audit)\b/ },
  { label: "backlinks", pattern: /\bback-?links?\b/ },
  { label: "guest post", pattern: /\bguest\s+post/ },
  { label: "web design", pattern: /\b(?:web|website)\s+(?:design|development)\s+(?:services?|agency|company|packages?)\b/ },
  { label: "web design", pattern: /\b(?:website\s+redesign|redesign\s+your\s+(?:website|site))\b/ },
  { label: "Google ranking", pattern: /\b(?:first\s+page\s+of\s+google|rank(?:ing)?\s+(?:higher\s+)?on\s+google)\b/ },
  { label: "traffic", pattern: /\b(?:increase\s+(?:your\s+)?(?:website\s+)?traffic|website\s+traffic|more\s+traffic\s+to\s+your)\b/ },
  { label: "lead generation", pattern: /\blead\s+generation\b/ },
  { label: "virtual assistant", pattern: /\bvirtual\s+assistant/ },
];

/**
 * 営業らしさの手がかりになった語を返す（無ければ空）。和文の語は名前と本文の両方、英語の語と
 * 略語は本文だけで見る。
 */
export function salesSignals(name: string, message: string): string[] {
  const body = message.normalize("NFKC");
  const lowerBody = body.toLowerCase();
  const lowerAll = `${name.normalize("NFKC").toLowerCase()}\n${lowerBody}`;
  const found = JA_TERMS.filter((term) => lowerAll.includes(term.needle)).map((term) => term.label);
  for (const { label, pattern } of CASED_TERMS) if (pattern.test(body)) found.push(label);
  for (const { label, pattern } of EN_TERMS) if (pattern.test(lowerBody)) found.push(label);
  return [...new Set(found)];
}
