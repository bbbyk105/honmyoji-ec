# Design System — MIROKU

## Product Context

- **What this is:** An independent atelier site for one-of-a-kind tatami-beri bags made at Honmyoji Temple, Fuji City.
- **Who it's for:** Design-literate buyers of craft objects and independent fashion — not mass retail.
- **Space:** Contemporary Japanese craft / artisan fashion ecommerce.
- **Project type:** Editorial brand world with a working shop (reserve → inquiry → manual checkout).

## Memorable thing

A bag as a **held object** — leftover weave, one meeting, no reprint. The site should feel like a small exhibition catalogue, not a storefront.

## Aesthetic Direction

- **Direction:** Editorial / material-first. Quiet luxury without gold, black-marble, or zen cliché.
- **Decoration:** Intentional and rare. Paper grain, a beri band used as a section edge, thin rules. No cards, icons, or glass.
- **Never the left-bar blockquote** (`border-l` + indent + italic). It is the markdown-renderer default — the single clearest tell that nobody chose it. A pull quote earns its place through scale and air: large Newsreader italic at the body's own left edge, with room above and below. Panels get a hairline on all four sides, matching the form fields.
- **Mood:** Warm ivory room. Colour lives in the cloth. Type is literary, not “luxury template.”
- **What we refused:** 3-up feature rows, centered manifesto + CTA stacks, pill buttons, drop shadows, Shopify grids, beige Instagram boutique, startup landing structure.

## Typography

- **Display:** Newsreader (300 / italic) — optical, editorial, less costume than display Garamonds used on luxury templates.
- **UI / body:** Source Sans 3 (300–600) — clear, slightly condensed, bilingual-friendly.
- **Japanese:** Shippori Mincho — for secondary lines only. Never dump bilingual pairs on every heading.
- **Scale (approx.):**
  - Hero: clamp(44px, 7vw, 104px), leading ~0.92
  - Page title: clamp(40px, 6vw, 92px)
  - Section: clamp(32px, 4vw, 52px)
  - Deck: 22–26px Newsreader light
  - Body: 14–17px / 1.85
  - Meta: 9.5–10.5px uppercase, tracking 0.22–0.28em
- **Loading:** `next/font/google`, `display: "swap"`. Shippori `preload: false`.

## Color

Restrained. Accents are moss and faded indigo — colours already in the weave — used for status and rare emphasis, never as chrome.

| Token | Hex | Use |
|---|---|---|
| ivory | `#f3eee4` | Page ground |
| parchment | `#e8e0d2` | Alternate well, image empty state |
| stone | `#d4cbb8` | Soft fill |
| sand | `#c4b49a` | Warm support |
| paper | `#f8f4ec` | Raised note |
| ink | `#1a1714` | Type, rules, solid buttons |
| charcoal | `#352f29` | Body |
| mist | `#6f675c` | Meta, captions |
| line | `#d2c8b6` | Hairline |
| moss | `#4a5340` | Available, rare accent |
| indigo | `#3a4554` | Coming soon |
| clay | `#7d5c45` | Material note (sparing) |
| rose | `#a87268` | Sakura-related only, if ever |

No gold. No near-black luxury footer.

## Spacing

- **Base:** 8px
- **Density:** Spacious, with uneven section height so the page does not read as stacked modules
- **Page width:** 1480px. **Articles are 980px** — a note is read, not scanned.
- **Horizontal pad:** 16 / 20 / 32 / 48 — and it is not retyped per section. `SHELL` in
  `components/site/Shell.tsx` is the one page column; header, footer, hero and every home
  section use it. Written by hand it drifts: the hero had no `max-w` at all and sat 236px
  outside the column at 1920px, and half the sections said `px-4 sm:px-5` while the other
  half said `px-5`.
- **Section gaps:** 80–160px, not a repeated 96px rhythm. **Vertical space is carried on one
  side only** — a section that also paints a background (Intro, Craft) owns its inner `py`;
  everything else takes `pt` and nothing else. `mt-40` stacked on `py-24` is 256px, which no
  one chose and which reads as the page coming apart.
- **Measure:** body ~56ch (≈65 characters). Japanese is measured in `em`, never `ch` — `ch` is the width of “0”, so `42ch` of Shippori wraps at about 20 characters and becomes unreadable.
- **A column is as wide as its text.** A 56ch paragraph parked in a `col-span-7` leaves a hole; either narrow the column or put something in the other half. A short block beside a tall photograph is centred, not bottom-pinned — a pinned block reads as a mistake, a centred one reads as margin.

## Layout

