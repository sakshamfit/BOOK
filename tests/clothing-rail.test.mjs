import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const preview = join(root, "orion-preview");
const require = createRequire(import.meta.url);
const previewRequire = createRequire(join(preview, "package.json"));
const { build } = previewRequire("esbuild");
const postcss = createRequire(import.meta.resolve("@tailwindcss/postcss"))("postcss");
let temporary;
let rendered;

before(async () => {
  temporary = await mkdtemp(join(tmpdir(), "orion-clothing-rail-"));
  const outfile = join(temporary, "render.cjs");
  await build({
    stdin: {
      contents: `
        import React from "react";
        import { renderToStaticMarkup } from "react-dom/server";
        import OrionClothingRail, { ORION_RAIL_ITEMS } from "./components/clothing-rail-hero";
        export { ORION_RAIL_ITEMS };
        export { fitClothingRail, footprint, railTargets, railTurnAngle } from "./lib/clothing-rail-layout";
        export const markup = renderToStaticMarkup(React.createElement(OrionClothingRail, { autoplay: false }));
        export const homeMarkup = renderToStaticMarkup(React.createElement(OrionClothingRail, { autoplay: false, variant: "home" }));
      `,
      resolveDir: root,
      sourcefile: "clothing-rail-test.tsx",
      loader: "tsx",
    },
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    alias: {
      react: dirname(previewRequire.resolve("react/package.json")),
      "react-dom": dirname(previewRequire.resolve("react-dom/package.json")),
    },
  });
  rendered = require(outfile);
});

after(async () => { if (temporary) await rm(temporary, { recursive: true, force: true }); });

