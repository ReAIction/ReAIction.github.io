# ReAIction

Static marketing site. No build step, no dependencies: open `index.html` or serve the folder.

```
python3 -m http.server 8080   # then visit http://localhost:8080
```

## Files

| Path | What it is |
| --- | --- |
| `index.html` … `contact.html` | Six pages. Header, footer, and nav markup are duplicated in each — edit all six if you change navigation. |
| `assets/css/reaiction.css` | The whole design system. Tokens at the top. |
| `assets/js/reaiction.js` | Language toggle, mobile menu, scroll reveal, form validation. ~6 KB, no framework. |
| `assets/img/mark.svg` | Favicon. |

## Design system

Grounded in Apple's Human Interface Guidelines foundations (`color.md`, `typography.md`,
`layout.md`, `accessibility.md`, `liquid-glass.md`).

**Two layers, strictly.** Glass (`backdrop-filter`) appears only on the site header and the
mobile menu sheet — the *functional* layer. Content cards, sections, and the loop diagram are
opaque surfaces. Putting glass in the content layer is the single most common way this look
goes wrong.

**Colour carries meaning, not brand wallpaper.**

| Token | Light | Dark | Means |
| --- | --- | --- | --- |
| `--dry` | `#0b5fd0` (5.90:1) | `#6aa9ff` (8.73:1) | computation, in silico |
| `--wet` | `#a8430b` (6.05:1) | `#ff9d5c` (10.23:1) | experiment, in the lab |
| `--text` | `#1d1d1f` (16.83:1) | `#f5f5f7` (19.29:1) | primary content |
| `--text-2` | `#6e6e73` (5.07:1) | `#a1a1a6` (8.16:1) | secondary, safe at any size |
| `--text-3` | `#86868b` (3.62:1) | `#86868b` (5.80:1) | **light mode: 18 px and larger only** |

Ratios are against `#ffffff` / `#000000`. Fine print always uses `--text-2`.

**The wordmark.** `Re` + `AI` + `ction`, with the `AI` set in `--dry`, the computation token —
the same colour the loop diagram uses for the dry-lab half. It is the only place the wordmark
spends colour, and it is what makes the name's wordplay visible rather than merely clever.

**The signature: the measurement rule.** A hairline with ticks and monospace labels
(`.rule` in the CSS). It is used *only* where there is a real number — the search scale on the
home page, the timeline on About. Don't reuse it as decoration; that is the one thing holding
the site's point of view together.

**Type.** System UI stack (SF Pro on Apple devices) for voice; monospace for evidence — every
figure, tick label, and eyebrow is mono. Body is 17 px, the HIG mobile default.

**Appearance follows the system.** There is deliberately no light/dark switch in the UI
(`color.md`, `dark-mode.md`). Reduced motion, reduced transparency, and increased contrast all
have explicit answers in the CSS.

## Bilingual copy

Every translatable node carries `data-en` and `data-zh`; `reaiction.js` swaps `textContent` and
stores the choice in `localStorage`. Attributes use `data-en-<attr>` / `data-zh-<attr>`
(for example `data-en-aria-label`). Nodes that need inline markup use
`data-en-html` / `data-zh-html`.

To add a string: put both languages on the element and leave the English as the literal text
content, so the page still reads correctly with JavaScript disabled.

`?lang=zh` on any URL opens that page in Chinese, which makes localized links shareable;
otherwise the visitor's last choice is remembered in `localStorage`.

## Content status

**News was removed rather than faked.** The page, its nav entry, the footer link
and the home-page preview are all gone. Restoring it is one entry back in `NAV`,
one in `FOOT_COLS`, and the `NEWS` list plus `news_items()` in the generator —
see git history.

**Offices are Paris (Paris-Saclay), Chengdu (Tianfu New Area) and Suzhou
(NanoPolis, Suzhou Industrial Park).** Invented, but sited where a materials
chemistry company plausibly would be: Paris-Saclay is France's largest research
cluster (CEA, CNRS), and NanoPolis in SIP is China's nanotech and advanced
materials cluster. Replace with real addresses before launch.

