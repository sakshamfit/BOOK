#!/usr/bin/env node
/**
 * Generates the eight demonstration book covers and the favicon as SVG.
 *
 * The original build used raster WebP artwork that stays local to the design
 * machine (see .gitignore). This script keeps a reproducible, tiny, crisp
 * typographic version in the repository so hosted deployments can render the
 * shelf, hero rail, and reading room without missing images.
 *
 * Run: node scripts/generate-covers.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";

const W = 720;
const H = 1080;
const MARGIN = 64;

const serif = "Georgia, 'Times New Roman', serif";
const sans = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const covers = [
  {
    file: "book-1.svg",
    bg: "#e8e1cc",
    ink: "#191c17",
    accent: "#1647ba",
    title: ["THE ART OF", "NOTICING"],
    author: "ELLA MARLOW",
    size: 92,
    motif: `
      <circle cx="360" cy="300" r="178" fill="#1647ba"/>
      <path d="M-20 430C140 300 250 500 400 370S610 210 740 330" fill="none" stroke="#191c17" stroke-width="3"/>
      <path d="M-20 470C160 350 260 520 420 400S620 250 740 360" fill="none" stroke="#191c17" stroke-width="1.4" opacity=".55"/>
      <circle cx="360" cy="300" r="228" fill="none" stroke="#191c17" stroke-width="1" opacity=".35"/>`,
  },
  {
    file: "book-2.svg",
    bg: "#1647ba",
    ink: "#f4f1e6",
    accent: "#d9d2bf",
    title: ["FORMS OF", "SILENCE"],
    author: "NOAH VALE",
    size: 96,
    motif: `
      <ellipse cx="300" cy="330" rx="190" ry="150" fill="#d9d2bf"/>
      <ellipse cx="300" cy="330" rx="190" ry="150" fill="none" stroke="#0b2a78" stroke-width="1" opacity=".45"/>
      <path d="M110 330h380M300 180v300" stroke="#0b2a78" stroke-width="1" opacity=".3"/>
      <rect x="520" y="205" width="120" height="250" fill="none" stroke="#f4f1e6" stroke-width="1.2" opacity=".7"/>
      <rect x="560" y="245" width="40" height="170" fill="#f4f1e6" opacity=".2"/>`,
  },
  {
    file: "book-3.svg",
    bg: "#ced736",
    ink: "#1d3a22",
    title: ["A FIELD GUIDE", "TO WONDER"],
    author: "IRIS WREN",
    size: 78,
    motif: `
      <g fill="none" stroke="#1d3a22" stroke-linecap="round">
        <path d="M360 640V150" stroke-width="4"/>
        ${Array.from({ length: 9 }, (_, i) => {
          const y = 200 + i * 48;
          const len = 150 - i * 11;
          return `<path d="M360 ${y}C${360 - len / 2} ${y - 26} ${360 - len} ${y - 6} ${360 - len} ${y + 12}" stroke-width="3"/>
                  <path d="M360 ${y}C${360 + len / 2} ${y - 26} ${360 + len} ${y - 6} ${360 + len} ${y + 12}" stroke-width="3"/>`;
        }).join("\n        ")}
      </g>
      <circle cx="360" cy="150" r="16" fill="#1d3a22"/>`,
  },
  {
    file: "book-4.svg",
    bg: "#a58bc6",
    ink: "#2c1c33",
    title: ["THE WORLD", "IN BETWEEN"],
    author: "MIRA SOL",
    size: 88,
    motif: `
      <circle cx="480" cy="210" r="118" fill="#e84928"/>
      <g fill="#4a2f57">
        <path d="M0 640V430a70 70 0 0 1 140 0v210z"/>
        <path d="M150 640V390a80 80 0 0 1 160 0v250z"/>
        <path d="M320 640V455a60 60 0 0 1 120 0v185z"/>
        <path d="M450 640V350a90 90 0 0 1 180 0v290z"/>
        <path d="M640 640V470a50 50 0 0 1 100 0v170z"/>
      </g>
      <g fill="#2c1c33">
        <path d="M0 560V430a70 70 0 0 1 140 0v130z" opacity=".85"/>
        <path d="M150 560V390a80 80 0 0 1 160 0v170z" opacity=".85"/>
      </g>
      <path d="M0 640h720" stroke="#2c1c33" stroke-width="2" opacity=".35"/>`,
  },
  {
    file: "book-5.svg",
    bg: "#e84928",
    ink: "#fdf2d8",
    title: ["AFTER THE", "LAST TRAIN"],
    author: "LEO ASH",
    size: 90,
    motif: `
      <rect x="120" y="140" width="480" height="330" rx="26" fill="#1a2f9c"/>
      <rect x="150" y="170" width="420" height="270" rx="14" fill="none" stroke="#fdf2d8" stroke-width="1.4" opacity=".65"/>
      <g stroke="#7f8fe8" stroke-width="1.6" opacity=".8">
        <path d="M150 235h420M150 300h420M150 365h420"/>
        <path d="M290 170v270M430 170v270"/>
      </g>
      <circle cx="360" cy="270" r="44" fill="#fdf2d8" opacity=".92"/>
      <g fill="#fdf2d8">
        <circle cx="560" cy="130" r="3"/><circle cx="640" cy="200" r="2"/><circle cx="96" cy="230" r="2.5"/>
        <circle cx="600" cy="520" r="2"/><circle cx="80" cy="470" r="2"/>
      </g>
      <path d="M120 520h480" stroke="#fdf2d8" stroke-width="6" opacity=".85"/>
      <path d="M0 590h720" stroke="#7a1c0d" stroke-width="1.2" opacity=".5"/>`,
  },
  {
    file: "book-6.svg",
    bg: "#262626",
    ink: "#f2ead4",
    title: ["THE SHAPE OF", "EVERYDAY"],
    author: "ADA REED",
    size: 92,
    motif: `
      <circle cx="245" cy="250" r="130" fill="#f2ead4"/>
      <rect x="380" y="120" width="260" height="260" fill="none" stroke="#f2ead4" stroke-width="2"/>
      <path d="M380 380h260v0" stroke="#f2ead4" stroke-width="2"/>
      <path d="M110 520L250 300l140 220z" fill="#f2ead4" opacity=".92"/>
      <path d="M340 380h300v140H340z" fill="#9a2f1c"/>
      <rect x="470" y="160" width="80" height="80" fill="#9a2f1c"/>`,
  },
  {
    file: "book-7.svg",
    bg: "#b4c6af",
    ink: "#173325",
    title: ["WILD", "ATLAS"],
    author: "JUNE ALDER",
    size: 104,
    motif: `
      <g fill="#173325" opacity=".9">
        <ellipse cx="250" cy="250" rx="120" ry="58" transform="rotate(-28 250 250)"/>
        <ellipse cx="410" cy="330" rx="140" ry="66" transform="rotate(18 410 330)"/>
        <ellipse cx="290" cy="430" rx="110" ry="52" transform="rotate(-8 290 430)"/>
        <ellipse cx="520" cy="220" rx="96" ry="48" transform="rotate(38 520 220)"/>
      </g>
      <g fill="none" stroke="#e7eee2" stroke-width="1.4" opacity=".55">
        <path d="M190 220C300 260 380 320 470 470"/>
        <path d="M230 190C340 240 420 310 505 440"/>
        <path d="M150 600C280 560 430 580 620 520"/>
        <path d="M150 640C290 600 440 620 620 560"/>
      </g>
      <circle cx="600" cy="150" r="34" fill="none" stroke="#173325" stroke-width="1.4"/>`,
  },
  {
    file: "book-8.svg",
    bg: "#efe2a1",
    ink: "#26241c",
    title: ["SMALL", "HOURS"],
    author: "EMIL NORTH",
    size: 104,
    motif: `
      <circle cx="270" cy="250" r="130" fill="#f8f1d3" stroke="#26241c" stroke-width="1.4"/>
      <circle cx="320" cy="215" r="130" fill="#efe2a1" stroke="none"/>
      <g fill="none" stroke="#26241c" stroke-width="1.2">
        <path d="M520 600V160"/>
        <path d="M520 260c-40-16-60-40-66-70M520 340c-46-18-70-46-78-80M520 420c-52-20-80-52-90-90M520 240c40-14 62-36 70-64M520 320c48-16 74-42 84-74"/>
      </g>
      <rect x="120" y="430" width="120" height="150" fill="#2c4bb0"/>
      <path d="M180 430v150M120 505h120" stroke="#efe2a1" stroke-width="3"/>
      <circle cx="600" cy="520" r="4" fill="#26241c"/>`,
  },
];

mkdirSync("public/covers", { recursive: true });

for (const cover of covers) {
  const titleTop = 800;
  // Keep long titles inside the trim: Georgia caps average ~0.6em per glyph.
  const longest = Math.max(...cover.title.map((line) => line.length));
  const size = Math.min(cover.size, Math.floor(560 / (0.6 * longest)));
  const lineGap = size * 0.94;
  const lines = cover.title
    .map(
      (line, i) =>
        `<text x="${MARGIN}" y="${titleTop + i * lineGap}" font-family="${serif}" font-size="${size}" letter-spacing="-2" textLength="${W - MARGIN * 2}" lengthAdjust="spacingAndGlyphs">${line}</text>`,
    )
    .join("\n  ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${cover.title.join(" ")} by ${cover.author}">
  <rect width="${W}" height="${H}" fill="${cover.bg}"/>
  <g>
    ${cover.motif}
  </g>
  <text x="${MARGIN}" y="${MARGIN + 14}" font-family="${sans}" font-size="17" letter-spacing="6" fill="${cover.ink}" opacity=".8">FOLIO</text>
  <g fill="${cover.ink}">
  ${lines}
  </g>
  <path d="M${MARGIN} ${titleTop + (cover.title.length - 1) * lineGap + 46}h${W - MARGIN * 2}" stroke="${cover.ink}" stroke-width="1.2" opacity=".45"/>
  <text x="${MARGIN}" y="${titleTop + (cover.title.length - 1) * lineGap + 104}" font-family="${sans}" font-size="21" letter-spacing="4" fill="${cover.ink}">${cover.author}</text>
  <text x="${W - MARGIN}" y="${H - MARGIN}" text-anchor="end" font-family="${serif}" font-size="26" fill="${cover.ink}">f.</text>
</svg>
`;
  writeFileSync(`public/covers/${cover.file}`, svg);
}

writeFileSync(
  "public/favicon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="12" fill="#f5f3ed"/>
  <text x="13" y="45" font-family="Georgia, 'Times New Roman', serif" font-size="40" fill="#232622">f</text>
  <circle cx="45" cy="42" r="5" fill="#e95436"/>
</svg>
`,
);

console.log(`Wrote ${covers.length} covers and favicon.svg to public/.`);
