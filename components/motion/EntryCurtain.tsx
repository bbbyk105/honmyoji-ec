import { EntryCurtainMotion } from "./EntryCurtainMotion";

/**
 * 入場の幕。サイトに入った最初の一度だけ。
 *
 * 要素が別々にフェードしてくるのは「読み込みが終わった」で、「開演した」ではない。
 * 名前を見せてから中へ通す扉が要る。
 *
 * **開き方は「上へ滑る」ではなく「割れて退く」**（2026-09-20 に直した）。一枚板を上へ
 * 送るのは、サイト中の他の所作（見出しの行・写真のマスク・版の面）と全部同じ向きで、
 * 反復は丁寧ではなく安く見える。二枚が中央の合わせ目から左右へ退く —— 展示室の扉が
 * 開く動きで、ページの中のどの所作とも重ならない。合わせ目には縁の罫を一本ずつ引く。
 *
 * **二度目からは出さない。** 見るたびに待たされる幕は演出ではなく関所になる。
 * 判定は sessionStorage で、読むのは `SiteChrome` が body の先頭に置く一行の script。
 * mount 後に判定すると、判定が付くまでの一瞬だけ幕が見えてしまう —— 塗る前に決める。
 *
 * Server Component。幕の中身はここで描き、動きだけを `EntryCurtainMotion`（client）が持つ。
 */
export function EntryCurtain() {
  return (
    <EntryCurtainMotion>
      {/*
        二枚の板。合わせ目（内側の縁）にだけ罫を引く —— 黒い板が黒い版を覆っているので、
        割れ目が見えるのはこの線があるときだけ。外側の三辺には引かない（画面の縁は縁ではない）。
      */}
      <div data-entry-leaf-left className="absolute inset-y-0 left-0 w-1/2 bg-sumi">
        <span className="absolute inset-y-0 right-0 w-px bg-ivory/30" />
      </div>
      <div data-entry-leaf-right className="absolute inset-y-0 right-0 w-1/2 bg-sumi">
        <span className="absolute inset-y-0 left-0 w-px bg-ivory/30" />
      </div>

      <div
        data-entry-fade
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        {/* マスクで起こす。オーバーフローを刈る親が要るので、字は入れ子にする。 */}
        <span className="block overflow-hidden">
          <span
            data-entry-mark
            className="block pl-[0.3em] font-display text-[clamp(30px,6vw,54px)] font-light leading-none tracking-[0.3em] text-ivory"
          >
            MIROKU
          </span>
        </span>

        <span
          data-entry-rule
          className="mt-7 block h-px w-[min(200px,42vw)] origin-center bg-ivory/35"
        />

        {/*
          場所は一行で。`site.location`（Honmyoji Temple, Fuji City, Shizuoka, Japan）は
          9.5px / 字間 0.24em だと扉の幅で三行に折れる —— 名前の下に住所が三行積まれると、
          幕が案内板になる。ヒーローのスマホ表示と同じ短い言い方に揃える。
        */}
        <p
          data-entry-meta
          className="mt-6 text-center font-sans text-[9.5px] uppercase leading-[1.8] tracking-[0.24em] text-mist"
        >
          Honmyoji · Fuji, Japan
        </p>
      </div>
    </EntryCurtainMotion>
  );
}
