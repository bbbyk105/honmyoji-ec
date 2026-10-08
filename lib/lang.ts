/* ------------------------------------------------------------------
   お客さまの言語。注文の確認メールと、決済のあとの画面を日本語にするか英語にするか。

   決め方はブラウザの言語設定（Accept-Language）の一番目だけ。日本語なら日本語、
   それ以外は全部英語（サイトの主の言語）。決済を始めるときに一度だけ決めて Stripe の
   決済の metadata に残し、Webhook と thank-you はそれを読む —— あとから判定し直すと、
   決済画面とメールで言語が食い違うことがある。
   ------------------------------------------------------------------ */

export type Lang = "ja" | "en";

export function isLang(value: unknown): value is Lang {
  return value === "ja" || value === "en";
}

/** `ja-JP,ja;q=0.9,en-US;q=0.8` → "ja"。無い・読めないときは "en"。 */
export function langFromAcceptLanguage(header: string | null | undefined): Lang {
  if (!header) return "en";
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number(q.slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((entry) => entry.tag && entry.weight > 0)
    // 重みが同じなら書かれた順
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  const first = ranked[0]?.tag ?? "";
  return first === "ja" || first.startsWith("ja-") ? "ja" : "en";
}
