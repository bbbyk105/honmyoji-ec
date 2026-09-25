import { installViewTransitionGuard } from "@/components/motion/view-transition-guard";

/** jsdom には startViewTransition が無いので、Chrome が返す形を真似た偽物を置く。 */
function fakeDocument(readyError: unknown) {
  const calls: unknown[] = [];
  const skip = jest.fn();
  const doc = {
    startViewTransition(options?: unknown) {
      calls.push(options);
      const ready = readyError ? Promise.reject(readyError) : Promise.resolve();
      return {
        ready,
        finished: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: skip,
      };
    },
  } as unknown as Document;
  return { doc, calls, skip };
}

const HIDDEN = new DOMException(
  "Transition was aborted because of invalid state. Document hidden",
  "InvalidStateError",
);

describe("installViewTransitionGuard", () => {
  it("裏のタブで飛ばされた拒否を、React が無視する文言に揃える", async () => {
    const { doc } = fakeDocument(HIDDEN);
    installViewTransitionGuard(doc);

    await expect(doc.startViewTransition().ready).rejects.toMatchObject({
      name: "InvalidStateError",
      message: "Transition was aborted because of invalid state",
    });
  });

  it("それ以外の拒否はそのまま通す", async () => {
    const other = new DOMException("Something else", "AbortError");
    const { doc } = fakeDocument(other);
    installViewTransitionGuard(doc);

    await expect(doc.startViewTransition().ready).rejects.toBe(other);
  });

  it("ready 以外は本物のまま（skipTransition は元の transition に届く）", async () => {
    const { doc, calls, skip } = fakeDocument(null);
    installViewTransitionGuard(doc);

    const update = () => {};
    const transition = doc.startViewTransition(update);
    await expect(transition.ready).resolves.toBeUndefined();
    transition.skipTransition();

    expect(calls).toEqual([update]);
    expect(skip).toHaveBeenCalledTimes(1);
  });

  it("二度呼んでも二重に包まない", async () => {
    const { doc, calls } = fakeDocument(HIDDEN);
    installViewTransitionGuard(doc);
    const once = doc.startViewTransition;
    installViewTransitionGuard(doc);

    expect(doc.startViewTransition).toBe(once);
    await expect(doc.startViewTransition().ready).rejects.toThrow();
    expect(calls).toHaveLength(1);
  });

  it("startViewTransition の無いブラウザでは何もしない", () => {
    const doc = {} as Document;
    expect(() => installViewTransitionGuard(doc)).not.toThrow();
    expect(doc.startViewTransition).toBeUndefined();
  });
});
