import sizes from "./image-sizes.json";

/**
 * public/images 以下の写真の寸法。`scripts/prepare-photos.py` が書き出す JSON を引くだけ。
 * 実行時に fs で public/ を読まない — デプロイ先の関数に public/ が同梱されず落ちる。
 * 表に無い写真（microCMS の画像など）は undefined。呼ぶ側は比率を決め打ちで逃がすこと。
 */
export function imageSize(src: string): { width: number; height: number } | undefined {
  const hit = (sizes as Record<string, number[]>)[src];
  return hit && hit.length === 2 ? { width: hit[0], height: hit[1] } : undefined;
}
