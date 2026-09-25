# Design System — MIROKU

## Product Context

- **What this is:** An independent atelier site for one-of-a-kind tatami-beri bags made at Honmyoji Temple, Fuji City.
- **Who it's for:** Design-literate buyers of craft objects and independent fashion — not mass retail.
- **Space:** Contemporary Japanese craft / artisan fashion ecommerce.
- **Project type:** Editorial brand world with a working shop (reserve → inquiry → manual checkout).

## Memorable thing

A bag as a **held object** — leftover weave, one meeting, no reprint. The site should feel like a small exhibition catalogue, not a storefront.

## Aesthetic Direction

- **Direction:** Editorial / material-first. A dark room hung with lit objects. Quiet luxury without gold, black marble, or zen cliché.
- **Decoration:** Intentional and rare. A beri band used as a section edge, thin rules. No cards, icons, glass — no gradients anywhere, and no grain on the ground (see Color).
- **Never the left-bar blockquote** (`border-l` + indent + italic). It is the markdown-renderer default — the single clearest tell that nobody chose it. A pull quote earns its place through scale and air: large upright Poppins light at the body's own left edge, with room above and below. Panels get a hairline on all four sides, matching the form fields.
- **Mood:** A temple hall and a catalogue. Candle-lit photographs hang in a sumi room; daylit pieces and everything you read sit on warm paper. Colour lives in the cloth — the weave is the only saturated thing on the page. Type is literary, not “luxury template.”
- **Luxury is made of four things only:** typography, photographs, space, material. Never by adding decoration — no gold, no glow, no gradients, no badges, no pills, no glass.
- **What we refused:** 3-up feature rows, centered manifesto + CTA stacks, pill buttons, drop shadows, Shopify grids, beige Instagram boutique, startup landing structure.

## Typography

Three roles for Latin, one for Japanese (2026-09-25). The Latin faces follow the pairing on
jimotofoods.com.au, which the client pointed to. All three are OFL on Google Fonts and self-hosted by `next/font`:
nothing is fetched from Google or from that shop's CDN.

- **Display (`font-display`):** Poppins 300, upright only. Poppins is not a variable font, so `layout.tsx` loads
  the 300 file alone: every `font-display` carries `font-light`. No italic is loaded.
  Poppins is wider than the Newsreader it replaced (“woven by hand” is 7.36em against 6.36em) and its line box
  carries 0.16em above the cap height, so the hero is sized and pulled up for it (see the `--text-hero` note).
  Its descenders run 0.09–0.11em below a 1.02–1.05 line box: split-line masks must come from `splitLines()`
  (`components/motion/split-lines.ts`), which adds that room, or the g, p and y are cut off.
- **Body + UI (`font-sans`):** Nunito Sans, variable. Its italic (emphasis in CMS text) is a separate,
  non-preloaded load, fetched only on a page that uses it.
  **Satoshi is not used** — its ITF Free Font License forbids making the font files available through a public
  repository, and this repository is public.
- **Wordmark (`font-mark`):** Prompt 300, for MIROKU only (header, footer, entry curtain, studio).
- **Preload only what the first screen needs:** Poppins 300, Nunito Sans upright, Prompt 300 — three files,
  about 50KB. Every preload competes with the hero photograph for the connection.
- **Japanese:** the device's own Mincho (Hiragino Mincho on Apple, Yu Mincho on Windows, Noto Serif CJK on
  Android) — secondary lines only, at 13–16px with **0.04–0.08em** tracking. The old 0.2–0.34em spacing on
  every Japanese line was part of the template look. No Japanese web font: Shippori Mincho came as ~120
  unicode-range slices per weight, and their 245 `@font-face` rules were a 184KB stylesheet that held back first
  paint on every page. If a Japanese web font returns, it must be one file subset to the characters in use.
- **Scale — tokens, not per-page clamps** (`@theme` in `app/globals.css`, used as `text-hero`, `text-section`…):

| Token | Size | Leading / tracking | Use |
|---|---|---|---|
| `hero` | ≤42px on phones (11vw), 44px → 66px from 1024 (≈64px at 1440) | 1.02 / −0.022em | The home H1 only |
| `display` | 46px → 96px | 0.98 / −0.024em | Page titles, piece name on the PDP |
| `section` | 34px → 62px (≈57px at 1440) | 1.05 / −0.018em | Section headings |
| `title` | 24px → 34px | 1.16 / −0.01em | Sub-heads, defined terms, list titles |
| `piece` | 20px → 23px | 1.1 | Piece name under a photograph |
| `deck` | 20px → 25px | 1.42 | Lead paragraph, in the display face |
| `body` | 16px → 17px | 1.8 | Body |
| `small` | 15px | 1.75 | Secondary body, table cells |
| `meta` | 13px | 1.6 | Dates, kinds, status, form labels |
| `caps` | 11.5px, 500, uppercase | 0.12em | **Nav, CTAs and the Sold-out band only** (`@utility caps`) |

- **Floor is 11px.** `text-[8px]`–`text-[10.5px]` and tracking above 0.16em are gone from the public site. Making
  type small and spacing it wide is not how this site says “luxury”.
- **No label above a heading.** A tiny uppercase kicker (“ATELIER NOTE”, “EXHIBITION · 2026”) over every heading,
  plus a letter-spaced Japanese line under it, was the single most template-looking habit on the site. A heading
  stands on its own; chapter numbers live in `ChapterRail`.
- **Wordmark:** MIROKU in Prompt 300 — a face of its own, so it reads as a mark rather than a fragment of a
  Poppins heading — 0.24em tracking with the trailing space pulled back (`mr-[-0.24em]`), over `HONMYOJI · FUJI` in 11px caps at
  0.16em — the two lines come out the same width, like a temple plaque.

## Color

**Two grounds** (2026-09-25): **sumi** (a warm near-black) and **paper** (unbleached). Not pure `#000` / `#fff` —
beside the cloth they read as screen colours.

**Which ground a section sits on follows the light of its photograph**, not an alternation:
candle- and lamp-lit photographs of the hall (home hero, the tatami room, the altar, Fuji at dusk) sit on sumi;
daylit pieces and portraits, and everything that is *read* or *chosen* (collection, piece pages, notes, FAQ,
legal, the contact letter) sit on paper. On sumi, the shoji behind every piece glowed like a light box and
reached the eye before the bag did; on paper the white falls back into the ground and only the piece stands.

Home runs sumi → paper → sumi → *(the drift band straddles the seam)* → paper → paper → sumi → paper → sumi footer.
Uneven lengths, and the one seam that would have read as a stripe is stitched by the procession of bags.

Tokens are **roles, not colour names**. Inside `.surface-paper` the same names resolve to paper and ink, so a
component never has to know which ground it is on — `text-ivory` is ink on paper.

| Token | Sumi surface | Paper surface | Use |
|---|---|---|---|
| sumi | `#11100E` | `#E9E2D6` | The ground |
| ivory | `#F2EEE6` (16.4∶1) | `#15130F` (14.4∶1) | Strongest text, solid button fill |
| bone | `#C8C0B4` (10.6∶1) | `#3B362F` (9.3∶1) | Body |
| mist | `#918A80` (5.6∶1) | `#5F5850` (5.4∶1) | Meta, sold out |
| line | ivory at 14 % | ink at 15 % | Hairline |
| bark | ivory at 32 % | ink at 36 % | Hairline on hover, field borders |
| moss / indigo / clay / rose | `#92A37B` `#8A9CB4` `#C89771` `#CF9D92` | `#56683F` `#465B78` `#8A5634` `#8E5247` | **Status only** |

