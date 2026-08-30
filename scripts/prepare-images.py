"""
写真の下処理パイプライン。

  public/本妙寺*/IMG_xxxx.jpeg (原本・数MB・EXIF回転あり)
    → public/images/products/<slug>/cutout.webp   背景除去した商品カットアウト（一覧の「浮遊」表示用）
    → public/images/products/<slug>/<n>.webp      ギャラリー写真（長辺 1600px）
    → public/images/scenes/<name>.webp             ヒーロー・寺・風景（長辺 2000px）
    → public/images/texture/<name>.webp            畳の縁マクロ切り出し

依存: pip install rembg onnxruntime pillow scipy
実行: python3 scripts/prepare-images.py            （全部）
      python3 scripts/prepare-images.py --skip-cutout （カットアウト以外だけ再生成）
      python3 scripts/prepare-images.py --only textures （畳の縁マクロだけ）
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public"
OUT = ROOT / "public" / "images"

# ---- 商品 ----------------------------------------------------------------
# main: カットアウト元（できるだけ無地背景の写真）, gallery: 掲載順のギャラリー
PRODUCTS = {
    "sakura":    {"main": "本妙寺２/IMG_4215", "gallery": ["本妙寺/IMG_4658", "本妙寺/IMG_4325", "本妙寺/IMG_4322", "本妙寺２/IMG_4203"]},
    "ai":        {"main": "本妙寺２/IMG_4219", "gallery": ["本妙寺２/IMG_4220", "本妙寺２/IMG_4204", "本妙寺２/IMG_4206", "本妙寺/IMG_4652"]},
    "matsu":     {"main": "本妙寺２/IMG_4218", "gallery": ["本妙寺２/IMG_4217", "本妙寺２/IMG_4210", "本妙寺２/IMG_4207", "本妙寺/IMG_4656"]},
    "wakaba":    {"main": "本妙寺/IMG_4654",   "gallery": ["本妙寺/IMG_4637", "本妙寺/IMG_4321", "本妙寺/IMG_4640"]},
    "kasane":    {"main": "本妙寺２/IMG_3902", "gallery": ["本妙寺２/IMG_3906"]},
    "musubi":    {"main": "本妙寺２/IMG_3903", "gallery": ["本妙寺２/IMG_3906"]},
    "hisui":     {"main": "本妙寺２/IMG_3904", "gallery": []},
    "ichimatsu": {"main": "本妙寺２/IMG_3905", "gallery": []},
    "tsugi":     {"main": "本妙寺２/IMG_3901", "gallery": []},
}

# ---- 風景・寺 ----------------------------------------------------------------
SCENES = {
    "hero-tatami":     "本妙寺5/IMG_4853",
    "prayer-altar":    "本妙寺5/IMG_4850",
    "temple-hall":     "本妙寺5/IMG_4840",
    "bamboo-trio":     "本妙寺/IMG_4643",
    "bamboo-group":    "本妙寺/IMG_4640",
    "bamboo-pair":     "本妙寺/IMG_4644",
    "fuji":            "本妙寺4/IMG_5064",
    "sunset-statue":   "本妙寺4/IMG_2939",
    "statue-mono":     "本妙寺4/IMG_3970",
    "water-basin":     "本妙寺4/IMG_2763",
    "kimono-corridor": "本妙寺２/IMG_4270",
    "kimono-window":   "本妙寺２/IMG_4317",
    "kimono-event":    "本妙寺３/IMG_3822",
    "kimono-portrait": "本妙寺３/IMG_3825",
    "sakura-branch":   "本妙寺4/IMG_8003",
}

# ---- 畳の縁マクロ（原本の座標: EXIF回転後の画像に対する box）--------------------------
# box は「掲載時の比率と同じ比率」で切ること。Frame 側の object-cover で二次トリミングされると
# 実効解像度がその分落ちて、拡大表示でぼやける（beri-indigo を 4:5 で出す理由）。
TEXTURES = {
    # (source, (left, top, right, bottom), 出力幅)
    # 4:5 — home /material と journal のリード（縦位置で使う）
    "beri-indigo": ("本妙寺２/IMG_4219", (1325, 1800, 3005, 3900), 1600),
    # 16:10 — journal 本文の挿図
    "beri-sakura": ("本妙寺２/IMG_4215", (1200, 2700, 3200, 3950), 1800),
    # 帯（BeriBand）用の横長。高さ 40–56px でタイルするので低めでよい
    "beri-matsu":  ("本妙寺２/IMG_4218", (1380, 3050, 2860, 3700), 1600),
    "beri-wide":   ("本妙寺２/IMG_4220", (1420, 2300, 2960, 2900), 1600),
}


def load(rel: str) -> Image.Image:
    for ext in (".jpeg", ".jpg", ".png"):
        p = SRC / f"{rel}{ext}"
        if p.exists():
            im = Image.open(p)
            im = ImageOps.exif_transpose(im)  # iPhone 写真は EXIF orientation=6/8 が多い
            return im.convert("RGB")
    raise FileNotFoundError(rel)


def fit(im: Image.Image, longest: int) -> Image.Image:
    im = im.copy()
    im.thumbnail((longest, longest), Image.LANCZOS)
    return im


def save_webp(im: Image.Image, dest: Path, quality: int = 80) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=quality, method=6)
    print(f"  {dest.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}  {dest.stat().st_size // 1024}KB")


def clean_alpha(rgba: Image.Image, thresh: int = 60) -> Image.Image:
    """半透明の背景残りを落とし、最大の連結成分（＝バッグ本体）だけを残す。"""
    import numpy as np
    from scipy import ndimage

    a = np.array(rgba.getchannel("A"))
    mask = a > thresh
    labels, n = ndimage.label(mask)
    if n > 1:
        sizes = ndimage.sum(mask, labels, range(1, n + 1))
        mask = labels == (int(np.argmax(sizes)) + 1)
    mask = ndimage.binary_fill_holes(mask)
    out = rgba.copy()
    out.putalpha(Image.fromarray(np.where(mask, a, 0).astype(np.uint8)))
    return out


def cutout(im: Image.Image, session) -> Image.Image:
    from rembg import remove

    # 推論は縮小画像で十分。1600px に落として処理し、透明部分をトリムして余白を足す。
    base = fit(im, 1600)
    rgba = clean_alpha(remove(base, session=session, alpha_matting=False))
    bbox = rgba.getchannel("A").getbbox()
    if bbox:
        rgba = rgba.crop(bbox)
    # 上下左右に 4% の余白（影・浮遊アニメの逃げ）
    pad = int(max(rgba.size) * 0.04)
    canvas = Image.new("RGBA", (rgba.width + pad * 2, rgba.height + pad * 2), (0, 0, 0, 0))
    canvas.paste(rgba, (pad, pad), rgba)
    canvas.thumbnail((1400, 1400), Image.LANCZOS)
    return canvas


def main(skip_cutout: bool, only: str | None = None) -> None:
    session = None
    if only == "textures":
        print("textures")
        for name, (rel, box, width) in TEXTURES.items():
            im = load(rel).crop(box)
            ratio = width / im.width
            im = im.resize((width, int(im.height * ratio)), Image.LANCZOS)
            save_webp(im, OUT / "texture" / f"{name}.webp", quality=78)
        return
    if not skip_cutout:
        from rembg import new_session

        # birefnet-general が草地・壁・竹林など複雑な背景でも最も正確（初回 ~1GB のモデル DL）
        session = new_session("birefnet-general")

    print("products")
    for slug, spec in PRODUCTS.items():
        d = OUT / "products" / slug
        if not skip_cutout:
            co = cutout(load(spec["main"]), session)
            d.mkdir(parents=True, exist_ok=True)
            co.save(d / "cutout.webp", "WEBP", quality=88, method=6)
            print(f"  {(d / 'cutout.webp').relative_to(ROOT)}  {co.size[0]}x{co.size[1]}")
        save_webp(fit(load(spec["main"]), 1600), d / "1.webp")
        for i, rel in enumerate(spec["gallery"], start=2):
            save_webp(fit(load(rel), 1600), d / f"{i}.webp")

    print("scenes")
    for name, rel in SCENES.items():
        save_webp(fit(load(rel), 2000), OUT / "scenes" / f"{name}.webp", quality=78)

    print("textures")
    for name, (rel, box, width) in TEXTURES.items():
        im = load(rel).crop(box)
        ratio = width / im.width
        im = im.resize((width, int(im.height * ratio)), Image.LANCZOS)
        save_webp(im, OUT / "texture" / f"{name}.webp", quality=78)


if __name__ == "__main__":
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    main(skip_cutout="--skip-cutout" in sys.argv, only=only)
