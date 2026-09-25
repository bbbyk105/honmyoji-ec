"""
カメラマン撮影分（2026-09-04 撮影）の下処理。

  image/*.png （書き出しはスクリーンショット・3024×1964・git 管理外）
    → public/images/products/<folder>/1.webp    主役（一覧・商品ページ・カート・OG）
    → public/images/products/<folder>/<n>.webp  ギャラリー（全景・長辺 2000px）
    → public/images/scenes/<name>.webp           着姿・寺（長辺 2400px）
    → public/images/texture/<name>.webp          縁の寄り（掲載と同じ 4:5 で切る）
    → data/image-sizes.json                      public/images 以下の全 webp の寸法

依存: rembg onnxruntime pillow scipy（scripts/prepare-images.py と同じ .venv。モデルは isnet-general-use）
実行: .venv/bin/python scripts/prepare-photos.py
      .venv/bin/python scripts/prepare-photos.py --only products --product bottle-07
      .venv/bin/python scripts/prepare-photos.py --only scenes
      .venv/bin/python scripts/prepare-photos.py --only textures

**原稿は写真ではなく画面のスクリーンショット**で、上端（横位置）か左端（縦位置）に
29px / 66px の黒帯が乗っている。そのまま使うと一覧で一枚ずつ黒い線が走るので、
端から「暗くて平らな行・列」を数えて落とす（`trim_bars`）。

主役の切り方は作品の形で二通り（`data/products.ts` の `LINE_RATIO` と揃えること）:

- **stand（4:5）** — 床に立つボトルバッグと折り紙バッグ。背景除去で作品を見つけ、
  **背丈がどの一枚でも同じ割合**になるよう切る。撮影距離が作品ごとに違う（縦位置は寄り、
  横位置は引き）ので、写真のまま中央で切ると一覧で大きさがばらつく。
- **wide（3:2）** — 横に広いハンドバッグ・畳に平置きした着物バッグとエプロン。4:5 に
  入れると作品の端が落ちるので、カメラマンの画角のまま 3:2 に整える。

背景除去は切る位置を決めるためだけに使い、出力は写真のまま（床・障子・壁が残る）。
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "image"
OUT = ROOT / "public" / "images"

SS = "スクリーンショット 2026-09-04 "

# ---- 作品 ------------------------------------------------------------------
# lead: 主役, gallery: 2.webp 以降に並ぶ順, crop: stand（4:5）/ wide（3:2）
# rotate: 原稿が横倒しのもの（度・反時計回り。PIL の rotate と同じ向き）
# 番号はクライアントの書き出し名（バンブー中1 … 小13）に合わせてある。
# 主役は同じ距離から撮った横位置を優先する（縦位置の寄りと混ぜると、並べたとき遠近が揃わない）。
PRODUCTS: dict[str, dict] = {
    "bottle-01": {"lead": "バンブー中1-1", "gallery": ["バンブー中1"]},
    "bottle-02": {"lead": "バンブー中2-1.soldout", "gallery": ["バンブー中2.soldout"]},
    "bottle-03": {"lead": "バンブー中3-1", "gallery": ["バンブー中3"]},
    "bottle-04": {"lead": "バンブー中4", "gallery": ["バンブー中4-1"]},
    "bottle-05": {"lead": "バンブー中5-3", "gallery": ["バンブー中5", "バンブー中5-2", "バンブー中5-1"]},
    # 書き出し名はどちらも「中5」だが、青い一本は別の作品（soldout 付き）
    "bottle-05b": {"lead": "バンブー中5soldout", "gallery": ["バンブー中5-1soldout", "バンブー中5-2soldout"]},
    "bottle-06": {"lead": "バンブー中6", "gallery": ["バンブー中6-1"]},
    # 「大」と「大7」は同じ一本（柄の並びが一致）。着姿の 0.10.58 もこの一本
    "bottle-07": {"lead": "バンブー大7", "gallery": ["バンブー大", "バンブー大7-1", SS + "0.10.58"]},
    "bottle-08": {"lead": "バンブー小8", "gallery": ["バンブー小8-1"]},
    "bottle-09": {"lead": "バンブー小9", "gallery": []},
    "bottle-10": {"lead": "バンブー小10", "gallery": ["バンブー小10-1"]},
    # 原稿が 90° 倒れている（床が左にある）。起こすと瓶と並んで立つ一枚になる
    "bottle-11": {"lead": "バンブー小11", "gallery": [], "rotate": 90},
    "bottle-12": {"lead": "バンブー小12", "gallery": ["バンブー小12-1"]},
    "bottle-13": {"lead": "バンブー小13", "gallery": ["バンブー小13-1"]},
    "origami-01": {"lead": "origami1", "gallery": ["origami1-1", "origami1-2"]},
    "origami-02": {"lead": "origami2", "gallery": ["origami2-2", "origami2-1"]},
    "origami-03": {"lead": "origami3", "gallery": ["oeigami3-1"]},
    "origami-04": {"lead": "origami4soldout", "gallery": ["origami4-1soldout"]},
    "handbag-01": {
        "lead": "bag1",
        "gallery": ["bag1-1", "bag1-2", SS + "0.06.20", SS + "0.03.53"],
        "crop": "wide",
    },
    "handbag-02": {"lead": "bag2soldout", "gallery": ["bag2-1soldout", SS + "0.09.44"], "crop": "wide"},
    "kimono-01": {"lead": "kimonobag", "gallery": [], "crop": "wide"},
    "kimono-02": {"lead": "kimonobag2", "gallery": [], "crop": "wide"},
    "kimono-03": {"lead": "kimonobag3", "gallery": [], "crop": "wide"},
    "kimono-04": {"lead": "kimonobag4", "gallery": [], "crop": "wide"},
    "apron-01": {"lead": "apron1", "gallery": [], "crop": "wide"},
    "apron-02": {"lead": "apron2soldout", "gallery": [], "crop": "wide"},
}

# ---- 着姿・寺 -----------------------------------------------------------------
# サイトが使っている分だけ。0.09.44（bag2 の着姿）と 0.06.20 は作品のギャラリー側にも入っている。
# 0.10.03（赤いボトルバッグ）・0.13.02/14/28（後ろ手）はどの一本か特定できないので、まだ使っていない。
SCENES = {
    "altar-standing": SS + "0.03.23",   # 本堂の前に三本
    "altar-lying": SS + "0.03.31",      # 本堂の前に寝かせて三本
    "tokonoma": SS + "0.03.01",         # 床の間と像
    "window-back": SS + "0.03.40",      # 窓辺・後ろ姿（縦）。0.03.41 は同じ画像
    "window-wide": SS + "0.03.53",      # 窓辺・引き（横）
    "shoulder": SS + "0.04.01",         # 肩掛けの寄り
    "hall-front": SS + "0.05.43",       # 広間・正面（横）
    "hall-portrait": SS + "0.06.20",    # 広間・正面（縦）
    "laugh": SS + "0.10.58",
    "hands-front": SS + "0.12.55",      # 手元（縦）
    "smile-window": SS + "0.15.02",
}

# ---- 縁の寄り（読み込み後＝黒帯を落とした原稿に対する box）---------------------------
# 掲載と同じ 4:5 で切る。横長を 4:5 の井戸に入れると object-cover で削られ、残りが拡大されて荒れる。
TEXTURES = {
    "weave-moegi": ("バンブー中5", (600, 1180, 1280, 2030)),
}

# stand（4:5）の中で作品が占める割合。横位置の原稿は作品が縦の 77–91% に写っているので、
# その下限に揃える（これより小さくすると、横位置の原稿からは切り出せない）。
STAND_HEIGHT = 0.84
STAND_GROUND = 0.94   # 接地線 = 上から 94%
STAND_SIZE = (1200, 1500)
WIDE_SIZE = (1800, 1200)


def load(name: str, rotate: int = 0) -> Image.Image:
    """
    画素だけを取り出す。縦位置の書き出しには EXIF の Orientation=8 が残っているが、
    画素はもう正しい向きに回してある（タグだけが古い）。タグを連れていくと rembg が
    exif_transpose で 90° 倒し、マスクが横倒しで返ってくる（実際に踏んだ）。
    """
    im = Image.open(SRC / f"{name}.png").convert("RGB")
    im = trim_bars(Image.fromarray(np.asarray(im)))
    return im.rotate(rotate, expand=True) if rotate else im


def trim_bars(im: Image.Image, pad: int = 4) -> Image.Image:
    """端に乗った黒帯（スクリーンショットのメニューバー跡）を落とす。"""
    a = np.asarray(im.convert("L"), dtype=np.float32)

    def run(lines: np.ndarray) -> int:
        n = 0
        for line in lines:
            if line.mean() < 14 and line.std() < 8:
                n += 1
            else:
                break
        return n

    t, b = run(a), run(a[::-1])
    l, r = run(a.T), run(a.T[::-1])
    w, h = im.size
    return im.crop((l + (pad if l else 0), t + (pad if t else 0), w - r - (pad if r else 0), h - b - (pad if b else 0)))


def fit(im: Image.Image, longest: int) -> Image.Image:
    w, h = im.size
    s = min(1.0, longest / max(w, h))
    return im.resize((round(w * s), round(h * s)), Image.LANCZOS) if s < 1 else im


def save_webp(im: Image.Image, dest: Path, quality: int = 80) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=quality, method=6)
    print(f"  {dest.relative_to(ROOT)}  {im.size[0]}×{im.size[1]}  {dest.stat().st_size // 1024}KB")


def subject_box(im: Image.Image, session) -> tuple[int, int, int, int]:
    """作品の外接矩形。小さな飛び地（壁の染み・床の反射）は捨てる。"""
    from rembg import remove

    mask = remove(im, session=session, only_mask=True)
    m = np.asarray(mask) > 128
    labels, n = ndimage.label(m)
    if n == 0:
        w, h = im.size
        return (0, 0, w, h)
    sizes = ndimage.sum(m, labels, range(1, n + 1))
    keep = np.isin(labels, [i + 1 for i, s in enumerate(sizes) if s >= sizes.max() * 0.03])
    ys, xs = np.nonzero(keep)
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)


def widen(im: Image.Image, width: int) -> Image.Image:
    """
    左右を鏡映しで足す。縦位置しかない二点（中6・小9）は、4:5 で背丈を揃えると
    写真の幅が足りない。足すのは障子・壁・床の端だけで、作品には触れない。
    縁を引き伸ばすと壁の肌理が縞になるので、引き伸ばしではなく反射で足す。
    """
    extra = width - im.size[0]
    if extra <= 0:
        return im
    a = np.asarray(im)
    left = extra // 2
    return Image.fromarray(np.pad(a, ((0, 0), (left, extra - left), (0, 0)), mode="symmetric"))


def stand_crop(im: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    x0, y0, x1, y1 = box
    ratio = STAND_SIZE[0] / STAND_SIZE[1]
    ch = min((y1 - y0) / STAND_HEIGHT, im.size[1])
    cw = ch * ratio
    if cw > im.size[0]:
        shift = (round(cw) + 2 - im.size[0]) // 2
        im = widen(im, round(cw) + 2)
        x0, x1 = x0 + shift, x1 + shift
    W, H = im.size
    left = min(max(0, (x0 + x1) / 2 - cw / 2), W - cw)
    top = min(max(0, y1 - ch * STAND_GROUND), H - ch)
    crop = im.crop((round(left), round(top), round(left + cw), round(top + ch)))
    return crop.resize(STAND_SIZE, Image.LANCZOS) if crop.size[0] > STAND_SIZE[0] else crop


def wide_crop(im: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    """カメラマンの画角のまま 3:2 に。削るのは作品から遠い側だけ。"""
    W, H = im.size
    ratio = WIDE_SIZE[0] / WIDE_SIZE[1]
    cw, ch = (W, W / ratio) if W / H < ratio else (H * ratio, H)
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    left = min(max(0, cx - cw / 2), W - cw)
    top = min(max(0, cy - ch / 2), H - ch)
    crop = im.crop((round(left), round(top), round(left + cw), round(top + ch)))
    return crop.resize(WIDE_SIZE, Image.LANCZOS) if crop.size[0] > WIDE_SIZE[0] else crop


def run_products(only: str | None) -> None:
    from rembg import new_session

    # 位置を決めるだけなので isnet で足りる。畳・床・壁の前に立つ撮影なら外接矩形は
    # birefnet と 1px しか違わず、1 枚 2 分 → 1.4 秒（2026-09-25 に実測）。
    session = new_session("isnet-general-use")
    for folder, spec in PRODUCTS.items():
        if only and folder != only:
            continue
        print(f"[{folder}]")
        d = OUT / "products" / folder
        for old in d.glob("*.webp"):
            old.unlink()
        im = load(spec["lead"], spec.get("rotate", 0))
        box = subject_box(im, session)
        lead = wide_crop(im, box) if spec.get("crop") == "wide" else stand_crop(im, box)
        save_webp(lead, d / "1.webp", quality=84)
        for i, name in enumerate(spec["gallery"], start=2):
            save_webp(fit(load(name), 2000), d / f"{i}.webp", quality=80)
        print(f"  galleryCount: {1 + len(spec['gallery'])}")


def run_scenes() -> None:
    for name, src in SCENES.items():
        save_webp(fit(load(src), 2400), OUT / "scenes" / f"{name}.webp", quality=80)


def run_textures() -> None:
    for name, (src, box) in TEXTURES.items():
        save_webp(load(src).crop(box), OUT / "texture" / f"{name}.webp", quality=84)


def write_sizes() -> None:
    """
    写真の寸法表。商品ページのギャラリーは写真を**撮ったままの比率**で並べる（縦位置は二枚並べ、
    横位置は一段ぶち抜き）ので、描く前に縦横が要る。実行時に public/ を fs で読むと、
    デプロイ先の関数に public/ が同梱されずに落ちるので、ここで JSON に書いて import させる。
    """
    import json

    sizes = {}
    for f in sorted((OUT).rglob("*.webp")):
        with Image.open(f) as im:
            sizes["/" + str(f.relative_to(ROOT / "public"))] = list(im.size)
    dest = ROOT / "data" / "image-sizes.json"
    lines = [f"  {json.dumps(k, ensure_ascii=False)}: [{w}, {h}]" for k, (w, h) in sizes.items()]
    dest.write_text("{\n" + ",\n".join(lines) + "\n}\n")
    print(f"  {dest.relative_to(ROOT)}  {len(sizes)} files")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", choices=["products", "scenes", "textures"])
    ap.add_argument("--product")
    args = ap.parse_args()
    if args.only in (None, "products"):
        run_products(args.product)
    if args.only in (None, "scenes"):
        run_scenes()
    if args.only in (None, "textures"):
        run_textures()
    write_sizes()


if __name__ == "__main__":
    main()
