/* ------------------------------------------------------------------
   写真のビューアの倍率と位置の計算。React にも DOM にも触らない。
   `LightboxViewer` が state の updater の中から呼ぶので、**純粋に保つこと**
   （React は開発時に updater を二度走らせる。副作用があると二重に効く —— 実際に踏んだ）。
   ------------------------------------------------------------------ */

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

/** 倍率と位置。一つにまとめて持つ（別々の state にすると updater の中から互いを呼ぶことになる）。 */
export type View = { zoom: number; x: number; y: number };

/** 舞台の矩形。`DOMRect` をそのまま渡せる。 */
export type Box = { left: number; top: number; width: number; height: number };

export const INITIAL_VIEW: View = { zoom: 1, x: 0, y: 0 };

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/**
 * 拡大して増えたぶんの半分までしか動かさない。これが無いと、少し払っただけで
 * 写真が画面の外へ出ていき、戻し方が分からなくなる。
 */
export function clampPan(
  pan: { x: number; y: number },
  zoom: number,
  rect: Pick<Box, "width" | "height"> | null,
): { x: number; y: number } {
  if (!rect || zoom <= MIN_ZOOM) return { x: 0, y: 0 };
  const maxX = (rect.width * (zoom - 1)) / 2;
  const maxY = (rect.height * (zoom - 1)) / 2;
  return {
    x: Math.max(-maxX, Math.min(maxX, pan.x)),
    y: Math.max(-maxY, Math.min(maxY, pan.y)),
  };
}

/**
 * ある一点を掴んだまま倍率を変える。
 *
 * 変換は `translate(pan) scale(zoom)`（原点は中央）なので、画面上の点 c に
 * 映っている画像の位置は `(c - pan) / zoom`。倍率を変えても同じ位置が c に
 * 残るよう pan を引き直す。中心固定で拡大すると、見たい場所が画面外へ逃げる。
 * 点を省くと舞台の中央。
 */
export function zoomAround(view: View, next: number, rect: Box | null, clientX?: number, clientY?: number): View {
  const target = clampZoom(next);
  if (target <= MIN_ZOOM || !rect) return { zoom: target, x: 0, y: 0 };

  const cx = (clientX ?? rect.left + rect.width / 2) - rect.left - rect.width / 2;
  const cy = (clientY ?? rect.top + rect.height / 2) - rect.top - rect.height / 2;
  const ratio = target / view.zoom;
  const p = clampPan({ x: cx - (cx - view.x) * ratio, y: cy - (cy - view.y) * ratio }, target, rect);
  return { zoom: target, x: p.x, y: p.y };
}
