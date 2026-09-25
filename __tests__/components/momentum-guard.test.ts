import { MOMENTUM_GAP_MS, MOMENTUM_MAX_MS, createMomentumGuard } from "@/components/motion/momentum-guard";

/** 時計を手で進める。wheel は 16ms おき（トラックパッドの慣性と同じ間隔）。 */
function setup() {
  let t = 1000;
  const guard = createMomentumGuard(() => t);
  const wheelFor = (ms: number) => {
    const swallowed: boolean[] = [];
    for (let end = t + ms; t < end; t += 16) swallowed.push(guard.onWheel());
    return swallowed;
  };
  return { guard, wheelFor, wait: (ms: number) => (t += ms) };
}

describe("createMomentumGuard", () => {
  it("遷移の前は何も捨てない", () => {
    const { wheelFor } = setup();
    expect(wheelFor(300).every((s) => !s)).toBe(true);
  });

  it("慣性が流れている最中に遷移したら、続きの wheel を捨てる", () => {
    const { guard, wheelFor } = setup();
    wheelFor(200);
    guard.arm();
    expect(wheelFor(600).every(Boolean)).toBe(true);
  });

  it("wheel が途切れたら、その次の wheel は新しい手の動きとして通す", () => {
    const { guard, wheelFor, wait } = setup();
    wheelFor(200);
    guard.arm();
    wheelFor(300);
    wait(MOMENTUM_GAP_MS + 10);
    expect(wheelFor(100).some(Boolean)).toBe(false);
  });

  it("止まっているときの遷移では何もしない", () => {
    const { guard, wheelFor, wait } = setup();
    wheelFor(200);
    wait(MOMENTUM_GAP_MS + 10);
    guard.arm();
    expect(wheelFor(200).some(Boolean)).toBe(false);
  });

  it("慣性が途切れなくても上限で止める", () => {
    const { guard, wheelFor } = setup();
    wheelFor(200);
    guard.arm();
    const swallowed = wheelFor(MOMENTUM_MAX_MS + 400);
    expect(swallowed.at(-1)).toBe(false);
  });
});