**The team masthead lists Bowen Deng (Founder) and Fengming Shi (CTO, Theory)**
— name and role, nothing else.

**No affiliation line, deliberately.** An earlier draft carried "Chimie
ParisTech" on the reasoning that a member school outranks its umbrella
university in recognition. That holds for ENS and for ESPCI; it does not hold
here. PSL at least appears in the QS top 30; Chimie ParisTech is a 200-student
French grande école that is not separately ranked and means nothing to an R&D
director in Suzhou or Detroit. A credential line the reader cannot place is
worse than no line — it spends space competing on an axis this team loses.

**No bios, and no degree status.** Deep Principle leads with "Dr.", "PhD from
MIT", "70+ papers, cited 3400+" and Forbes 30 Under 30. Those are checkable
claims attached to named real people; they come from a CV, not from here. And
current PhD students should not open on the completed-degree axis at all. If a
line is added later it should say what was built or where it shipped, not where
anyone studied. `PEOPLE` in the generator has both fields ready and renders
them only when filled.

**Fengming Shi appears in Latin script in the Chinese version too**, because
guessing the characters for a real person's name gets it wrong more often than
not.

**Chinese micro-labels are 13px, not 11px.** CJK glyphs lose stroke detail at
the 11px monospace size the Latin labels use, and `text-transform: uppercase`
does nothing for them. Both are switched off under `[data-lang="zh"]`.

## Before you publish — placeholders to replace

- **"Kelvin"** is still a placeholder name for the agent. One command changes it:
  `sed -i '' 's/Kelvin/Hamilton/g' *.html` (and 哈密顿 for the Chinese strings).
- **The name collides with an existing product.** `reaiction.com` is registered and serves a
  live site branded "ReAIction – First AI-Based Reaction App". `reaiction.ai` and
  `github.com/reaiction` are free. Clear this with a trademark search before launch.
- **Home → statistics** (10 yrs / $2–20M / 55%) are industry estimates. The page says so in
  fine print; replace them with figures you can source, or delete the section.
- **About → timeline rule** (10 yr → 2 yr → 18 mo) is a placeholder.
- **About → Team** is an empty placeholder section.
- **Contact form** has no backend. `reaiction.js` says so plainly instead of faking success — point
  the form at your CRM or mail endpoint and remove that branch.
- Email addresses (`hello@`, `research@`, `press@`, `careers@`, `partners@`), office
  locations, the ICP filing number (Chinese hosting), and Privacy / Legal pages.

## Accessibility floors this site holds to

Checked at 485 / 768 / 1440 px on all six pages:

- No horizontal overflow anywhere, and no element escaping the viewport.
- Every link and button meets 28×28 pt on a pointer and 44×44 pt on touch. The language
  control keeps its small visual size and takes a 44 pt hit region from a pseudo-element,
  because the 48 px bar has no room to show one.
- All text clears 4.5:1, except `--text-3`, which is restricted to 18 px and larger in light
  mode where it measures 3.62:1.
- Content is fully visible before any script runs; the reveal animation is additive
  (`html.js`), so a blocked or failed script costs nothing.
- `prefers-reduced-motion`, `prefers-reduced-transparency`, and `prefers-contrast: more` each
  have an explicit answer in the CSS.


## Apple HIG audit — what was found and fixed

Three independent reviews were run against the apple-design skill (accessibility;
visual craft + Liquid Glass; content + interaction), then every finding was
re-verified before acting. Two reviews converged on the same two Critical issues.

**Critical — fixed, verified by sampling rendered pixels**

