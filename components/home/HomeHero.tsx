import Image from "next/image";
import { Button } from "@/components/site/Button";
import { ImageWell } from "@/components/site/ImageWell";
import { SHELL } from "@/components/site/Shell";
import { HomeHeroMotion } from "./HomeHeroMotion";

type Props = {
  /** 作品の数。一覧の件数と揃える（焼き込むとカタログを直したときにずれる）。 */
  count: number;
};

/**
 * 第一画面。**写真は写真、文字は文字**（2026-09-25）。
 *
 * 以前は暗い一枚（hero-weave）の左の余白に縦組み・クレジット・見出し・導線・所在地を
 * 刻んでいた。いまの一枚は本堂の祭壇の前に三本が立つ写真で、金具・ろうそく・花で画面の
 * 隅々まで細かく、どこに文字を載せても読めない —— 暗幕を敷けば読めるが、それは DESIGN.md が
 * 捨てたグラデーションに戻ることになる。なので写真には何も載せず、文字は写真の外の黒に置く
 * （展示の図版と、その脇のキャプション板の関係）。
 * 最初は窓辺の着姿（window-wide）を置いたが、人が主役になって作品が小さく、
 * 「どこにでもある着物の写真」に見えた（2026-09-25 本人判断で差し替え）。
 * 縦組みの一行・小さな大文字のクレジット・`01 — Honmyoji` の足元は外した。どれも
 * 何も言っていないのに、一画面に「飾り」が三つ並んでいた。
 *
 * この節は `sticky top-0`。下の面（`[data-page-sheet]`）が z 上位で敷かれていて、
 * スクロールするとそれが下から上がってきてこの部屋を覆う。
 *
 * Server Component。ここは描くだけで、入場と退場の動きは `HomeHeroMotion`（client）が
 * `data-hero-*` を探して付ける。写真・見出し・導線のマークアップは client に載らない。
 */
export function HomeHero({ count }: Props) {
  return (
    <HomeHeroMotion>
      {/*
        lg 以上の組み（2026-09-25 に組み直し）。
        - 写真は右 7 段。上・右・下の三辺に版の余白と同じ 48px を取る —— 以前は上 24px・下 32px・
          右 48px とばらばらで、写真が根拠なく浮いた箱に見えていた。
        - 文字は左 5 段。**見出しは写真の上端に、説明と導線は写真の下端に**揃える（図録の図版と、
          その脇の題と添え書き）。以前は全部を足元に積んでいて、見出し・説明・ボタンを重ねた
          ランディングページの定型に見えた。
      */}
      <div
        className={`${SHELL} flex flex-1 flex-col pb-6 pt-4 lg:grid lg:min-h-0 lg:grid-cols-12 lg:gap-8 lg:pb-12 lg:pt-12`}
      >
        {/*
          三本は原稿の横 33–63% に立ち、祭壇・花・蝋燭が左右対称に囲んでいる。**中心（48%）で切る**。
          以前は左へ寄せて（10%）切っていたので、三本が右端へ押しやられ、左の太鼓と経本が主役に
          写っていた —— 対称の構図が崩れると、寺の写真がただの雑多なスナップになる。
          7 段・画面の高さで切ると横 20–76% が残り、左右の提灯が枠の外へ出て、三本が画面の半分を占める。
          タブレット縦（md）は写真に残りの高さを全部渡す —— 3:2 のままだと下に 400px の黒が残った。
        */}
        <figure
          data-image-role="hero-campaign"
          data-image-ratio="3/2"
          data-hero-frame
          className="relative m-0 aspect-[4/5] w-full overflow-hidden sm:aspect-[3/2] md:aspect-auto md:min-h-[360px] md:flex-1 lg:order-2 lg:col-span-7 lg:col-start-6 lg:h-full lg:min-h-0"
        >
          <ImageWell reveal="band" className="absolute inset-0">
            <Image
              src="/images/scenes/altar-standing.webp"
              alt="Three tatami-beri bottle bags standing on brocade before the altar of the main hall"
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="object-cover object-[48%_50%]"
            />
          </ImageWell>
        </figure>

        <div
          data-hero-fade
          className="grid gap-7 pt-8 md:grid-cols-12 md:items-end md:gap-8 lg:order-1 lg:col-span-5 lg:flex lg:flex-col lg:items-start lg:justify-between lg:gap-12 lg:pt-0"
        >
          {/*
            見出しは**句で改行する**。成り行きで折ると「…at a temple in / Fuji.」「woven by hand at /
            a temple…」のように句の途中で切れ、偶然の折り返しに見えた。一番長い句（woven by hand、
            Poppins で 7.36em）が 5 段の 87% に収まる大きさにしてある（`--text-hero`）。
            どの幅でも句ごとの四行。以前は lg 未満で最後の二句を一行にしていた（`hidden lg:inline` の br）が、
            SplitText は display:none の br でも改行するので、動きのある画面では元から四行で、三行になるのは
            「動きを減らす」の人だけだった。Poppins だと最後の二句は 8.52em あり、スマホで一行にすると
            390px 幅でちょうど一杯、それより狭いと「at a temple in / Fuji.」と句の途中で折れる。
            lg 以上は字面の上端を写真の上端に揃える。Poppins は行の箱の上に 0.16em の余りがあり
            （Newsreader はほぼ 0 で、何もしなくても揃っていた）、そのままだと 7〜10px 下がるので引き上げる。
          */}
          <h1 data-hero-title className="font-display text-hero font-light text-ivory md:col-span-7 lg:mt-[-0.16em]">
            Tatami-beri,
            <br />
            woven by hand
            <br />
            at a temple
            <br />
            in Fuji.
          </h1>
          <div data-hero-aside className="md:col-span-5 md:col-start-8 md:pb-2 lg:pb-0">
            <p className="max-w-[34ch] font-sans text-body text-bone">
              {count} pieces, each made once from the edging of tatami rooms and paper band recycled in
              Fuji City. Photographed at Honmyoji, released one by one.
            </p>
            {/* 罫の下端を写真の下端に揃える（リンクの箱は罫の下に 0.2em の余りを持っている） */}
            <Button href="/collection" className="mt-8 lg:-mb-[0.2em]">
              View the collection
            </Button>
          </div>
        </div>
      </div>

      {/* 紙に覆われる間、部屋を落とす層。載せるのは GSAP だけ（初期値は透明）。 */}
      <div aria-hidden data-hero-dim className="pointer-events-none absolute inset-0 z-20 bg-sumi opacity-0" />
    </HomeHeroMotion>
  );
}