- `surface-paper` / `surface-dark` paint a ground; `tone-paper` / `tone-dark` only swap the roles. Fixed parts
  (header, chapter rail, cursor word) use `useSurfaceAt()` to take the tone of whatever surface passes under them.
- **Paper carries a grain you should not be able to see**: an SVG turbulence at ≈3 % (measured σ ≈ 1.5/255).
  Sumi carries none — blends are near no-ops on a dark ground.
- **No gradients.** Not on the ground, not over a photograph, not under an object. The drift band's two halves are
  two flat grounds meeting at a hard edge.
- **No gold, no metallic, no brown.** The paper is unbleached, not beige-boutique: it is always set with ink-black
  type and hairlines, never with rounded cards or soft shadows.
- The one bright block per screen is the solid button (buy / send / notify). Sold out stays `mist`; the band
  across the photograph says it once more, in the surface's strongest colour.

*(The shelf below applied to the cut-out collection, which was retired on 2026-09-25 — pieces are now shown as the photographer shot them. It is kept here because the reasoning still holds for anything that floats.)*

**On black, a shadow is not a ground — so the ground is a line.** A 12 % drop shadow under a cut-out is
invisible here, and a soft pool of light is just a radial gradient. Every floating piece stands on a
**shelf**: a 1px ivory hairline at ~25 %, drawn at the contact line.

## Spacing

- **Base:** 8px
- **Density:** Spacious, with uneven section height so the page does not read as stacked modules
- **Page width:** 1480px. **Articles are 980px** — a note is read, not scanned.
- **Horizontal pad:** 16 / 20 / 32 / 48 — and it is not retyped per section. `SHELL` in
  `components/site/Shell.tsx` is the one page column; header, footer, hero and every home
  section use it. Written by hand it drifts: the hero had no `max-w` at all and sat 236px
  outside the column at 1920px, and half the sections said `px-4 sm:px-5` while the other
  half said `px-5`.
- **Section gaps are three tokens, not a repeated number** (2026-09-25): `beat` (80 → 136px), `breath`
  (96 → 168px) and `pause` (112 → 192px), plus `lead` (40 → 72px) from a section heading to its content.
  Used as `pt-pause`, `py-breath`, `mt-lead`. Closely related sections take `beat`, a change of subject takes
  `breath`, and either side of a change of ground takes `pause`. **Vertical space is carried on one side only**
  — a section that paints its own ground owns its inner `py`; everything else takes `pt`. `mt-40` stacked on
  `py-24` is 256px, which no one chose and which reads as the page coming apart.
- **Measure:** body ~56ch (≈65 characters). Japanese is measured in `em`, never `ch` — `ch` is the width of “0”, so `42ch` of Japanese wraps at about 20 characters and becomes unreadable.
- **The page column and the line length are two different things.** `--blog-measure` (560px, ≈70
  characters at 17px) is the article's *line*; 980px is its *page*. Running body text to the page edge
  gave 119 characters a line — at that length the eye loses the left margin on every return sweep, which
  is the one typographic failure a reader feels without being able to name. Photographs, pull quotes and
  the table of contents live in the space the measure leaves; **that space is a margin, not a hole.**
  `ch` is unusable for sharing a right edge across fonts: each face has its own `0` (Newsreader's ~0.55em
  against Albert Sans's ~0.47em put the same `62ch` 15 % apart; Poppins and Nunito Sans are 0.62 / 0.60em
  today, and the next change of face moves them again). Share a px token instead.
- **A paragraph break must be bigger than a line break.** Body runs 17px / 1.9 (32.3px between lines), so
  a `1.7em` (28.9px) paragraph gap made the breaks *smaller* than the leading and the page read as one
  block. Paragraph spacing is `2.1em`. A heading, conversely, belongs to what comes **after** it: 2.6em
  above, 1em below.
- **A column is as wide as its text.** A 56ch paragraph parked in a `col-span-7` leaves a hole; either narrow the column or put something in the other half. A short block beside a tall photograph is centred, not bottom-pinned — a pinned block reads as a mistake, a centred one reads as margin.

## Layout

- **Approach:** Creative-editorial. Asymmetric 12-column, but every block still lands on a shared line — a top, a bottom, or an outer edge.
- **An offset is a decision or it is a mistake.** A `mt-16` nudge between two images that nearly line up reads as a failed alignment, not as composition. Either share the line exactly (force one height so tops, bottoms and captions agree) or make the difference large enough that nobody reads it as an attempt. Nothing in between.
- **Photographs of different orientations do not share a height.** A 16∶10 next to a 3∶4 cannot align without gutting one crop — pair a landscape with *text*, and pair portraits with portraits (`wellClass="aspect-[4/5] md:aspect-auto md:h-[clamp(...)]"` on both).
- **Mobile:** Same hierarchy, fewer columns. Do not mechanically stack every pair. Captions stay under images.
- **Sets of photographs go sideways on mobile.** Five stacked 4∶5 stills is 2,400px of thumb. The PDP gallery and the “Alongside” row become snap-scrolling strips below `md` — one frame per screen, the next one peeking, a `01 / 05` counter. Stage ratio is uniform (4∶5) across a strip; mixed ratios make the band look broken. A set of one is not a carousel — it renders as a plain still.
- **Tablet:** Intermediate crops. Collection is a plain 1 / 2 / 3-column grid — the pieces are the variety, the frame should not be.
- **A long note earns a table of contents, and it goes in the margin the measure left.** `ArticleToc`
  stands in the right of the 980px page from `xl` up, sticky, same grammar as the home `ChapterRail`
  (quiet labels, the current one underlined). It appears only at **three headings or more** — a list of
  two is not a tool. It reads the headings out of the rendered article rather than from the data, because
  the body arrives in two forms (microCMS rich-editor HTML and hand-built blocks) that agree only once
  they are on the page.
- **Radius:** Essentially none. Objects are cut-outs or flush photographs.
- **Buttons:** one system, `components/site/Button.tsx`, **two variants** (2026-09-25). No pills, no shadows, no radius.
  - `solid` — only where money or contact details move: Add to cart, Check out, Send, Notify me. Filled with the
    surface's strongest colour (ivory on sumi, ink on paper). Hover lowers the fill to 88 %, nothing more.
  - `link` — everything else: **word · hairline · arrow**. The hairline is always drawn at 28 % (it has to say
    “pressable” before anyone touches it); on hover a full-strength line draws in from the left, the arrow moves
    4px and the word goes from 86 % to 100 %. The outlined rectangle that used to sit under every “The collection”
    and “The maker and the place” is gone — one box per screen at most.
  - The arrow is a 1px drawn line (`Arrow.tsx`), not the `→` glyph, so it belongs to the same family as the rules.
  - Back links pass `arrow={false}`. All variants are ≥44px tall.

## Motion