test("clothing page replaces the old top banner with exactly one rail", async () => {
  const html = await readFile(join(preview, "clothing.html"), "utf8");
  assert.equal((html.match(/id="clothing-rail-root"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /class="sub-hero"/);
  assert.match(html, /href="clothing-rail\.css\?v=/);
  assert.match(html, /src="clothing-rail\.js\?v=[^"]+" defer/);
  assert.match(html, /id="clothing-stores"/);
  assert.match(html, /href="#clothing-stores"/);
  assert.match(html, /clothing-folders\.js/);
  assert.match(html, /<!-- wordpress-export:start -->[\s\S]+<!-- wordpress-export:end -->/);
});

test("both pages and the generator reference the same cache-busted rail build", async () => {
  const versions = [];
  for (const name of ["index.html", "clothing.html", "create-pages.py"]) {
    const source = await readFile(join(preview, name), "utf8");
    const css = source.match(/clothing-rail\.css\?v=(\d+)/)?.[1];
    const js = source.match(/clothing-rail\.js\?v=(\d+)/)?.[1];
    assert.ok(css && js, `Missing cache version in ${name}`);
    assert.equal(css, js, `Mismatched CSS/JS versions in ${name}`);
    versions.push(css);
  }
  assert.equal(new Set(versions).size, 1);
});

test("all ten garments have their own ORION right-chest brand and contrasting ink", () => {
  const items = rendered.ORION_RAIL_ITEMS;
  assert.equal(items.length, 10);
  assert.equal(new Set(items.map((item) => item.id)).size, 10);
  assert.equal(new Set(items.map((item) => item.kind)).size, 6);
  for (const item of items) {
    assert.equal(item.brand, "ORION");
    assert.match(item.brandColor, /^#[0-9a-f]{6}$/i);
    assert.notEqual(item.brandColor, item.color);
    assert.equal(item.brandBakedIn, true);
    assert.match(item.image, /^\/images\/clothing-rail\/[a-z-]+-front\.webp$/);
    assert.equal(item.tag, undefined); // No artificial price/number tags.
    if (item.backImage) assert.notEqual(item.backImage, item.image);
  }
});

test("all garments use photographic cutouts with baked-in ORION rather than SVG fabric", () => {
  const { markup } = rendered;
  assert.equal((markup.match(/data-garment="\d+"/g) ?? []).length, 10);
  assert.equal((markup.match(/data-renderer="photo"/g) ?? []).length, 10);
  assert.equal((markup.match(/data-garment-brand="ORION"/g) ?? []).length, 10);
  assert.equal((markup.match(/<img data-garment-photo/g) ?? []).length, 10); // Back images load only on lift.
  assert.doesNotMatch(markup, /data-chest-brand=/); // No floating duplicate logo overlay.
  assert.match(markup, /<h1[^>]*>Your next favourite is on the rail\.<\/h1>/);
  assert.match(markup, /aria-haspopup="dialog"/);
  assert.match(markup, /href="#clothing-stores"/);
  assert.doesNotMatch(markup, /cdn\.21st\.dev|data-face="side"/);
});

test("the complete ten-piece rack fits phone, tablet and desktop widths for every selection", () => {
  const { fitClothingRail, footprint, railTargets } = rendered;
  // These are actual stage widths, including the narrower desktop gutters.
  for (const width of [240, 280, 320, 360, 390, 430, 576, 640, 704, 960, 1376, 1440]) {
    const layout = fitClothingRail(width, Array(10).fill(0.46));
    for (const front of [null, ...Array.from({ length: 10 }, (_, i) => i)]) {
      const centres = railTargets(layout, front);
      assert.equal(centres.length, 10);
      let lastRight = 0;
      centres.forEach((centre, i) => {
        const w = footprint(layout.h, i === front ? 0 : layout.restAngle, layout.sideWidths[i], layout.restAngle);
        const left = centre - w / 2;
        const right = centre + w / 2;
        const message = `${width}px, front ${front}, garment ${i}`;
        assert.ok(w > 0, `Invisible garment: ${message}`);
        assert.ok(left >= layout.padding - 0.001, `Clipped left: ${message}`);
        assert.ok(right <= width - layout.padding + 0.001, `Clipped right: ${message}`);
        assert.ok(left >= lastRight, `Overlapping/out-of-order garment: ${message}`);
        lastRight = right;
      });
    }
  }
});

test("compact layouts turn hangers edge-on without losing pieces or reserving offscreen slots", () => {
  const { fitClothingRail, railTargets } = rendered;
  const desktop = fitClothingRail(1376, Array(10).fill(0.46));
  const phone = fitClothingRail(390, Array(10).fill(0.46));
  assert.equal(desktop.compact, false);
  assert.equal(phone.compact, true);
  assert.ok(phone.restAngle < desktop.restAngle);
  assert.ok(phone.h >= 190); // A readable selected garment, not ten tiny thumbnails.
  assert.ok(phone.sideWidths.every((side) => side > 0 && side < 0.46));
  assert.ok(railTargets(phone, 0).every((x) => x > 0 && x < 390));
  assert.ok(railTargets(phone, 9).every((x) => x > 0 && x < 390));
  assert.deepEqual(fitClothingRail(390, []).sideWidths, []);
  assert.deepEqual(railTargets(fitClothingRail(390, []), null), []);
});

test("mid-turn projections share one front-facing slot instead of clipping end hangers", () => {
  const { fitClothingRail, footprint, railTurnAngle } = rendered;
  for (const width of [320, 390, 704, 1376]) {
    const { h, restAngle, sideWidths } = fitClothingRail(width, Array(10).fill(0.46));
    const side = sideWidths[0];
    const budget = footprint(h, 0, side, restAngle) + footprint(h, restAngle, side, restAngle);
    for (let step = 0; step <= 100; step++) {
      const progress = step / 100;
      const closing = restAngle * progress;
      const opening = restAngle * (1 - progress);
      const closingWidth = footprint(h, closing, side, restAngle);
      const openingWidth = footprint(h, opening, side, restAngle);
      assert.ok(Math.abs(closingWidth + openingWidth - budget) < 0.00001);
      for (const turn of [closing, opening]) {
        const angle = railTurnAngle(turn, restAngle);
        assert.ok(angle >= restAngle - 0.00001 && angle <= 0);
        const projectedWidth = h * 200 / 310 * Math.cos(angle * Math.PI / 180);
        assert.ok(projectedWidth <= footprint(h, turn, side, restAngle) + 0.00001);
      }
    }
  }
});

test("mixed garment widths and larger collections keep a complete ordered rack", () => {
  const { fitClothingRail, footprint, railTargets } = rendered;
  for (const sides of [[0.3], [0.3, 0.46], [0.26, 0.46, 0.38, 0.3, 0.42, 0.4, 0.46, 0.3, 0.35, 0.46], Array(24).fill(0.46)]) {
    for (const width of [280, 390, 704, 1440]) {
      const layout = fitClothingRail(width, sides);
      for (let front = 0; front < sides.length; front++) {
        const centres = railTargets(layout, front);
        centres.forEach((centre, i) => {
          const half = footprint(layout.h, i === front ? 0 : layout.restAngle, layout.sideWidths[i], layout.restAngle) / 2;
          assert.ok(centre - half >= 0 && centre + half <= width, `Clipped ${sides.length}-piece rack at ${width}px`);
          if (i) assert.ok(centre > centres[i - 1]);
        });
      }
    }
  }
});

test("both variants expose a full rack and accessible previous/next controls, never a cropped carousel", () => {
  for (const markup of [rendered.markup, rendered.homeMarkup]) {
    assert.match(markup, /data-layout="fit-all"/);
    assert.match(markup, /data-total="10"/);
    assert.doesNotMatch(markup, /data-mode="carousel"/);
    assert.match(markup, /All 10 pieces on the rail/);
    assert.match(markup, /aria-label="Previous garment"/);
    assert.match(markup, /aria-label="Next garment"/);
    assert.match(markup, /transform-origin:50% 1\.2903225806451613%/); // Pivot at the hook, not the middle of the photo.
  }
});

test("local front/back cutouts have transparent, identical 600 × 930 canvases", async () => {
  const files = rendered.ORION_RAIL_ITEMS.flatMap((item) => [item.image, item.backImage].filter(Boolean));
  assert.equal(files.length, 18);
  for (const file of files) {
    const bytes = await readFile(join(preview, file));
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    assert.equal(bytes.toString("ascii", 12, 16), "VP8X");
    assert.ok(bytes[20] & 0x10, `Missing alpha channel in ${file}`);
    assert.equal(bytes.readUIntLE(24, 3) + 1, 600);
    assert.equal(bytes.readUIntLE(27, 3) + 1, 930);
    assert.ok(bytes.length < 160_000, `Cutout is unnecessarily large: ${file}`);
  }
  const manifest = JSON.parse(await readFile(join(preview, "images/clothing-rail/manifest.json"), "utf8"));
  assert.equal(manifest.brand, "ORION");
  assert.equal(manifest.brandPlacement, "viewer-right-chest");
  assert.equal(manifest.items.length, 10);
});

test("pieces without a separate back photo never reuse their front as the back", () => {
  const frontOnly = rendered.ORION_RAIL_ITEMS.filter((item) => !item.backImage);
  assert.equal(frontOnly.length, 2);
  for (const item of frontOnly) {
    const index = rendered.ORION_RAIL_ITEMS.indexOf(item);
    const slot = rendered.markup.match(new RegExp(`data-garment="${index}"[\\s\\S]*?<\\/button>`))?.[0];
    assert.ok(slot);
    assert.match(slot, /data-face="front"/);
    assert.doesNotMatch(slot, /data-face="back"/);
  }
});

test("homepage adds the rail between fashion and cinema without replacing its hero", async () => {
  const html = await readFile(join(preview, "index.html"), "utf8");
  assert.equal((html.match(/id="clothing-rail-root"/g) ?? []).length, 1);
  assert.match(html, /id="clothing-rail-root" data-page="home"/);
  assert.match(html, /href="clothing-rail\.css\?v=/);
  assert.match(html, /src="clothing-rail\.js\?v=[^"]+" defer/);
  assert.ok(html.indexOf('class="fashion-showcase wrap"') < html.indexOf('id="clothing-rail-root"'));
  assert.ok(html.indexOf('id="clothing-rail-root"') < html.indexOf('class="cinema cinema-feature wrap"'));
  assert.match(html, /<section class="hero" id="top">/);
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
  assert.match(html, /<h2>Your next favourite is on the rail\.<\/h2>/);
  assert.match(html, /href="\/clothing\.html#clothing-stores"/);
  assert.match(html, /id="brand-wheel-root"/);
  assert.match(html, /id="coffee-pour"/);
});

test("homepage variant keeps all ten branded garments and uses a cross-page CTA", () => {
  const { homeMarkup } = rendered;
  assert.match(homeMarkup, /<h2[^>]*>Your next favourite is on the rail\.<\/h2>/);
  assert.doesNotMatch(homeMarkup, /<h1[ >]/);
  assert.match(homeMarkup, /href="\/clothing\.html#clothing-stores"/);
  assert.equal((homeMarkup.match(/data-garment="\d+"/g) ?? []).length, 10);
  assert.equal((homeMarkup.match(/data-garment-brand="ORION"/g) ?? []).length, 10);
  assert.equal((homeMarkup.match(/data-renderer="photo"/g) ?? []).length, 10);
});

test("generated Tailwind styles cannot leak into the existing directory or footer", async () => {
  const css = await readFile(join(preview, "clothing-rail.css"), "utf8");
  assert.doesNotMatch(css, /:root|:host|@tailwind|@import|@layer/);
  postcss.parse(css).walkRules((rule) => {
    assert.ok(
      /\[data-orion-rail\]|\[data-slot=|\.clothing-rail-fallback|#clothing-stores/.test(rule.selector),
      `Unscoped rule: ${rule.selector}`,
    );
  });
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /backface-visibility:hidden/);
});

test("the no-JavaScript fallback retains the heading and working store link", async () => {
  const html = await readFile(join(preview, "clothing.html"), "utf8");
  const fallback = html.match(/<div id="clothing-rail-root">([\s\S]*?)<\/section><\/div>/)?.[1];
  assert.ok(fallback);
  assert.match(fallback, /class="clothing-rail-fallback"/);
  assert.match(fallback, /<h1>Your next favourite is on the rail\.<\/h1>/);
  assert.match(fallback, /<a href="#clothing-stores">/);
});

test("page regeneration retains the rail replacement and its anchor", async () => {
  const generator = await readFile(join(preview, "create-pages.py"), "utf8");
  const isolated = `import sys\n${generator.replace("root=Path(__file__).parent", "root=Path(sys.argv[1])")}`;
  const generated = join(temporary, "generated");
  await mkdir(generated);
  const result = spawnSync("python3", ["-c", isolated, generated], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const clothing = await readFile(join(generated, "clothing.html"), "utf8");
  assert.match(clothing, /id="clothing-rail-root"/);
  assert.match(clothing, /id="clothing-stores"/);
  assert.match(clothing, /clothing-rail\.css/);
  assert.match(clothing, /clothing-rail\.js/);
  assert.doesNotMatch(clothing, /class="sub-hero"/);
  const footwear = await readFile(join(generated, "footwear.html"), "utf8");
  assert.match(footwear, /class="sub-hero"/);
  assert.doesNotMatch(footwear, /clothing-rail/);
});
