import { INITIAL_VIEW, MAX_ZOOM, MIN_ZOOM, clampPan, clampZoom, zoomAround, type Box } from "@/lib/pan-zoom";

const stage: Box = { left: 100, top: 50, width: 800, height: 600 };

/** 画面上の点 c に映っている画像上の位置（原点は舞台の中央）。 */
function imagePointAt(view: { zoom: number; x: number; y: number }, clientX: number, clientY: number) {
  const cx = clientX - stage.left - stage.width / 2;
  const cy = clientY - stage.top - stage.height / 2;
  return { x: (cx - view.x) / view.zoom, y: (cy - view.y) / view.zoom };
}

describe("clampZoom", () => {
  it("1〜4 倍に収める", () => {
    expect(clampZoom(0.2)).toBe(MIN_ZOOM);
    expect(clampZoom(2.5)).toBe(2.5);
    expect(clampZoom(10)).toBe(MAX_ZOOM);
  });
});

describe("clampPan", () => {
  it("等倍では動かさない", () => {
    expect(clampPan({ x: 120, y: -40 }, 1, stage)).toEqual({ x: 0, y: 0 });
  });

  it("拡大して増えたぶんの半分までしか動かさない", () => {
    // 2 倍: 横に 800px 増える → ±400px まで
    expect(clampPan({ x: 1000, y: -1000 }, 2, stage)).toEqual({ x: 400, y: -300 });
    expect(clampPan({ x: 120, y: -40 }, 2, stage)).toEqual({ x: 120, y: -40 });
  });

  it("矩形が取れないときは中央に戻す", () => {
    expect(clampPan({ x: 10, y: 10 }, 2, null)).toEqual({ x: 0, y: 0 });
  });
});

describe("zoomAround", () => {
  it("掴んだ点が同じ場所に残る", () => {
    const clientX = 300;
    const clientY = 200;
    const before = imagePointAt(INITIAL_VIEW, clientX, clientY);
    const after = zoomAround(INITIAL_VIEW, 2, stage, clientX, clientY);
    const moved = imagePointAt(after, clientX, clientY);
    expect(after.zoom).toBe(2);
    expect(moved.x).toBeCloseTo(before.x);
    expect(moved.y).toBeCloseTo(before.y);
  });

  it("点を省くと中央を軸にする", () => {
    expect(zoomAround(INITIAL_VIEW, 3, stage)).toEqual({ zoom: 3, x: 0, y: 0 });
  });

  it("等倍まで戻すと位置も中央に戻る", () => {
    const zoomed = zoomAround(INITIAL_VIEW, 3, stage, 200, 100);
    expect(zoomAround(zoomed, 0.5, stage, 200, 100)).toEqual(INITIAL_VIEW);
  });

  it("上限を越えない", () => {
    expect(zoomAround(INITIAL_VIEW, 99, stage).zoom).toBe(MAX_ZOOM);
  });

  it("引数の view を書き換えない（state の updater の中で呼ぶため）", () => {
    const view = { zoom: 2, x: 30, y: 10 };
    zoomAround(view, 3, stage, 400, 300);
    expect(view).toEqual({ zoom: 2, x: 30, y: 10 });
  });
});