Reference: cellato.tokyo — its *grammar*. Their vocabulary is (1) photographs that **open through a mask**
instead of fading, (2) headings that **rise line by line from behind a mask**, and (3) a **horizontal band
driven by vertical scroll**. The ground here is dark now too, but that is where the agreement stops: pill
buttons, centred CTA stacks and a cold black are still refused.

- **Approach:** Intentional, almost invisible. Lenis for wheel; GSAP (`useGSAP`) for enter, menu, and reveal. Not a showreel.
- **One curve, few durations** (2026-09-25). Every ease is `cubic-bezier(0.22, 1, 0.36, 1)` — `--ease-soft` in CSS,
  `power4.out` in GSAP (`components/motion/tokens.ts`). Text blocks 0.9s (opacity + 14px), heading lines 1.0s
  (clip), photographs 1.1s (mask). What reads as luxury is how things *stop*, and they now all stop the same way.
- **Stillness is designed.** Only a section's entrance moves: its heading lines and its photographs. Lists, tables,
  FAQ rows, blog rows and the collection grid do not animate at all — twenty-six tiles opening one after another
  turn a catalogue into a show.
- **Removed:** the blur in the collection → piece morph, the 1.1→1.06 zoom on the hero photograph, the scrubbed
  1.04 scale on the hero as the paper covers it, and the ±20px stagger in the drift band. Hover on a photograph
  is 2 %, inside its clip.
- **Photographs open, they do not fade — and only one thing moves.** Every well is an `ImageWell`:
  - `wipe` (default) — the mask opens from one edge, 1.1s on the site curve. Inside it the picture lags 2.5 %
    behind the sweep and settles, at a **fixed** 1.04 scale that never animates; the scale is only the
    bleed that keeps an edge from going empty while the picture slides. It is not a zoom.
  - `band` — the hero only: a centre strip widens outward to full frame, 1.4s, on load, the picture itself still. The type sits
    *outside* the mask and stays put while it opens
- **A photograph opens from the edge it is anchored to.** `from="left" | "right" | "top" | "bottom"`. A
  picture flush to the page's left edge opens left-to-right, one flush right opens right-to-left — so it
  reads as being drawn out of the margin it sits in, and a pair standing side by side **opens towards each
  other** instead of in lockstep. Give the second one a `revealDelay` as well: two identical moves fired at
  the same instant are what makes a layout look like a stock template rather than a composition.
- **Never stack three effects on one object.** Until 2026-09-20 a single photograph in the "In place"
  section faded (`Reveal`), zoomed (`scale(1.12)`) *and* wiped, all at once, and the two pictures beside
  each other did it in perfect unison. The design system had said "photographs open, they do not fade"
  from the beginning — `Reveal` was quietly overriding it from above. A block containing a well now
  animates **only its caption**; the picture belongs to `ImageWell`. Do not put a photograph and a
  paragraph inside one `Reveal` — the paragraph then arrives with no move at all.
- **Headings:** add `data-split-lines` to an `h2` inside a `Reveal` and it rises line by line from behind a mask (`SplitText` with `mask: "lines"`), 0.09s stagger — the hero's move, reused.
- **Drift band:** `DriftBand` — a strip of photographs travelling left, scrubbed to scroll position. Never a self-running marquee: if the reader stops, it stops. **Bags only** — the band is a procession of the work, not a scrapbook of the precinct; scenery and hall interiors belong in the `lifestyle` / `process` wells, not here. The bags stand on **one floor line** (no vertical stagger), and on the home page the band straddles the sumi/paper seam (`bridge`).
- **Enter:** text blocks 0.9s, opacity + 14px, half a beat after the heading; heading lines 1.0s from behind a clip. Home title uses SplitText lines.
- **Hover:** Image scale 1.02 inside its clip, 1.1s. No lift, no shadow bloom, no inverted fills.
- **The cursor names a thing, it is not a thing.** `CursorMark` lights a single word (`View`, `Zoom`) next
  to the pointer, and **only** over elements carrying `data-cursor` — a cut-out floating on a plinth and a
  transparent zoom hit-area are the two places where pressability cannot be read from the shape. It is a
  word under a hairline, rising from a mask, like every other reveal on the site. **Not a ring, not a
  disc:** there is no circle and no radius anywhere in this system, so a follower blob would instantly be
  the loudest form on the page — and a filled one would outshine the piece it is pointing at. Fine
  pointers and `lg` and up only.
- **Direction carries meaning; one direction for everything is a default, not a decision.** Counted on
  2026-09-20, seven of the site's ten moves were *rise from below* — blocks, heading lines, photograph
  masks, the cursor word, both curtains and the home sheet. Three of them fired in the same instant on
  every section, and a gesture repeated that often stops reading as care and starts reading as cheap.
  Direction now follows the **scale** of the move:
  - **Arriving at the site** — the entry curtain **parts**, two leaves withdrawing left and right.
  - **Changing page** — the new page **opens from the centre outward**, the band the hero already owns.
  - **Content landing in a section** — only the *heading lines* rise. Blocks merely appear; photographs
    open through their mask. Three different moves, so what is a heading and what is a photograph can be
    read from the movement alone.
- **Entry curtain:** `EntryCurtain` — once per session, ~2.1s. Wordmark rises from behind a mask, a rule
  draws under it, the place is named, then two leaves part and withdraw. The meeting edge of each leaf
  carries a 1px ivory hairline: a black leaf over a black page is invisible without a line to say where
  its edge is (same reason a contact shadow is a shelf line, see Color). **Never on a return visit within
  the session** — a curtain you sit through twice stops being a door and becomes a toll gate. The "already
  seen" flag is written by a one-line inline script in `SiteChrome`, *before paint*; deciding it in an
  effect shows the curtain for a frame on every subsequent page. (`<html suppressHydrationWarning>` in the
  root layout is what that costs — the attribute is not in the server HTML.)
- **Page transition:** CSS on `::view-transition-*(.page)` — the outgoing page recedes (`scale(0.985)`,
  380ms) while the incoming one opens from a centre band (620ms). **No DOM curtain.** The panel that used
  to slide up was not only the same gesture as everything else, it *manufactured its own wait*: half a
  second to cover before the navigation could even start. With both pages captured, the move costs nothing.
  - **React does not start a view transition unless a `<ViewTransition>` takes part in the update**, so
    `main` is wrapped in one (`SiteChrome`). Before that wrapper the `::view-transition-*(root)` rules in
    this repo had never run on an ordinary navigation — only the bag morph animated.
  - **Except where a piece morphs.** Collection ⇄ PDP is carried by the 720ms `bag-{folder}` morph, and a
    page opening underneath it would make two protagonists. Those links carry `data-morph` (and `Button`
    takes a `morph` prop); `PageTransition` puts that on `<html>` at click time and the CSS swaps in a
    quiet cross-fade. **Write `html[data-morph]::view-transition-old(…)` with no space** — the pseudo is
    attached *to* `html`, not descended from it, so a descendant combinator silently matches nothing.
- **View transition:** `bag-{folder}` morph, 720ms; header named `site-header` and frozen
- **Menu:** GSAP clip-path wipe + staggered nav lines; icon lines rotate to an X. Tablet and down (`xl:hidden`).
  **Choosing a destination is not the same gesture as closing.** Pick an item and the menu is gone on the next
  frame — you asked to be somewhere else, and the page is already changing underneath. Press X or Escape and it
  plays the opening backwards, at twice the speed it opened.
