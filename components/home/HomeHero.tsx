import Image from "next/image";
import localFont from "next/font/local";
import { Button } from "@/components/site/Button";
import { SHELL } from "@/components/site/Shell";
import { HomeHeroMotion } from "./HomeHeroMotion";

/*
  第一画面の一行だけの書体（2026-09-25）。Newsreader Light の**表示用の字形（opsz 72）**。
  見出しの Poppins は幾何学の丸みが強く、4 行の大きなコピーと組むと SaaS やデザイン会社の LP に見えた。
  一度 Instrument Serif にしたが、細長く詰まった字形がかえって安く見えた（同じ日に差し替え）。

  **Google の配信ではなく、opsz 72・太さ 300 に固定した一枚を置いて読む**（`fonts/`・22.6KB・OFL）。
  `next/font/google` の Newsreader は本文用の字形（opsz 16）で届き、線の強弱が弱くもたつく。
  軸ごと読むと 132KB になる。取り直すときは
  `https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@72,300` の latin の woff2。
  **ここ（トップの page から import される部品）で呼ぶので、先読みはトップだけ**（next/font は
  呼んだファイルの経路でだけ preload を入れる）。他のページの第一画面と回線を取り合わない。
*/
const campaign = localFont({
  src: "./fonts/newsreader-display-300-latin.woff2",
  weight: "300",
  style: "normal",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

/**
 * 第一画面。**写真を見せる・余白を見せる・一言だけ残す**（2026-09-25 に組み直し）。
 *
 * 以前は左 5 段に四行の見出し（Tatami-beri, / woven by hand / at a temple / in Fuji.）と
 * 三行の説明、右 7 段に写真 —— 写真と文字が同じ重さで並ぶ、ランディングページの割り付けだった。
 * いまは祭壇の前の三本を**図版として**画面の大半に掛け、文字は左下の余白に題と添え書きだけを置く
 * （展覧会の図録の扉と同じ関係）。作品の数・素材・撮影場所は下の節が言うので、ここでは言わない。
 *
 * 写真の上には何も載せない。金具・蝋燭・花で隅々まで細かく、どこに置いても字が読めない ——
 * 暗幕を敷けば読めるが、それは DESIGN.md が捨てたグラデーションに戻ることになる。
 *
 * この節は `sticky top-0`。下の面（`[data-page-sheet]`）が z 上位で敷かれていて、
 * スクロールするとそれが下から上がってきてこの部屋を覆う。**だから一画面に収まっていないといけない**
 * —— 以前のスマホは節が 1,700px あり、説明と導線は紙に覆われて一度も画面に出ていなかった。
 *
 * Server Component。ここは描くだけで、入場と退場の動きは `HomeHeroMotion`（client）が
 * `data-hero-*` を探して付ける。
 */
export function HomeHero() {
  return (
    <HomeHeroMotion>
      {/*
        組み。lg 以上は二列だが、左右で分けるのではなく**図版と余白**。
        - 左の列の幅は見出しの幅そのもの（`auto`）。説明と導線は `contain: inline-size` で列幅に
          口を出さない —— 列を決めるのは「Made once.」の一語ぶんだけで、残りは全部写真に渡す。
        - 写真は版の右端（ヘッダーの Cart の右端）まで。上はヘッダーの下 20px、下は 32px。
        - 文字は左下。導線の罫の下端を写真の下端に揃える（図版と、その脇の題）。
        lg 未満は縦に積むが、写真が残りの高さを全部取る（`flex-1`）。字は三行ぶんだけ。
      */}
      <div
        className={`${SHELL} flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-x-12`}
      >
        {/*
          三本は原稿の横 33–63% に立ち、祭壇・花・蝋燭が左右対称に囲んでいる。**中心（48%）で切る**。
          対称の構図が崩れると、寺の写真がただの雑多なスナップになる。
          lg 未満は左右とも画面の端まで出す。四辺を版の内側に収めるとデスクトップを縮めた箱に見え、
          右だけ抜くと左の 16px が揃え損ねに見えた（どちらも 390px で並べて確かめた）。
        */}
        <figure
          data-image-role="hero-campaign"
          data-image-ratio="3/2"
          className="relative m-0 -mx-4 min-h-[240px] flex-1 overflow-hidden sm:-mx-5 md:-mx-8 lg:col-start-2 lg:row-start-1 lg:mx-0"
        >
          <div data-hero-mask className="absolute inset-0">
            <Image
              src="/images/scenes/altar-standing.webp"
              alt="Three tatami-beri bottle bags standing on brocade before the altar of the main hall"
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 76vw, 100vw"
              className="object-cover object-[48%_50%]"
            />
          </div>
        </figure>

        <div
          data-hero-fade
          className="pb-7 pt-6 sm:pt-8 md:pb-10 lg:col-start-1 lg:row-start-1 lg:self-end lg:pb-0 lg:pt-0"
        >
          <h1
            data-hero-title
            className={`${campaign.className} whitespace-nowrap text-hero text-ivory`}
          >
            Made once.
          </h1>
          <div data-hero-aside className="lg:[contain:inline-size]">
            <p className="mt-4 max-w-[30ch] font-sans text-small text-bone lg:mt-5">
              Tatami-beri pieces, made by hand at Honmyoji in Fuji.
            </p>
            {/* 罫の下端を写真の下端に揃える（リンクの箱は罫の下に 0.2em の余りを持っている） */}
            <Button href="/collection" className="mt-5 lg:mt-9 lg:-mb-[0.2em]">
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
