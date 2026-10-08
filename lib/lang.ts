/* ------------------------------------------------------------------
   お客さまの言語。注文の確認メールと、決済のあとの画面を日本語にするか英語にするか。

   決め方はブラウザの言語設定の一番目だけ。日本語なら日本語、それ以外は全部英語
   （サイトの主の言語）。Chrome・Edge・Firefox・Safari（Mac / iPhone）・Android の
   ブラウザはどれも、同じ設定から Accept-Language と `navigator.languages` を作る。

   カート（MiniCart）は作り置きのページに載るのでサーバーでは決められず、ブラウザで
   `navigator.languages` から決める（`hooks/useBrowserLang.ts`）。決済のフォームがその
   言語を送り、startCheckout はそれを優先する（無ければ Accept-Language）。決めた言語は
   Stripe の決済画面（locale）と決済の metadata に残し、Webhook と thank-you はそれを
   読む —— あとから判定し直すと、カート・決済画面・メールで言語が食い違うことがある。
   ------------------------------------------------------------------ */

export type Lang = "ja" | "en";

export function isLang(value: unknown): value is Lang {
  return value === "ja" || value === "en";
}

/** 言語タグ一つ（`ja-JP`）が日本語か。`jam`（ジャマイカ・クレオール）などを取り違えない。 */
function isJapaneseTag(tag: string): boolean {
  const t = tag.trim().toLowerCase();
  return t === "ja" || t.startsWith("ja-");
}

/**
 * ブラウザの `navigator.languages`（一番目が最優先）→ 言語。カートが自分の表示に使う。
 * 決まりは Accept-Language と同じ（ブラウザは同じ設定から両方を作る）。
 */
export function langFromLanguages(languages: readonly string[] | null | undefined): Lang {
  const first = languages?.[0];
  return first && isJapaneseTag(first) ? "ja" : "en";
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
  return isJapaneseTag(ranked[0]?.tag ?? "") ? "ja" : "en";
}