- **Float:** 3 cycles then stop (WCAG 2.2.2)
- **Respect:** `prefers-reduced-motion` — no Lenis, no SplitText, menu is instant
- **Do not:** loud parallax, infinite float, CSS hamburger transforms that fight GSAP

## Image roles (photography later)

Every well is a `Frame` (or equivalent) carrying `data-image-role` and `data-image-ratio`, so a later shoot can drop in without redesign. The caption shows only the human caption.

| Role | Ratio | Where |
|---|---|---|
| `hero-campaign` | 16∶10 | Home hero |
| `product-still` | 4∶5 (sometimes 1∶1) | Collection tiles, PDP lead still |
| `product-detail` | 4∶5, 1∶1 | PDP gallery mix |
| `material-macro` | 4∶5 | Material essay, blog |
| `process` | 3∶4, 1∶1 | Making, temple hall |
| `lifestyle` | 16∶10, 3∶4, 4∶5 | Campaign clusters |
| `blog` | as article | Blog posts |

Empty state: a `sumi` well with a `line` hairline on all four sides, plus role label + ratio. On the dark
ground an unfilled well is the same value as the page, so without the hairline it is not a well at all.
Do not use grey “image coming soon” boxes.

When new photography arrives: replace `src` only. Keep crop classes (`object-[50%_58%]` etc.) unless the new frame is stronger.

**No captions on photographs** (2026-09-25). Nine-and-a-half-pixel uppercase notes under every picture (“Corridor, Honmyoji”, “Ai · detail”) said nothing and read as generated. `caption` survives only for image descriptions inside Blog articles, set in sentence case like the text around it.

**Crop at the ratio it will be shown at.** A landscape source dropped into a 4∶5 well loses the cropped-away pixels, so the well upscales what remains and the weave goes soft. Cut the master at the display ratio (`scripts/prepare-images.py`) and give the well a `max-w` so it is never asked for more pixels than the master has. Role + ratio live in `data-image-role` / `data-image-ratio`; they are not printed in the caption (`showRole` defaults to off — to a reader they are just internal codes).

## Commerce behaviour

- No cart-as-checkout, but the control is **called Cart** — “Held” read as jargon to shoppers. The drawer is honest instead: “No card is charged here. Send your cart and a person writes back with payment details.”
- State lives in `localStorage` under `miroku-held` (key unchanged — renaming it would empty every existing cart).
- Mini-drawer titled “Cart” → “Send this cart” → Contact with `?product=slug,slug&subject=reserve`.
- Available pieces get **Add to cart**. Other states go straight to the matching inquiry subject.
- Stripe remains a later handoff, mentioned in copy, not a fake checkout UI.

## Copy tone

- English first. Japanese as atmosphere (one line), not a subtitle under every sentence.
- Short, material, specific. No “we are passionate,” no “curated luxury,” no “journey.”
- Product voice: texture, structure, use. Prices in Australian dollars, quietly — `A$220`, never a bare `$`.

## Why this is not a template

1. The hero is one photograph in a 48px mat, cut on the axis of its own symmetric composition, with its title pinned to the photograph's top edge and its caption to the bottom edge — nothing is printed over the picture.
2. Featured pieces are photographed on the same floor, before the same shoji, cut to the same height — so four different bags read as one room. No card chrome.
3. Material is an essay with a sticky title, not icon pillars.
4. The blog is a publication — one column of meaning, an article set at 980px — not a widget of teaser cards.
5. Collection is set in sections by kind of work (bottle bags, origami bags, handbags, shoulder bags, aprons), each with one sentence on what it is made of — a catalogue with chapters, not one long grid of 26.
6. The footer is always sumi: however a page ends, you leave through the hall. Its links are set in sentence case
   at reading size, not as a column of tiny tracked capitals.