- **Approach:** Creative-editorial. Asymmetric 12-column, but every block still lands on a shared line — a top, a bottom, or an outer edge.
- **An offset is a decision or it is a mistake.** A `mt-16` nudge between two images that nearly line up reads as a failed alignment, not as composition. Either share the line exactly (force one height so tops, bottoms and captions agree) or make the difference large enough that nobody reads it as an attempt. Nothing in between.
- **Photographs of different orientations do not share a height.** A 16∶10 next to a 3∶4 cannot align without gutting one crop — pair a landscape with *text*, and pair portraits with portraits (`wellClass="aspect-[4/5] md:aspect-auto md:h-[clamp(...)]"` on both).
- **Mobile:** Same hierarchy, fewer columns. Do not mechanically stack every pair. Captions stay under images.
- **Sets of photographs go sideways on mobile.** Five stacked 4∶5 stills is 2,400px of thumb. The PDP gallery and the “Alongside” row become snap-scrolling strips below `md` — one frame per screen, the next one peeking, a `01 / 05` counter. Stage ratio is uniform (4∶5) across a strip; mixed ratios make the band look broken. A set of one is not a carousel — it renders as a plain still.
- **Tablet:** Intermediate crops. Collection is a plain 1 / 2 / 3-column grid — the pieces are the variety, the frame should not be.
- **Radius:** Essentially none. Objects are cut-outs or flush photographs.
- **Buttons:** one system, `components/site/Button.tsx`. No pills, no shadows, no radius.
  - `solid` — the one thing to do here (Add to cart, Send, Send this cart). Ink fill, ivory text
  - `outline` — the next thing (Ask a question, See the nine, The collection). Hairline rectangle, fills on hover
  - `outline-light` — the same on a photograph
  - `link` / `link-light` — inline CTAs. **The rule is a permanent hairline, not a hover one** — an underline that only appears on hover does not tell anyone it is pressable, and at 10px uppercase it reads as body text
  - Every forward action carries `→`; back links pass `arrow={false}`. All variants are ≥44px tall.

## Motion

Reference: cellato.tokyo — but only its *grammar*, never its palette. Their vocabulary is
(1) photographs that **open through a mask** instead of fading, (2) headings that **rise line by line
from behind a mask**, and (3) a **horizontal band driven by vertical scroll**. All three work in an
ivory room; their black ground and pill buttons do not, and are not adopted.

- **Approach:** Intentional, almost invisible. Lenis for wheel; GSAP (`useGSAP`) for enter, menu, and reveal. Not a showreel.
- **Photographs open, they do not fade.** Every well is an `ImageWell`:
  - `wipe` (default) — mask opens from the bottom edge, 1.25s `expo.out`, while the image settles from `scale(1.12)` to 1
  - `band` — the hero only: a centre strip widens outward to full frame, 1.5s, on load. The type and gradient sit *outside* the mask and stay put while it opens
- **Headings:** add `data-split-lines` to an `h2` inside a `Reveal` and it rises line by line from behind a mask (`SplitText` with `mask: "lines"`), 0.09s stagger — the hero's move, reused.
- **Drift band:** `DriftBand` — a strip of photographs travelling left, scrubbed to scroll position. Never a self-running marquee: if the reader stops, it stops. **Bags only** — the band is a procession of the work, not a scrapbook of the precinct; scenery and hall interiors belong in the `lifestyle` / `process` wells, not here.
- **Enter:** 1.0–1.2s fade/translate, `power3.out`. Home title uses SplitText lines.
- **Hover:** Image scale 1.03. Cut-out objects lift 10px and scale 1.06 from the ground line (`transform-origin: 50% 100%`) — this is what carries hierarchy now that every plinth is the same size. No shadow bloom.
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
| `material-macro` | 4∶5 | Material essay, journal |
| `process` | 3∶4, 1∶1 | Making, temple hall |
| `lifestyle` | 16∶10, 3∶4, 4∶5 | Campaign clusters |
| `journal` | as article | Stories |

Empty state: parchment field + role label + ratio. Do not use grey “image coming soon” boxes.

When new photography arrives: replace `src` only. Keep crop classes (`object-[50%_58%]` etc.) unless the new frame is stronger.

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
- Product voice: texture, structure, use. Prices in USD, quietly.

## Why this is not a template

1. Hero is an inscribed photograph, not left-copy / right-image.
2. Featured pieces are three cut-out objects on identical plinths sharing one ground line — no photograph backgrounds, no card chrome. The one you point at comes forward.
3. Material is an essay with a sticky title, not icon pillars.
4. Journal is a numbered publication list, not a blog widget.
5. Collection is an exhibition — every piece cut out and floated on the same plinth, so nine different objects read as one show, not a merchandising grid of photographs.
6. Footer stays ivory. The dark “luxury plinth” is gone.

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
| 2026-08-31 | Form fields get a paper surface | A single hairline under each field is beautiful and unusable — nothing says where to type. `bg-paper` + full hairline + 15px text + a visible select chevron |
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
