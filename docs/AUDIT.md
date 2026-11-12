# Folio — design & code audit (29 Oct 2026)

A second pass over the storefront and the book "living editions", with what was changed and what is still open.

## What the audit found in the previous build

| Area | Finding | Status |
| --- | --- | --- |
| Typography | Georgia + a generic sans; many labels at 7–10px (eyebrows, footer, hints, captions) — hard to read and below accessibility guidance. | **Fixed.** Newsreader (editorial serif, optical sizes + italics) for headings, Schibsted Grotesk for UI text, Caveat only for handwritten labels inside the 3D scenes. Minimum UI text raised to 10–11px, body to 15px. |
| Hero | Books drifted in a flat line; no way to interact apart from clicking. | **Fixed.** A 3D ring of books: the front travels right-to-left (one lap ≈ 22s), drag to spin with inertia, hover slows it, back books are shaded, click opens the book. |
| 3D explanations | Models were plain boxes and spheres, needed a manual "Open this world" click, and had no narrative or camera direction. | **Rebuilt.** See "Living editions" below. |
| "Something will catch your eye" | A thin row of spines on a dark band. | **Rebuilt** after the reference image: lavender best-seller wall with watermark type, white floating shelf on brackets, books that drop onto the shelf, lift out on hover with a title tag, pointer parallax, plus three colour-blocked promotions (New Release / Top Sellers / Top Rated) with 3D tilt and a shine sweep. |
| Cards | Generic white cards. | **Added** the pastel "Discover a book" cards after the reference image (red icon badge, serif quote, draggable snapping carousel with dots and arrows, tilt + glare); book-grid cards now tilt with a glare. |
| Club + falling books | Mid-page section; the physics only moved bodies linearly, so books slid rather than tumbled. | **Moved into the footer.** New rigid-body physics with rotation, friction and settling: grab and throw, quick sweeps flick books, tap to bounce, double-click opens the book, "Shake the pile", title tooltip on hover. |
| Header | Static; no current-section or scroll feedback. | **Fixed.** Sticky, compacts with blur when scrolled, hides on scroll down / returns on scroll up, red reading-progress line, sliding current-section indicator, bag counter "bumps" when a book is added, saved-shelf count badge. |
| Motion system | Almost no feedback on buttons or sections. | **Added** scroll reveals, magnetic primary buttons, fill-sweep hovers, arrow nudges, marquee (pauses on hover). All disabled under `prefers-reduced-motion`. |

## Living editions (book open → 3D explanation)

Opening any book now plays a short film in the style of a pop-up physics textbook:

1. The closed book lies on a desk; the cover swings open, three pages flutter across, and the diorama springs up from the right-hand page.
2. Each of the three steps plays for ~11s with three captions, its own camera moves, and choreographed animation. The left page is a textbook spread (step title, a formula line, explanation, "Try this", and a **lift-the-flap** answer you can click). The right page carries the figure caption.
3. The look: white paper geometry shaded with pencil hatching (custom shader), ink outlines, colour reserved for meaning — glass jars whose coloured "stores" fill and drain, flowing ribbons between them, pulsing rings, handwritten cards, and jointed mannequin figures.
4. Floating control pill: chapters, previous, play/pause/replay, live caption, per-step progress, next, look closer, recentre, and a "Make it yours" panel (slider, choices, toggle). Drag to orbit, scroll to zoom, click coloured objects, Space/←/→ on the keyboard.

Each book has its own scene: a sunlit room (Noticing), a gallery that empties (Silence), a fern unfurling from a seed (Wonder), three doors and a traveller (World in Between), a night city and a train to dawn (Last Train), an exploded chair with load paths (Everyday), a relief-map landscape walk (Wild Atlas), a window from midnight to morning (Small Hours).

Code: `lib/worlds/kit.ts` (materials and helpers), `lib/worlds/engine.ts` (book, intro, timeline, camera, picking), `lib/worlds/scenes/*.ts` (one file per book), `components/worlds/ConceptExperience.tsx` (UI).

## Still open

- **Cross-browser:** verified in Chromium (desktop and 375px emulation) only — not yet on Safari, Firefox or real phones.
- **Camera framing:** most shots were checked by screenshot, but not every beat of every book; a few may still frame awkwardly.
- **GPU cost:** shadows plus the hatching shader are heavier than the old scenes. Pixel ratio is capped at 1.75; low-end phones may need a lighter quality tier.
- **No-WebGL fallback:** still the original illustrated SVG, which was not redesigned.
- **Dead CSS:** `app/globals.css` is a minified single-line file. Rules for the removed hero rail, spine shelf and old club section are now unused and can be deleted. The old `Folio Sans` @font-face declarations are no longer used either.
- **Commerce:** unchanged and still not live. Stripe isn't connected, all titles are demo titles, and the owner/admin settings in the README still need to be set before a public launch.
