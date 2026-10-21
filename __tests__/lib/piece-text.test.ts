import { LINE_BLURB, products, type Product } from "@/data/products";
import {
  pieceAlt,
  pieceDescription,
  pieceGalleryAlt,
  pieceHeadingKind,
  pieceKind,
  pieceProductName,
  pieceTitle,
} from "@/lib/piece-text";

// 作品を検索エンジンと読み上げに向けて言う言葉。名前（"Ai"）と一言だけでは何の品か分からないので、
// 区分と素材を足す。畳の縁の作品には、英語の売り場で多い "tatami edge" を併記する。

const byLine = (line: Product["line"]) => products.find((p) => p.line === line)!;
const bottle = byLine("tatami-beri");
const kimono = byLine("kimono");

describe("作品の言葉", () => {
  it("title は名前・漢字・区分・値段", () => {
    expect(pieceTitle(bottle, "A$170")).toBe(`${bottle.name} ${bottle.kanji} — Tatami-beri bottle bag, A$170`);
    expect(pieceTitle(bottle, null)).toBe(`${bottle.name} ${bottle.kanji} — Tatami-beri bottle bag`);
  });

  it("どの作品の title と h1 にも区分（Tatami-beri bottle bag など）が入る", () => {
    for (const piece of products.filter((p) => !p.test)) {
      const kind = pieceKind(piece);
      expect(kind.length).toBeGreaterThan(0);
      expect(pieceTitle(piece, null)).toContain(kind);
      expect(pieceTitle(piece, "A$1")).toContain(kind);
      // h1 は区分の行と名前。間の空白は PieceHeading が span の外に置く
      const h1 = `${pieceHeadingKind(piece)} ${piece.name}`;
      expect(h1).toContain(kind);
      expect(h1).toContain(piece.name);
    }
  });

  it("説明文は何であるかを先に言い、畳の縁の作品には tatami edge を併記する。作品番号は入れない", () => {
    const text = pieceDescription(bottle);
    expect(text.startsWith("Tatami-beri bottle bag, one of a kind")).toBe(true);
    expect(text).toContain(bottle.note);
    expect(text).toContain("tatami edge");
    expect(text).toContain("Honmyoji Temple");
    expect(text).not.toContain(bottle.sku);
    // 「Fuji City」を二度言わない
    expect(text.match(/Fuji City/g)).toHaveLength(1);
  });

  it("着物の作品には tatami edge を書かない（素材が違う）", () => {
    expect(pieceDescription(kimono)).toContain("vintage kimono cloth");
    expect(pieceDescription(kimono)).not.toContain("tatami");
  });

  it("畳の縁を使う区分は、どれも tatami edge を言う", () => {
    for (const line of ["tatami-beri", "origami", "handbag"] as const) {
      expect(pieceDescription(byLine(line))).toContain("tatami-beri (tatami edge)");
    }
  });

  it("写真の alt と構造化データの名前にも区分を入れる", () => {
    expect(pieceAlt(bottle)).toBe(`${bottle.name} — Tatami-beri bottle bag. ${bottle.note}`);
    expect(pieceGalleryAlt(bottle, 2, 5)).toBe(`${bottle.name} — Tatami-beri bottle bag, photograph 2 of 5`);
    expect(pieceProductName(kimono)).toBe(`${kimono.name} ${kimono.kanji} — Kimono shoulder bag`);
  });

  it("どの作品も説明文が組める（区分の素材の言い方が抜けていない）", () => {
    for (const p of products) expect(pieceDescription(p)).not.toContain("undefined");
  });
});

it("一覧のボトルバッグの説明にも tatami edge を一度だけ書く（本文にも表記ゆれを入れる）", () => {
  expect(LINE_BLURB["tatami-beri"]).toContain("Tatami-beri (tatami edge)");
  expect(LINE_BLURB["tatami-beri"].match(/tatami edge/g)).toHaveLength(1);
});

describe("説明文の組み方（2026-10-15 のコードレビュー）", () => {
  it("受注生産（made_to_order）の作品に one of a kind と書かない（ページの表記と食い違う）", () => {
    const text = pieceDescription({ ...bottle, status: "made_to_order" });
    expect(text).not.toContain("one of a kind");
    expect(text).toContain("made to order");
  });

  it("一言の末尾に句点が無くても、次の文とつながらない（一言は /studio で書き換えられる）", () => {
    const text = pieceDescription({ ...bottle, note: "Moss and indigo bands under a navy handle" });
    expect(text).toContain("Moss and indigo bands under a navy handle.");
    expect(pieceAlt({ ...bottle, note: "Moss and indigo bands" })).toBe(`${bottle.name} — Tatami-beri bottle bag. Moss and indigo bands.`);
  });

  it("狙う言葉（tatami edge）と場所は一言より前に置く（スマホの検索結果は 120 字ほどで切れる）", () => {
    for (const p of products.filter((x) => ["tatami-beri", "origami", "handbag"].includes(x.line))) {
      const text = pieceDescription(p);
      expect(text.indexOf("tatami edge")).toBeLessThan(120);
      expect(text.indexOf("Honmyoji Temple")).toBeLessThan(text.indexOf(p.note));
    }
  });

  it("エプロンの説明で、一言と同じことを繰り返さない", () => {
    for (const p of products.filter((x) => x.line === "apron")) {
      expect(pieceDescription(p).match(/panel/g)?.length ?? 0).toBeLessThanOrEqual(1);
    }
  });
});