7. Two grounds chosen by the light in the photographs, not by alternation.

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-08-30 | Newsreader + Source Sans 3 + Shippori | Editorial without costume luxury serif |
| 2026-08-30 | Drop gold / sumi footer | Avoid fake-luxury signals; moss/indigo from the cloth |
| 2026-08-30 | Hold / inquiry instead of cart checkout | Matches one-of-a-kind making and current ops |
| 2026-08-30 | Frame roles + ratios in captions | Photography can be swapped without layout work |
| 2026-08-30 | Readable slugs (`sakura-cherry`) | URL as a label; image folders stay short |
| 2026-08-30 | Lenis + GSAP menu / reveal | Designer-authored motion, reduced-motion safe |
| 2026-08-31 | Collection is all cut-outs on one 4∶5 stage | Mixed stills and cut-outs made nine pieces look like nine different sites. Same stage, same ground line, same caption block — only the object changes |
| 2026-08-31 | `cutoutAspect` in the product data | The stage is fixed, so the image box is derived (height × ratio). Gives a tight box for the view-transition morph and a shadow that matches the silhouette |
| 2026-08-31 | Material macro capped at 400px, re-cut at 4∶5 | It was filling half the page from a landscape crop, so the weave was upscaled and rough. Smaller and native beats larger and soft |
| 2026-08-31 | Form fields get a raised surface | A single hairline under each field is beautiful and unusable — nothing says where to type. `bg-lacquer` (was `bg-paper`) + full hairline + 15px text + a visible select chevron |
| 2026-08-31 | Errors are clay, not moss | Moss is the “available” colour. Failure must not be the same green as success |
| 2026-08-31 | Role · ratio dropped from captions | Shooting notes leaking onto the page; kept as data attributes |
| 2026-08-31 | Home featured: three equal plinths, hierarchy by hover | A 3× size gap between the feature and its two companions read as broken, not as emphasis. Same stage everywhere; `scale(1.06)` + 10px lift from the ground line singles out the piece under the cursor |
| 2026-08-31 | `.group:focus-within`, not `:focus-visible` | The focusable element is the link *inside* `.group`, so the old selector never matched — keyboard users had no hover feedback at all |
| 2026-08-31 | Mask-open replaces fade-in for photographs | Referencing cellato.tokyo. A fade says "an image loaded"; a mask says "a photograph is being shown to you." Same tone, more intent |
| 2026-08-31 | Drift band scrubbed, not self-running | An auto-marquee is a loop the reader cannot stop and fights WCAG 2.2.2. Tying it to scroll keeps the movement but hands control back |
| 2026-08-31 | Took cellato's motion, refused its palette | Their black ground / pill buttons / centred CTA stacks are exactly what this design system already rejected. The animation grammar transfers; the tone does not |
| 2026-08-31 | “Held” → “Cart” | Shoppers know what a cart is; “Held” had to be learned. The honesty stays in the copy inside the drawer, not in an obscure label. Storage key left as `miroku-held` |
| 2026-08-31 | Journal lead is landscape, list is one column of meaning | A 4∶5 lead pushed the headline a full photograph down the page, and the list spread topic / title / dek / date across 1400px so the eye had to jump four times. Meta grouped left, headline and dek together, arrow right |
| 2026-08-31 | Header is a three-zone grid, wordmark in Newsreader | `justify-between` on three unequal groups dropped the nav at an arbitrary x. `grid-cols-[1fr_auto_1fr]` with explicit `col-start` centres it — explicit, because a `display:none` nav shifts auto-placement on mobile. The wordmark was 12px sans, the same size as a nav item; at 23px Newsreader it reads as a masthead |
| 2026-08-31 | One left edge per article | Header left-aligned at 48px over a body centred at 360px meant the eye reset on every block. Everything now hangs off one 980px column; images rag right, text stops at 62ch |
| 2026-08-31 | Cart count only when the cart has something | `CART 00` is a state nobody needs told. `Cart` alone, `Cart (1)` when it matters |
| 2026-08-31 | Mobile PDP gallery is a swipe strip | Sakura's page was 7,089px on a phone, 2,400px of it a column of stills nobody scrolls to the end of. Sideways: 4,313px total, and the set is legible as a set |
| 2026-08-31 | “In place” recomposed on shared lines | A 16∶10 and a 3∶4 sat side by side with a 64px nudge — close enough to look like a mistake, far enough to look untidy. Now: wide photograph + text on one top line; two portraits below at one forced height, flush to both outer edges |
| 2026-08-31 | One button system, hairlines always visible | Most CTAs were 10px uppercase text with a hover-only underline — invisible as actions — and three hand-rolled ink buttons disagreed on size and tracking. `Button` now owns all five variants; `.link-cta` keeps the rule drawn |
| 2026-08-31 | Dropped the 縁 watermark | A 280px kanji at 4% behind the opening headline. It did not read as a mark, only as a smudge under the type |
| 2026-08-31 | Killed every `border-l` quote bar | Pull quotes on Journal and About, plus two Contact panels, all carried the markdown blockquote rule. It reads as generated, not designed. Quotes now work on size and space; panels take a full hairline |
| 2026-08-31 | One page column (`SHELL`), hero included | The hero had no `max-w` and a smaller gutter, so at 1920px the photograph ran 236px wider than every section under it, and at 1440px it missed the text edge by 16px. Not full bleed and not aligned — just off. Now the photograph's outer edge is the page's outer edge, and the H1 is inset 64px *inside* the picture, which is a decision anyone can read |
| 2026-08-31 | Vertical space on one side only | Sections mixed `mt-*` with `py-*`, so the gaps ran 112 / 256 / 176 / 240px. Backgrounded sections keep their inner `py`; the rest carry `pt` alone. Gaps now 80–136px and still uneven |
| 2026-08-31 | Journal header and list share one right edge | The list stopped at 1040px while “The archive” sat at the 1480px edge — two right edges, 300px apart, in one block |
| 2026-08-31 | A column stops where its content stops | The material essay (400px photo + 46ch) sat in a 6-column well and left a 200px hole; the intro paragraph was capped at 38ch inside a 440px column. Column and measure now agree |
| 2026-08-31 | Home featured is a swipe strip below `sm` | Three 4∶5 plinths stacked is 1,400px of mostly empty floor on a phone. Sideways, same as the PDP gallery: 9,942px → 8,296px |
| 2026-08-31 | `self-start` on the featured grid items | `FloatingBag`'s `h-full` stretched to the grid row, opening 56px of dead space under the caption and pushing the note out of its own row |
| 2026-08-31 | Selecting a menu item closes it instantly | `tl.reverse()` replayed the whole 1.19s entrance backwards, and a view transition froze the header 61ms in — so the menu sat on top of the page you had just navigated to for over a second. Selecting is now 16ms; X and Escape keep the choreography at 2× |
| 2026-08-31 | Prices are Australian dollars, written `A$220` | The site formatted with `en-US` + USD, so every price was a bare `$` that named no country, and the PDP then repeated the currency beside it as a separate `USD` tag — the same fact in two notations. One formatter now, `A$` (CLDR's standard symbol; `en-AU` would put the ambiguous bare `$` back), and the duplicate label is gone |
| 2026-08-31 | Journal splits into title column + list above `xl` | The list is capped at 1040px so it stays one column of meaning, which left a 344px void at the right of a 1384px page column. Above `xl` the section heading and “The archive” move into their own left column and the list runs to the page's right edge; below it, both stay stacked at 1040px |
| 2026-08-31 | CMS prose is set by us, not by the editor | Journal articles now come from microCMS as rich-editor HTML. `.blog-prose` holds them to the hand-built article's own measurements — 17px / 1.9 at 62ch, Newsreader headings, quotes on scale and air with no `border-l`, images ragging right of the measure, meta-cased `h4`. Nothing in the CMS sets colour or size |
| 2026-08-31 | Journal reads newest first | The index led with the oldest note and “Recent notes” on the home page listed the three oldest. Harmless with four fixed articles, wrong the moment someone publishes a fifth |
| 2026-08-31 | “Journal” → “Blog” | The nav item has to be understood before it is clicked, and “Journal” asks the reader to work out whether it is a diary, a magazine, or a stockist list. “Blog” costs one moment of editorial tone and saves every visitor the guess. The writing does not change — inside, articles are still *notes*. `/journal/*` redirects permanently to `/blog/*` |
| 2026-08-31 | 管理画面は罫線だけの表、カードを使わない | 十点を見比べる画面で一点ずつ枠に入れると、視線が枠をなぞることに使われる。`/studio` は ivory 地・ヘアライン・Newsreader の見出しという公開サイトの語彙をそのまま使い、角丸・影・アイコン列・カードは持ち込まない。版面だけ狭い（1180px）— 表を見ながら値を直す画面で、目が横に走る距離は短いほうがいい |
| 2026-08-31 | 在庫は一覧のまま切り替える | 一点物なので「売れた」を記録する回数がいちばん多い。そのたびに詳細を開いて保存を押すのは、一日に何度もやる操作の重さではない。選んだ時点で送る |
| 2026-08-31 | 編集欄の placeholder はコード側の値 | 空欄は「消す」ではなく「`data/products.ts` の値を使う」。何も入れなければこれが出る、が見えていないと、上書きしているのかどうか分からなくなる |
| 2026-08-31 | Stripe を入れ、カートは二段の導線に | 「Stripe は後日の手渡し」を取り下げた。主導線が Check out（solid）、その下に Ask about these（link）。鍵が無い環境では従来の「Send this cart」だけに戻るので、決済の準備ができていない状態でも売り物のページは死なない |
| 2026-08-31 | 写真の拡大表示も ivory の地で | 写真ビューアは黒く落とすのが定石だが、この店は「小さな展示カタログ」で展示室は明るい。一枚だけ暗室に持っていくと、そこだけ別のサイトに見える。周りの情報を減らすこと（キャプションと倍率と送りだけ）で集中させる |
| 2026-08-31 | 拡大は掴んで動かせて初めて拡大 | 倍率だけ上げても端が見られないビューアは、拡大していないのと変わらない。ホイール / ピンチ / ＋− で 100–400%、拡大中はドラッグでパン、写真を送るとズームは 100% に戻る（前の一枚の拡大位置が次に持ち越されると迷子になる） |
| 2026-08-31 | ホイールはカーソルの下を掴んだまま拡大する | 中心固定で拡大すると、見たかった場所が画面の外へ逃げていく。掴んだ一点が動かないよう位置を引き直す。同じ理由で、パンは「拡大で増えたぶんの半分」までに留める — 少し払っただけで写真が画面外へ消え、戻し方が分からなくなるのを防ぐ |
| 2026-08-31 | ヒーローの像も拡大対象、通し番号は一本 | 商品ページで一番大きく写っているものが押せないのは、押せることの分かりにくさより悪い。0 番がヒーローの像、1 番から下のギャラリー。下のサムネイルで全体が何枚か分かり、直接飛べる |
| 2026-08-31 | 送りは写真の上に浮かせず、下のバーに一本化 | 写真の両脇に矢印を置くと、拡大・移動のために stage が `setPointerCapture()` を取るので pointerup が奪われ、押しても click が来ない（実際に効かなかった）。閉じる・倍率・送りはすべて写真の外の帯に置き、ink の罫を常に引く — mist の 9.5〜11px に罫が無い状態は、そもそも操作に見えていなかった |
| 2026-08-31 | Swipe strips stand their piece in the middle | `snap-center` alone never centres: at `scrollLeft: 0` there is nothing to scroll against, so the browser rests at the left edge — the piece sat 25px left of the screen's middle and the next one was sliced through its own name at the right edge. `SwipeStrip` pads both ends with a blank cell of `(100 − card) / 2`, so the first and last piece stand centred too, and adds the hairline the `01 / 05` counter runs along. Home, PDP gallery and “Alongside” now share one component |
| 2026-09-01 | “Kimono Remake” → “Tote Bag” | 実物は九点とも畳の縁で、着物地は使っていない（先方確認）。区分名だけでなく `materials` と物語の「四十年箪笥にあった絹」も落とした。EC の商品説明で素材を言い違えるのは、デザインの前に事実の問題 |
| 2026-09-01 | Made to Order は clay、pill に「in your colours」 | 一点物だけの店に「同じ形を別の色で織り直せる」一段が増えた（翡翠・市松）。moss は「今ここにある一点」の色なので流用できない。clay は素材の色 —— 縁を選び直す話だから材料の側の色で言う。`/studio` の点は reserved と同じ clay になるが、点には必ずラベルが並ぶので色だけで読ませていない |
| 2026-09-01 | 完売は帯で言う | `Sold out` が 9px の mist で下のキャプションに並んでいるだけだったので、一覧を流し見して残っているものを数えられなかった。像を 55% に落とし、hover でも前に出さず、**像の縦中央**に ink の罫を一本引いてその真ん中で言う。pill も mist から ink へ。斜めのリボンやカードは使わない — 罫と語だけで、展示の「売約済」札に見える |
| 2026-09-01 | URL slug を画面から外した | カードにもヒーローにもカートにも `/sakura-cherry` が 15px で出ていた。作品名の下に URL を並べても読者には意味がなく、Newsreader の名前と競って二つ目の見出しに見える。`PieceSlug` は削除（URL は URL バーが言う） |
| 2026-09-16 | 地を黒へ。ヒーローの色に全ページを合わせる | 第一画面だけが暖かい黒で、その下が ivory の紙だった。一番強い一枚と残り全部の関係が「別の店」になっていて、スクロールするたび明るさが切り替わる。地をヒーローの族に寄せると、九点の織りがページで唯一の彩度になり、展示室の照明の下に置いたように見える。純黒は使わない — 冷たい黒の上では縁の赤も藍も濁る |
| 2026-09-16 | トークンは色名ではなく役どころ | 反転で `ivory`＝地 / `ink`＝文字 の名前が逆さまになるので、面は深さ順（onyx / sumi / lacquer）、文字は ivory と bone に付け替えた。`paper` のまま値だけ黒にすると、次に読む人は必ず明るい面だと思って使う |
| 2026-09-16 | 黒地では影ではなく光だまりで接地させる（→ 同日、棚板の罫に差し替え） | 12% の影は黒の上では存在しない。切り抜きが宙に貼り付いて見えるので、接地線を中心に ivory 11% の楕円を敷いた |
| 2026-09-16 | グラデーションを全部やめる | ヒーローの暗幕・スマホの継ぎ目・接地の光だまりの三つを外した。原稿を実測すると文字ゾーンは一番明るい画素でも ivory と 4.6:1 あり、暗幕は読みやすさのためではなく不安のために敷いていた。外すと織りの色が戻る。読みやすさは文字の不透明度（meta を 55%→75%）で払う |
| 2026-09-16 | 接地は光だまりではなく棚板の罫 | ぼかした楕円は結局グラデーション。接地線に ivory 25% のヘアラインを 1px 引き、台の内寸 6% で切る。九点が同じ高さで並ぶので一列が一枚の板に見え、hover で触れた一点の板だけが 45% に上がる。詳細ページだけは列いっぱい — 一番太い作品が列を埋めるので、内寸を取ると板からはみ出す |
| 2026-09-16 | カットアウトに透明の余白を残さない | 棚板を引いた瞬間、九枚の余白が不揃いなのが露出した（musubi は上下 300px、ai は右 344px）。枠は canvas の寸法で決まるので、余白はそのまま「板から浮く」「中心からずれる」になる。Musubi は 67px 浮き、Ai は台の中心から 13% 左にいた。九枚とも alpha の外接矩形で切り直し、見た目の大きさが変わらないよう当時の `cutoutScale` を同じ比率で落とした（この欄は後日廃止）。`scripts/prepare-images.py` の 4% パディングも外した（影は CSS の drop-shadow、浮遊は transform で、どちらも要素の外に描ける） |
| 2026-09-16 | 拡大表示も地に合わせて黒へ | 「一枚だけ別の明るさの部屋に持っていかない」という理由はそのまま。地が反転したので、同じ理由で ivory から sumi になった |
| 2026-09-16 | フッターは onyx、粒子は soft-light で 0.1 | 「near-black の高級フッター」を否定していたのは、明るい版に黒い板を貼るからだった。全部が黒なら、一段深い面はただの土台になる。粒子は multiply が効かないので明るい粒を soft-light で乗せるが、0.22 では節そのものが持ち上がって「明るい長方形の上辺」が見えた |
| 2026-09-16 | 九点を同じ背丈で立たせる（`cutoutScale` 廃止） | 実寸どおりに立てると、一列の中で像が 100 / 90 / 83 とばらつき、三点並べた最初の行が「撮り方が揃っていない」に見えた。実寸の大小は見せ場ではない —— 寸法は下の SPEC が cm で言うので、像の側で二度言う必要がない。図録は図版を同じ大きさで刷る、と同じ考え方。背丈は sakura が立っていた高さ（78%）に合わせたので、一番背の高い一点は動いていない。横に太い musubi と ichimatsu だけは同じ背丈だと棚板をはみ出すので、板の長さ（88%）で頭打ちにして低く立たせる —— はみ出させるくらいなら二点だけ低いほうがいい |
| 2026-09-19 | 入場に一枚の幕を置く | 要素が順にフェードしてくるのは「読み込みが終わった」で、「開演した」ではない。CELLATO / EISLAB / ESHIKOTO が揃って持っているのは、名前を見せてから中へ通す扉。ただし**同じセッションの二度目からは出さない** — 毎回待たされる幕は演出ではなく関所になる。判定は塗る前（body 先頭の一行）で、effect でやると二度目に一瞬だけ幕が見える |
| 2026-09-19 | 紙は一方向にしか動かない | 幕を降ろして上げ直すと「閉じて開いた」＝同じ部屋に戻ったように読める。入場の幕・遷移の幕・トップの版の面、三つとも下から上へ抜ける一方向に揃えた。先端には必ず ivory のヘアラインを一本 —— 暖かい黒の面が黒い版を覆うのは、線が無いと境目が見えない（棚板の罫と同じ理屈） |
| 2026-09-19 | モーフする導線にだけ幕を出さない | 一覧 ⇄ 商品ページは 720ms の `bag-{folder}` モーフが主役で、そこに幕を掛けるとモーフが黒い板の下で終わる。`data-morph`（`Button` は `morph` prop）が付いた導線だけ素通りさせ、それ以外は幕。クリックは**捕捉フェーズで `preventDefault` だけ** — `stopPropagation` を使うと、モバイルメニューが新しいページの上に開いたまま残る |
| 2026-09-19 | 章の柱を左の余白に立てる（表紙を除く） | 一枚の長いページは、節が続いているだけだと現在地が無い。JMM / HOSOO のように番号を一列立てる。ただし**ヒーローには出さない** —— 第一画面には縦組みの一行と足元の `01 — Honmyoji` が既にあり、レールを重ねると一画面に 01 が二つ、縦の要素が三本になった（実際に重なった）。現在地は横に伸びる線ではなく**番号の下の罫**で言う。左余白は 48px しかないので、横に伸ばすと本文の左端に数 px まで迫る |
| 2026-09-19 | カーソルは語であって物ではない | ORE / La Boca の「カーソルに語が付く」は借りるが、追従する円盤は借りない。この版には円も角丸も一つも無い（ボタンも StatusPill も罫と字だけ）ので、丸を一つ置いた瞬間それがページで一番強い形になる。灯すのは `data-cursor` を持つもの —— 台に浮いたカットアウトと、透明な拡大の当たり判定 —— の上だけ。形で「押せる」と言えない二箇所に限る |
| 2026-09-20 | 記事の行長を版面から切り離す（`--blog-measure`） | 本文が版面いっぱいの 940px を流れ、1 行 **119 文字**あった（実測）。`.blog-prose` の註は「内側で 62ch を切ると右が空洞になる」と書いていたが、逆だった —— DESIGN.md の「列は文字幅」は*列を狭くしろ*であって*文字を広げろ*ではない。560px / 約 70 文字へ。空いた右は穴ではなく、写真・引用・目次が入る余白 |
| 2026-09-20 | 段落の間は行間より広く | `1.7em`（28.9px）は行送り 1.9（32.3px）より**狭かった**ので、段落の切れ目が行の切れ目より目立たず、文章が一枚の壁に見えた。段落は `2.1em`。逆に見出しは直後を `1em` に詰める —— 上下が同じだと、どの文章に掛かる見出しか読めない |
| 2026-09-20 | ヘッダーの帯を不透明にする | `bg-sumi/92` の 8% を通して記事の引用（40px の ivory）が読め、ナビの語と重なって両方読めなくなっていた。地と同じ色なので、不透明にしても「板を貼った」には見えない。ぼかしは使わない（DESIGN.md がガラスを否定している） |
| 2026-09-20 | 長い記事に目次を立てる | 行長を切ると広い画面で右に 400px 空く。写真の無い記事ではそこが最後まで空のままになるので、長い記事ではそこを目次が持つ。見出し三つ以上のときだけ —— 二つの一覧は道具にならない。見出しは描かれた DOM から拾う（本文は CMS の HTML と手書きブロックの二系統あり、揃うのは描かれた後だけ） |
| 2026-09-20 | 一覧の見出しと説明を同じ右端で止める | 見出しが 9 カラム（660px）まで流れ、説明だけ 54ch（394px）で折り返していたので、一件読むたびに目の折り返し位置が 270px ずれていた。記事本文と同じ measure に揃えた |
| 2026-09-20 | 暖かい黒をやめ、中立の純黒へ | 2026-09-16 に「`#000` は使わない — 冷たい黒の上では縁の赤も藍も濁る」と決めたが、組み上げると逆だった。黒に差した茶が最初に目に入り、UI が色を持っている状態で、唯一色を持つべき布と競っていた。中立の黒にすると、ページで彩度を持つのは織りだけになる |
| 2026-09-20 | 地は一段だけ（`onyx` / `lacquer` / `ash` を廃止） | 持ち上がる面も沈む面も作らない。入力欄が入力欄なのは全周の罫、フッターがフッターなのは横切る罫、覆う面が覆っているのは上辺の罫 —— DESIGN.md の「黒の上では地は線」を面にも広げただけ。塗りで二つを分けたくなったら、それは二つ目の黒を戻している |
| 2026-09-20 | 完売は ivory から mist へ | 地が `#000`、光が `#fff` になって段が一斉に開き、`Sold out` がページで一番明るい語になった。買えるものより売り切れが目立つのは順序が逆。読み落とされない役目は像を横切る `SoldBand` が既に負っている |
| 2026-09-20 | 「紙は一方向」をやめ、所作の大きさで向きを分ける | 同日に入れた「入場・遷移・版の面を全部上向きに揃える」は誤りだった。数えると 10 の所作のうち 7 つが「下から上」で、一節ごとにブロック・見出し・写真の三つが同じ向きで同時に動いていた。同じ所作の反復は丁寧ではなく安く見える。入場は**割れる**、ページは**中央から開く**、節の中で上がるのは**見出しの行だけ** |
| 2026-09-20 | ブロックの `y: 26` を外す | 動かすのをやめたぶん、見出しの行だけが縦に動く。節の中で「これは見出し」「これは写真」が動きだけで読めるようになる（近接ではなく所作で区別する） |
| 2026-09-20 | 遷移の DOM 幕を捨て、View Transition で組む | 黒い板を上へ走らせる幕は、向きが揃っていた以前に**自分で待ち時間を作っていた**（覆う 0.5 秒 → 遷移 → 明ける 0.66 秒）。前後のページが両方ある状態で組めば、退く・開くが待ち無しで書ける。クリックの横取り・保険のタイマー・Lenis の停止再開も全部要らなくなった |
| 2026-09-20 | `main` を `<ViewTransition>` で包む | **React は `<ViewTransition>` が関与する更新でしか遷移を開始しない**。包む前は、この repo の `::view-transition-*(root)` の指定が作品のモーフ以外では一度も走っていなかった（計測して判明）。書いてあるのに効いていない CSS が一年分残る前に気付けた |
| 2026-09-20 | 写真一枚に効果を三つ重ねない | 「In place」の一枚が、フェード（`Reveal`）・寄り（`scale 1.12`）・マスクを同時にやっていた。DESIGN.md は最初から「写真は開く、フェードしない」と書いてあったのに、`Reveal` が上から `autoAlpha` を掛けて黙って上書きしていた。井戸を含むブロックは**キャプションだけ**動かす |
| 2026-09-20 | マスクは写真が着いている端から開く | 左端いっぱいの写真は左から、右端いっぱいの写真は右から。並んだ二枚が**互いに向き合って**開くので、一組の仕掛けに見えない。以前は三枚とも下から同時に開いていた（`revealDelay` でずらすのも併せて） |
| 2026-09-20 | 像の倍率は動かさない | 1.12 → 1 の寄りは、どこかで見た「写真が寄ってくる演出」そのもの。いま動くのはマスクの端と、それに 4% 遅れて追いつく平行移動だけ。倍率 1.06 は端が欠けないための余白で、固定（クラスではなく effect で置く — 空の井戸と reduced-motion に掛けないため） |
| 2026-09-25 | Photographer's shoot replaces the iPhone set; cut-outs retired | The collection was cut-outs floated on plinths because the source photos were phone shots against mismatched walls. The new shoot puts every piece on the same floor before the same shoji, so the photograph itself is the plinth. Standing pieces are cut to 4∶5 with the bag at the same height (84 %) and the same ground line (94 %); wide and flat pieces keep the photographer's 3∶2 frame (`LINE_RATIO`). The morph is photo → photo, same image, same ratio |
| 2026-09-25 | Hero: photograph and words side by side, nothing on the picture | The hero photograph is three bottle bags on brocade before the altar of the main hall — gold fittings, candles and flowers to every edge, so type on it cannot be read without a scrim, and a scrim is a gradient. Cropped to the page width it became 2.7∶1 and lost the handles or the brocade. Full height on the right eight columns keeps all three; the heading sits at the foot of the left four. (A window-lit portrait was tried first and dropped the same day: the person became the subject and the bag a prop — any kimono site could have that picture; only this temple has this altar.) |
| 2026-09-25 | Kickers, captions and letter-spaced Japanese sublines removed | Counted on the home page: seven headings, seven uppercase labels above them, five Japanese lines under them, six captions under photographs. None carried information the heading or the picture did not already give. `.eyebrow` is now a sentence-case label for tables and forms only |
| 2026-09-25 | Collection in sections, not filters | With 26 pieces in five kinds, a filter bar over one grid hid what the shop sells. Sections with an index at the top say it in one line; the status filter went because every piece is either coming soon or sold out until prices are set |
| 2026-09-25 | PDP gallery at the photographs' own ratios | The old gallery forced 4∶5 / 1∶1 / 16∶10 frames, which cut handles and floors off tall shots. Now two columns of native ratios (portrait 5∶8, landscape 8∶5); a single extra photograph is centred rather than left in half a grid |
| 2026-09-25 | No italic display type | The founder's closing message was set in Newsreader Light Italic — the one face on the page that looked chosen to seem expensive. Pull quotes (About, Blog), the FAQ heading, year labels and numerals are now upright Newsreader light; quotes are carried by size and leading alone |
| 2026-09-25 | The material section explains tatami before tatami-beri | Most buyers abroad have never stood in a tatami room, so “the edge of a tatami mat” named nothing. The section now goes room → edge → bag: a wide tatami room, a close view of one mat's edging, and three defined terms (Tatami, Tatami-beri, The bags) in a hairline table rather than three cards. The two photographs are Unsplash stock — the only images on the site not shot at Honmyoji, and never used for the work itself |
| 2026-09-25 | Two grounds: sumi `#11100E` and paper `#E9E2D6` | Pure black and pure white read as screen colours beside the cloth, and a page that never changed brightness had no chapters. The ground follows the photograph's light: candle-lit hall on sumi, daylit pieces and reading on paper. Tokens stay role names and flip inside `.surface-paper` |
| 2026-09-25 | Newsreader with its opsz axis; Albert Sans for body and UI | Fixed weights shipped only the opsz-16 text cut, so every display heading was set in a text face. Source Sans 3 read as documentation UI. Satoshi was the brief's first choice but its licence forbids distribution through a public repository |
| 2026-09-25 | Type scale as tokens (`text-hero` … `caps`), floor 11px | Headings of the same role differed by 2–4px from page to page because each carried its own clamp. Tiny uppercase with wide tracking survives only in nav, CTAs and the Sold-out band |
| 2026-09-25 | Buttons: `solid` and `link` only | The outlined rectangle under every navigational CTA was the most repeated template shape on the site. Word · hairline · drawn arrow, with the rule drawn in on hover |
| 2026-09-25 | Piece tile = photograph, name, price or status | The one-line note under every tile made the 26-piece grid a wall of text; it lives on the piece page and in the alt |
| 2026-09-25 | Motion: one curve, and stillness | `power4.out` / `cubic-bezier(0.22,1,0.36,1)` everywhere; lists, tables and the collection grid no longer animate; morph blur, hero zoom and drift stagger removed |
| 2026-09-25 | Section spacing tokens `beat` / `breath` / `pause` | `pt-28 md:pt-40` repeated on every section gave one rhythm. Three steps, chosen by how far the subject moves |
| 2026-09-25 | Leftover screenshot bars trimmed at the source | `trim_bars()` stopped at the first row carrying menu-bar text, leaving 37px of black on 33 photographs. Invisible on black, a hard line on paper |
| 2026-09-25 | Hero recomposed: centred crop, 7 columns, title top / caption bottom | It read cheap for four measurable reasons. The crop sat at 10 % although the three bags stand at 33–63 % of the frame, so they were pushed to the right edge and the drum and sutra books on the left became the subject — a symmetric altar turned into a cluttered snapshot. The photograph took 8 columns of candles and gold. The headline broke wherever it ran out of room (“…at a temple in / Fuji.”). And the frame sat on unrelated margins (24 / 32 / 48px). Now: `object-[48%_50%]`, 7 columns, a 48px mat on three sides (the page margin), the headline broken by phrase and sized so the longest phrase fills 85–90 % of five columns, its ink top on the photograph's top edge (measured to 1px) and the CTA rule on its bottom edge |
| 2026-09-25 | Poppins / Nunito Sans / Prompt replace Newsreader / Albert Sans | The client asked for the type of jimotofoods.com.au: Poppins Light for headings, Nunito Sans for body and UI, Prompt Light for the wordmark. Taken from Google Fonts (OFL) through `next/font`, not from that shop's CDN. Three things moved with the face: the hero is re-sized for Poppins's wider phrase (`4.9vw − 6.5px`, capped at 66px, so “woven by hand” fills 87 % of five columns; it had been wrapping to “woven by / hand” at 1024, 1280 and 1920) and pulled up 0.16em to keep its cap height on the photograph's top edge; split-line masks get 0.15em of room below (`splitLines()`), because Poppins's descenders were cut off; the hero is four phrases at every width (SplitText breaks at a `display:none` `<br>`, so the three-line tablet setting only ever appeared with reduced motion) |
| 2026-09-25 | No Japanese web font; three preloads | The site read as heavy. Measured on the production build (Lighthouse, mobile): the largest cost was not the new Latin faces but Shippori Mincho — 245 `@font-face` rules in a render-blocking 184KB stylesheet on every page, and up to 36 font files on the collection. Japanese now uses the device's Mincho; Poppins loads 300 only; Nunito Sans italic is no longer preloaded. Collection: 1,193KB → 569KB, first paint 3.5s → 1.1s, LCP 5.3s → 3.6s, score 73 → 90 (home 75 → 91, piece 69 → 90) |