1. *Glass bar over dark content.* The header is 72% translucent and fixed. When a
   `.section--inverse` scrolled under it the composite measured **RGB(187,187,188)**,
   putting 13px nav labels at **2.64:1** (needs 4.5:1). Liquid Glass adapts between
   a light and dark appearance by sampling luminance; the web has no such API, so
   `reaiction.js` samples geometry and stamps `data-under="inverse"` on the header,
   which swaps in the already-correct inverse token set. Re-measured: **7.38:1**.
2. *`.loop__idx` used a large-text-only token at 11px.* `--text-3` on
   `--bg-elevated` is **3.33:1**; the token's own comment restricts it to >=18px.
   Now `--text-2` (**4.66:1**).

**Also fixed**

- Fixed header is 49px (48 + hairline) but content was offset 48px — 1px of every
  page sat under the border.
- `news.html` and `contact.html` skipped from `h1` to `h3`. Fixing it broke the
  home page (news previews became siblings of their own section heading), so the
  heading level is now passed by context.
- `--wet` was both "experiment" and "invalid input". Form errors now use `--danger`.
- Control borders (`--hairline-strong`) were 1.97:1, below the 3:1 non-text floor.
- The reveal could strand content invisible: `html.js` was set before the observer
  was wired, so anything throwing in between (e.g. `matchMedia.addEventListener`
  on Safari <= 13) left every page blank. The class is now set immediately before
  the observer, and the listener has a fallback.
- The mobile sheet did not move focus into itself or make the page behind inert.
- Form errors said "This field is required" — now per-field, saying how to fix it.
  The no-backend message was addressed to the developer; it now tells the visitor
  nothing was sent and gives them an email address.
- Placeholder notes said "replace with 贵司 data" — 贵司 means *the reader's*
  company everywhere else on the site, so the notes were instructing visitors to
  replace our numbers. All four rewritten as statements of fact.
- Home page news carried no placeholder note while `news.html` did.
- Chinese: 中试 (pilot scale) where the English said lab scale → 小试; 出场
  (meaningless) in the on-prem card; 研发战役 (military) → 研发攻关; 尚未被发现
  → 尚不存在; 「」 → "" for zh-Hans; 你/你们/贵司 register unified.
- Five `href="#"` per page (Privacy, Legal, three social icons) removed rather
  than shipped dead. **Re-add the social row with real URLs when the accounts exist.**
- `01 — Solution` … `05 — Solution` on five parallel industries was a fake
  sequence, and the eyebrow colour alternated dry/wet by index, which meant
  nothing. Replaced with the market each serves, in neutral colour.
- Mixed British/US spelling (18x "programme" beside "Hypothesize") → US.
- Touch targets: language control widened to 44px, footer links now fill their
  column, social row removed.
