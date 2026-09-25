/**
 * 裏に回ったタブで飛ばされた View Transition を、React が「無視してよい中断」と読めるように言い直す。
 *
 * Chrome はタブが裏にある（document.hidden）と遷移を飛ばし、`transition.ready` を
 * InvalidStateError で reject する。React はこの種の拒否を握りつぶす一覧を持っているが
 * （react-dom の `customizeViewTransitionError`）、文言を**完全一致**で比べている。いまの Chrome は
 * "Transition was aborted because of invalid state. Document hidden" と末尾に理由を足して返すので
 * 一覧をすり抜け、エラーとして報告される —— dev では画面いっぱいのオーバーレイになる
 * （2026-09-25 に踏んだ。dev サーバがファイルの変更で画面を差し替えた瞬間、プレビューのタブが
 * 裏にあった。本番でも、裏のタブで遷移が走ればコンソールに同じエラーが出る）。
 *
 * 飛ばされたこと自体は正しい（誰も見ていない画面に動きは要らない）ので、挙動は変えない。
 * `ready` の拒否理由だけを React が知っている文言に揃える。React 側が前方一致に直したら外せる。
 */
const KNOWN = "Transition was aborted because of invalid state";
const MARK = Symbol.for("miroku.viewTransitionGuard");

type Guarded = Document & { [MARK]?: true };

export function installViewTransitionGuard(doc: Document = document): void {
  if (typeof doc.startViewTransition !== "function") return;
  const guarded = doc as Guarded;
  /* StrictMode は effect を二度走らせる。二重に包むと ready を二度言い直すだけだが、包みが積もる。 */
  if (guarded[MARK]) return;
  guarded[MARK] = true;

  const native = doc.startViewTransition.bind(doc);

  doc.startViewTransition = ((options?: Parameters<typeof native>[0]) => {
    const transition = native(options);
    const ready = transition.ready.catch((error: unknown) => {
      if (
        error instanceof DOMException &&
        error.name === "InvalidStateError" &&
        error.message.startsWith(KNOWN) &&
        error.message !== KNOWN
      ) {
        throw new DOMException(KNOWN, "InvalidStateError");
      }
      throw error;
    });

    /* React は同じ物を `document.__reactViewTransition` に置いて見比べるので、
       作り直さず Proxy で ready だけ差し替える（skipTransition / finished は本物のまま）。 */
    return new Proxy(transition, {
      get(target, prop) {
        if (prop === "ready") return ready;
        const value = Reflect.get(target, prop, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  }) as typeof doc.startViewTransition;
}