- Added `og:image` (generated from the site's own tokens), `og:url`, canonical,
  `twitter:card`, `apple-touch-icon` — share links previously rendered blank.
- `main` given `tabindex="-1"` so the skip link actually moves focus in WebKit.

**Known, not fixed — a judgment call**

The measurement rule's tick positions are evenly spaced, not log-scaled. One
review called this "an axis that lies". Read as a *quantitative* axis it is; read
as a *stage* sequence (candidate space -> simulated -> synthesized -> qualified)
with the magnitudes annotated per stage, it is honest. True log positions would
collapse the last three labels on top of each other. Left as stages; if you want
the axis reading, compute `--at` from `log10` and drop two labels.

**Still px-based type.** Browser zoom works; the browser's *font size* preference
does nothing, because nothing inherits from the root. Converting type to `rem`
(keeping control heights and breakpoints in px) is the fix if you want it.

## De-generifying pass

Measured before: 9 "X, not Y" antithesis constructions in 1,976 words, 34 triadic
lists, 16 em-dashes, 40 short aphoristic sentences. Those are the syntax of
generated marketing copy, and they were the loudest tell on the site — louder
than anything in the layout.

- **All 9 antitheses removed.** "Make a new material a decision, not a decade"
  became "Get a qualified material inside two years." "We are building the
  scientist, not the search engine" became "The bottleneck is how many times you
  can close the loop."
- **Aphoristic headlines replaced with statements.** "The loop only closes if
  something moves" -> "The agent has to be able to run the experiment."
  "Three engines, one loop" -> "What the agent runs on." "Five industries, one
  method" -> "Where we work."
- **The hero no longer leads with "AI scientist"** — the phrase every competitor
  in this category uses. It now states the actual differentiator: "The model
  proposes it. Our lab makes it."
- **The three big-number stat cards are gone**, replaced by two sentences. A hero
  built from a big number over a small label is a named generated-design pattern,
  and the page disclaimed all three figures one line below them.
- **The 01/02/03 markers on the solution bullets are gone.** Five parallel
  industries are a set, not a sequence.
- **One card grid became a definition list**, to break a page that ran
  eyebrow/headline/lead/three-cards four times.

**Triadic lists were left mostly alone, deliberately.** 33 of 34 are genuine
enumerations — "Literature, patents, and your own ELN", "DFT, MD, and surrogate
models", "Electrolytes, additives, and binders". A chemist listing three real
things is not a tell; deleting them would only make the copy vaguer. Two
rhetorical ones (three parallel "what counts as" clauses; three cards each
opening with a terse imperative) were rewritten.

**The five solution sections were left structurally identical**, also
deliberately. Parallel content earns parallel presentation; that is information
design, not template fatigue.

## apple-web pass — materials and motion

A second skill (`apple-web`, web-first and build-first, as opposed to the
HIG reviewer used earlier) was run over the material and motion layers.

**Glass was blur, not a material.** The reference is blunt: a real Apple
surface is four stacked optical effects — translucency, backdrop blur *with a
saturation boost*, a specular highlight on the lit edge, and a depth shadow with
a hairline rim. "Blur alone is 2020 glassmorphism, not Apple 2025." The header
had one and a half of the four. It now carries the rim and the depth shadow;
the mobile sheet carries the full recipe including the specular top edge.

**One deliberate deviation.** The recipe puts a specular highlight on the top
edge. A bar flush to the viewport top has no visible top edge, so that highlight
would render off-screen. It is applied to the sheet, whose top edge *is* visible
below the bar, and omitted from the bar.

**Motion was durations, not physics.** Everything was a fixed-time CSS
transition. Drawers and press feedback are things a user can grab, so they
spring. Apple's ship values (sheet: damping 0.8, response 0.3) are encoded as
CSS `linear()` curves sampled from the underdamped step response — no Motion or
GSAP, because a static marketing site with no gestures does not justify a
runtime, and the site's zero-dependency budget is worth more than the last few
percent of fidelity. Press feedback dropped from 220ms to 100ms: feedback begins
on pointer-down and must not lag it.

**Tracking was missing its small end.** The reference calls size-specific
tracking "the #1 tell of a non-Apple site". Large sizes were already tightened
correctly, but small text sat at 0 where it should be **positive** (+0.01em).
Captions, legal text, nav and footer links now use it; titles moved from
-0.01em to the specified -0.014em. `font-optical-sizing: auto` added — SF ships
Text and Display cuts and the OS only swaps them when asked.

**A cross-skill conflict, resolved.** The HIG-derived review said saturation
should be 1.2-1.5x and I had lowered it to 140%. `apple-web` specifies 180% for
regular material on nav bars. 180% restored: the web skill is specific to this
exact surface, and re-measured contrast through the glass is unchanged (7.38:1).

**A defect the numbers missed.** The adaptive bar redefines `--text` when dark
content is under it, but the wordmark has no `color` declaration of its own — it
inherits an already-computed value, which a token change does not revisit. So
"Re" and "ction" stayed near-black on the dark bar at roughly 1.3:1 while the
blue "AI" stayed legible. Contrast sampling had missed it by reading the wrong
pixels; looking at the rendered bar caught it in a second. `.header[data-under]`
now declares `color` explicitly. Measured after: 17.45:1.

## Surface scale and state layers

Borrowed in structure (not in values) from Spaceship's published design tokens,
which are served openly from their CDN at
`spaceship-cdn.com/sds/tokens/brand/spaceship/light-v-1-5-0.css`. Their 101
tokens for a single brand blue are organised as
`{text|icon|background|border|state-layer} x {minimal…contrast} x {hover|focus|pressed}`,
each with a hand-paired dark value. Two ideas were worth taking.

**Five surface levels instead of three.** `--surface-1…5` (page / minimal /
subtle / moderate / inverse). Cards on a `--surface-3` band now sit on
`--surface-2` and separate by depth rather than by a border. `--text-2` was
darkened from `#6e6e73` to `#6a6a6f` because the old value measured 4.27:1 on
surface-4 — below the floor. It now clears on all four light surfaces
(5.38 / 5.20 / 4.94 / 4.53).

**State layers.** Hover and press are a translucent wash of the element's *own*
colour, at fixed opacities, rather than a hand-picked colour per component:
8% hover / 12% press, and 16% / 24% on filled surfaces where the label colour
is doing the washing. Implemented as `background-image: linear-gradient(...)`
so it composites over any existing `background-color` without needing a
pseudo-element (`.link::after` is already the chevron).

**Applied selectively, on purpose.** Buttons, sheet rows, the language control,
the burger and footer links take the wash. Nav links change colour and inline
links underline — that is the platform behaviour, and washing them would make
the site less Apple, not more. Cards are excluded too: they lift 3px on hover,
and a dark wash on something moving toward you contradicts itself.

Values were not copied. `#394eff` is Spaceship's brand blue and stays theirs;
the CDN serving a token file for their own product is not a licence to reuse it.

## Deploying to GitHub Pages

The site is plain static files with relative asset paths, so it works from a
repository subpath (`username.github.io/repo/`) with no changes.

```bash
cd ~/reaiction-site
git init && git add -A && git commit -m "ReAIction site"
git branch -M main
git remote add origin git@github.com:<you>/<repo>.git
git push -u origin main
```

Then Settings -> Pages -> Source: `main` / root. `.nojekyll` is already present
so Pages serves the files as-is instead of running them through Jekyll.

**One line to change before the site is public.** `SITE` at the top of the
generator (and the `canonical` / `og:url` / `og:image` tags it produces) points
at `https://reaiction.ai`. Until that domain exists, either set `SITE` to the
GitHub Pages URL or drop the canonical — pointing a canonical at a domain that
does not resolve tells crawlers to index nothing.

## Spacing, type and inline styles

- **Spacing collapsed from fourteen ad-hoc values to five steps.** The inline
  `margin-top`s were 14/16/18/20/22/24/28/32/34/36/40/44/48/52px — a scale that
  fine is noise, since 20 and 22 are not distinguishable. Now `--space-4…8` with
  `.mt-4…8` utilities. Inline styles across the six pages: **77 -> 19**, and the
  19 that remain are genuine per-instance parameters (`--gap`, `--at`).
- **The 23 `margin-top:14px` after an eyebrow** were the same relationship
  written out 23 times. It belongs to the component: `.eyebrow + * { margin-top:
  var(--space-4) }`.
- **Type converted to rem.** All 34 `font-size` declarations, plus
  `html { font-size: 100% }`. Control heights, padding and breakpoints stay in
  px so touch targets do not shrink. Verified at 150% root size on three pages
  at 485px and 1440px: no overflow, hierarchy intact. Before this, the browser's
  own font-size preference did nothing at all on the site.
- **Card and loop-cell padding unified** on `--pad-card`. They previously
  differed by 6–10px, so text in adjacent components started on different x
  positions in the same column.

## Deploying

Any static host. For GitHub Pages, push the folder contents to the repository root or `docs/`
and enable Pages. No server-side code is required.
