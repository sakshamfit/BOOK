"use client";

import * as React from "react";
import { createPortal, flushSync } from "react-dom";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { fitClothingRail, footprint, railTargets, railTurnAngle, type ClothingRailLayout } from "../../lib/clothing-rail-layout";

export type GarmentKind = "tee" | "knit" | "hoodie" | "shirt" | "jacket" | "coat";

export interface RailGarment {
  id: string;
  /** Accessible name, caption and detail title. */
  name: string;
  description?: string;
  /** Built-in illustration, used when no image is supplied. */
  kind?: GarmentKind;
  color?: string;
  trim?: string;
  /** Transparent cut-outs should share a 200 × 310 canvas and scale. */
  image?: string;
  backImage?: string;
  sideImage?: string;
  tag?: string;
  details?: string[];
  /** The small wordmark on the right of the front-facing chest. */
  brand?: string;
  brandColor?: string;
  /** The photo already contains the chest embroidery; do not overlay a logo. */
  brandBakedIn?: boolean;
}

export interface ClothingRailHeroLabels {
  front: string;
  back: string;
  close: string;
  show: string;
}

export interface ClothingRailHeroProps extends React.ComponentProps<"section"> {
  items: RailGarment[];
  eyebrow?: string;
  heading?: string;
  headingAs?: "h1" | "h2";
  caption?: string;
  action?: React.ReactNode;
  autoplay?: boolean;
  interval?: number;
  hanger?: "wood" | "matte" | "none";
  labels?: ClothingRailHeroLabels;
  onOpenChange?: (index: number | null) => void;
}

type Face = "front" | "back";
type Material = "wood" | "matte" | "none";
const VB_W = 200;
const VB_H = 310;
const ASPECT = VB_W / VB_H;
const HOOK_TOP = 4;
const RAIL_R = 4.6;
const PERSPECTIVE = 1100;
const DEFAULT_LABELS: ClothingRailHeroLabels = { front: "Front", back: "Back", close: "Close", show: "Show" };

type Art = {
  body: string;
  sleeves: string[];
  under?: string;
  hood?: string;
  ribs: string[];
  panels: { d: string; t: number }[];
  seams: string[];
  stitches: string[];
  folds: string[];
  cords?: string[];
  buttons?: number[][];
};

const CREW = "M80,34 C88,45 112,45 120,34";

// The supplied rail's front, back and side illustrations stay local. Unlike the
// photo demo, they contain no third-party apparel branding or remote assets.
const ART: Record<GarmentKind, Record<Face, Art>> = {
  tee: {
    front: {
      body: `${CREW} C132,36 146,40 156,45 C160,48 163,52 164,57 C158,72 152,88 152,102 L153,236 C128,241 72,241 47,236 L48,102 C48,88 42,72 36,57 C37,52 40,48 44,45 C54,40 68,36 80,34 Z`,
      sleeves: ["M44,45 C38,47 33,50 31,55 C24,64 17,76 13,92 C18,100 24,106 30,110 C35,106 42,102 48,102 C47,84 45,62 44,45 Z", "M156,45 C162,47 167,50 169,55 C176,64 183,76 187,92 C182,100 176,106 170,110 C165,106 158,102 152,102 C153,84 155,62 156,45 Z"],
      under: "M80,34 C90,30 110,30 120,34 C112,45 88,45 80,34 Z",
      ribs: ["M80,34 C88,45 112,45 120,34 L124,36 C114,50 86,50 76,36 Z"],
      panels: [],
      seams: ["M80,34 C68,36 54,40 44,45", "M120,34 C132,36 146,40 156,45", "M48,102 C47,84 45,62 44,45", "M152,102 C153,84 155,62 156,45"],
      stitches: ["M14,93 C19,101 25,106 30,109", "M186,93 C181,101 175,106 170,109", "M50,229 C74,233 126,233 150,229"],
      folds: ["M40,56 C58,76 76,94 90,120", "M160,56 C142,76 124,94 110,120", "M70,126 C66,164 72,204 66,234", "M131,128 C135,164 129,204 134,234", "M100,112 C98,160 103,204 100,236", "M31,62 C27,74 23,84 21,96", "M169,62 C173,74 177,84 179,96", "M78,50 C88,58 112,58 122,50"],
    },
    back: {
      body: "M80,34 C90,31 110,31 120,34 C132,36 146,40 156,45 C160,48 163,52 164,57 C158,72 152,88 152,102 L153,236 C128,241 72,241 47,236 L48,102 C48,88 42,72 36,57 C37,52 40,48 44,45 C54,40 68,36 80,34 Z",
      sleeves: ["M44,45 C38,47 33,50 31,55 C24,64 17,76 13,92 C18,100 24,106 30,110 C35,106 42,102 48,102 C47,84 45,62 44,45 Z", "M156,45 C162,47 167,50 169,55 C176,64 183,76 187,92 C182,100 176,106 170,110 C165,106 158,102 152,102 C153,84 155,62 156,45 Z"],
      ribs: ["M80,34 C90,31 110,31 120,34 L121,38 C110,35 90,35 79,38 Z"],
      panels: [],
      seams: ["M80,34 C68,36 54,40 44,45", "M120,34 C132,36 146,40 156,45"],
      stitches: ["M14,93 C19,101 25,106 30,109", "M186,93 C181,101 175,106 170,109", "M50,229 C74,233 126,233 150,229"],
      folds: ["M40,56 C60,74 80,88 96,104", "M160,56 C140,74 120,88 104,104", "M72,120 C68,164 74,204 68,234", "M128,122 C132,164 126,204 132,234", "M100,60 C98,150 102,200 100,236", "M31,62 C27,74 23,84 21,96", "M169,62 C173,74 177,84 179,96"],
    },
  },
  knit: {
    front: {
      body: "M80,34 C88,46 112,46 120,34 L158,46 C162,52 163,60 163,70 L163,226 C140,231 60,231 37,226 L37,70 C37,60 38,52 42,46 Z",
      sleeves: ["M42,46 C32,52 27,62 26,76 L20,216 C26,221 36,222 44,219 L47,98 C46,80 45,62 42,46 Z", "M158,46 C168,52 173,62 174,76 L180,216 C174,221 164,222 156,219 L153,98 C154,80 155,62 158,46 Z"],
      under: "M80,34 C90,30 110,30 120,34 C112,46 88,46 80,34 Z",
      ribs: ["M37,211 L163,211 L163,226 C140,231 60,231 37,226 Z", "M21,203 L45,206 L44,219 C36,222 26,221 20,216 Z", "M179,203 L155,206 L156,219 C164,222 174,221 180,216 Z", "M80,34 C88,46 112,46 120,34 L125,37 C115,53 85,53 75,37 Z"],
      panels: [],
      seams: ["M47,98 C46,80 45,62 42,46", "M153,98 C154,80 155,62 158,46"],
      stitches: [],
      folds: ["M66,60 C62,110 70,160 64,210", "M134,62 C138,112 130,162 136,210", "M100,56 C98,110 102,160 100,210", "M33,80 C31,130 33,170 30,204", "M167,80 C169,130 167,170 170,204"],
    },
    back: {
      body: "M80,34 C90,31 110,31 120,34 L158,46 C162,52 163,60 163,70 L163,226 C140,231 60,231 37,226 L37,70 C37,60 38,52 42,46 Z",
      sleeves: ["M42,46 C32,52 27,62 26,76 L20,216 C26,221 36,222 44,219 L47,98 C46,80 45,62 42,46 Z", "M158,46 C168,52 173,62 174,76 L180,216 C174,221 164,222 156,219 L153,98 C154,80 155,62 158,46 Z"],
      ribs: ["M37,211 L163,211 L163,226 C140,231 60,231 37,226 Z", "M21,203 L45,206 L44,219 C36,222 26,221 20,216 Z", "M179,203 L155,206 L156,219 C164,222 174,221 180,216 Z", "M80,34 C90,31 110,31 120,34 L122,39 C110,35 90,35 78,39 Z"],
      panels: [],
      seams: ["M47,98 C46,80 45,62 42,46", "M153,98 C154,80 155,62 158,46"],
      stitches: [],
      folds: ["M68,60 C64,110 70,160 66,210", "M132,62 C136,112 130,162 134,210", "M100,50 C99,110 101,160 100,210"],
    },
  },
  hoodie: {
    front: {
      body: "M80,36 C88,47 112,47 120,36 L160,48 C164,54 165,62 165,72 L165,228 C141,233 59,233 35,228 L35,72 C35,62 36,54 40,48 Z",
      sleeves: ["M40,48 C30,54 25,64 24,80 L18,218 C24,223 35,224 43,221 L46,100 C45,82 43,64 40,48 Z", "M160,48 C170,54 175,64 176,80 L182,218 C176,223 165,224 157,221 L154,100 C155,82 157,64 160,48 Z"],
      hood: "M72,42 C64,28 68,12 86,8 L114,8 C132,12 136,28 128,42 C116,30 84,30 72,42 Z",
      under: "M78,38 C88,31 112,31 122,38 C112,48 88,48 78,38 Z",
      ribs: ["M35,213 L165,213 L165,228 C141,233 59,233 35,228 Z", "M19,205 L45,208 L43,221 C35,224 24,223 18,218 Z", "M181,205 L155,208 L157,221 C165,224 176,223 182,218 Z"],
      panels: [{ d: "M62,148 L138,148 L150,196 L50,196 Z", t: 0.035 }, { d: "M80,36 C76,46 80,56 92,60 L96,55 C88,52 84,45 85,38 Z", t: -0.12 }, { d: "M120,36 C124,46 120,56 108,60 L104,55 C112,52 116,45 115,38 Z", t: -0.12 }],
      seams: ["M62,148 L52,186", "M138,148 L148,186", "M46,100 C45,82 43,64 40,48", "M154,100 C155,82 157,64 160,48"],
      stitches: ["M64,151 L136,151", "M51,193 L149,193"],
      folds: ["M68,64 C64,110 70,140 66,148", "M132,66 C136,110 130,140 134,148", "M100,62 C98,100 102,130 100,148", "M31,84 C29,130 31,170 28,206", "M169,84 C171,130 169,170 172,206", "M76,198 C74,204 76,208 74,212", "M124,198 C126,204 124,208 126,212"],
      cords: ["M92,50 C91,72 89,88 90,104", "M108,50 C109,72 111,88 110,104"],
    },
    back: {
      body: "M80,36 C90,32 110,32 120,36 L160,48 C164,54 165,62 165,72 L165,228 C141,233 59,233 35,228 L35,72 C35,62 36,54 40,48 Z",
      sleeves: ["M40,48 C30,54 25,64 24,80 L18,218 C24,223 35,224 43,221 L46,100 C45,82 43,64 40,48 Z", "M160,48 C170,54 175,64 176,80 L182,218 C176,223 165,224 157,221 L154,100 C155,82 157,64 160,48 Z"],
      ribs: ["M35,213 L165,213 L165,228 C141,233 59,233 35,228 Z", "M19,205 L45,208 L43,221 C35,224 24,223 18,218 Z", "M181,205 L155,208 L157,221 C165,224 176,223 182,218 Z"],
      panels: [{ d: "M76,36 C66,50 64,82 80,110 C88,120 112,120 120,110 C136,82 134,50 124,36 C112,30 88,30 76,36 Z", t: -0.06 }],
      seams: ["M100,32 L100,118", "M46,100 C45,82 43,64 40,48", "M154,100 C155,82 157,64 160,48"],
      stitches: ["M80,108 C90,116 110,116 120,108"],
      folds: ["M70,120 C66,160 72,190 68,212", "M130,120 C134,160 128,190 132,212", "M31,84 C29,130 31,170 28,206", "M169,84 C171,130 169,170 172,206"],
    },
  },
  shirt: {
    front: {
      body: "M80,34 C88,40 112,40 120,34 L160,47 C164,53 165,60 165,70 L163,232 C150,244 124,242 100,238 C76,242 50,244 37,232 L35,70 C35,60 36,53 40,47 Z",
      sleeves: ["M40,47 C30,53 26,63 25,78 L21,204 L45,206 L47,98 C46,80 44,63 40,47 Z", "M160,47 C170,53 174,63 175,78 L179,204 L155,206 L153,98 C154,80 156,63 160,47 Z"],
      under: "M80,34 C90,29 110,29 120,34 L120,39 C110,34 90,34 80,39 Z",
      ribs: [],
      panels: [{ d: "M21,204 L45,206 L45,218 C37,220 28,220 21,217 Z", t: -0.05 }, { d: "M179,204 L155,206 L155,218 C163,220 172,220 179,217 Z", t: -0.05 }, { d: "M96,46 L104,46 L104,238 L96,238 Z", t: -0.03 }, { d: "M55,84 L87,84 L87,118 L71,124 L55,118 Z", t: 0.02 }, { d: "M113,84 L145,84 L145,118 L129,124 L113,118 Z", t: 0.02 }, { d: "M54,81 L88,81 L88,92 L71,96 L54,92 Z", t: -0.06 }, { d: "M112,81 L146,81 L146,92 L129,96 L112,92 Z", t: -0.06 }, { d: "M100,48 L80,34 C78,42 74,52 69,62 L90,64 Z", t: 0.04 }, { d: "M100,48 L120,34 C122,42 126,52 131,62 L110,64 Z", t: 0.04 }],
      seams: ["M96,64 L96,238", "M104,64 L104,238", "M47,98 C46,80 44,63 40,47", "M153,98 C154,80 156,63 160,47"],
      stitches: ["M57,116 L71,121 L85,116", "M115,116 L129,121 L143,116", "M39,230 C54,239 76,238 100,234 C124,238 146,239 161,230"],
      folds: ["M66,128 C62,170 68,200 62,234", "M134,128 C138,170 132,200 138,234", "M31,90 C29,130 31,170 28,200", "M169,90 C171,130 169,170 172,200"],
      buttons: [[100, 72], [100, 102], [100, 132], [100, 162], [100, 192], [100, 222], [71, 92], [129, 92]],
    },
    back: {
      body: "M80,34 C90,30 110,30 120,34 L160,47 C164,53 165,60 165,70 L163,232 C150,244 124,242 100,238 C76,242 50,244 37,232 L35,70 C35,60 36,53 40,47 Z",
      sleeves: ["M40,47 C30,53 26,63 25,78 L21,204 L45,206 L47,98 C46,80 44,63 40,47 Z", "M160,47 C170,53 174,63 175,78 L179,204 L155,206 L153,98 C154,80 156,63 160,47 Z"],
      ribs: [],
      panels: [{ d: "M21,204 L45,206 L45,218 C37,220 28,220 21,217 Z", t: -0.05 }, { d: "M179,204 L155,206 L155,218 C163,220 172,220 179,217 Z", t: -0.05 }, { d: "M80,34 C90,30 110,30 120,34 L122,41 C110,36 90,36 78,41 Z", t: 0.03 }, { d: "M40,47 L80,34 C90,30 110,30 120,34 L160,47 C162,56 163,62 164,68 C130,74 70,74 36,68 C37,62 38,56 40,47 Z", t: 0.025 }],
      seams: ["M36,68 C70,74 130,74 164,68", "M97,72 L97,238", "M103,72 L103,238"],
      stitches: ["M39,230 C54,239 76,238 100,234 C124,238 146,239 161,230"],
      folds: ["M70,90 C66,150 72,200 66,234", "M130,90 C134,150 128,200 134,234", "M31,90 C29,130 31,170 28,200", "M169,90 C171,130 169,170 172,200"],
    },
  },
  jacket: {
    front: {
      body: "M80,34 C88,40 112,40 120,34 L162,48 C166,54 167,61 167,72 L166,230 L34,230 L33,72 C33,61 34,54 38,48 Z",
      sleeves: ["M38,48 C28,54 24,64 23,80 L19,218 C26,222 37,222 44,219 L46,100 C45,82 42,64 38,48 Z", "M162,48 C172,54 176,64 177,80 L181,218 C174,222 163,222 156,219 L154,100 C155,82 158,64 162,48 Z"],
      under: "M80,34 C90,30 110,30 120,34 L122,40 C110,35 90,35 78,40 Z",
      ribs: [],
      panels: [{ d: "M100,58 L106,58 L106,230 L100,230 Z", t: -0.07 }, { d: "M112,86 L142,86 L142,118 L112,118 Z", t: 0.025 }, { d: "M46,152 L88,152 L88,198 L46,198 Z", t: 0.025 }, { d: "M112,152 L154,152 L154,198 L112,198 Z", t: 0.025 }, { d: "M100,58 L80,34 C72,40 64,50 58,64 L90,72 Z", t: -0.04 }, { d: "M100,58 L120,34 C128,40 136,50 142,64 L110,72 Z", t: -0.04 }],
      seams: ["M100,58 L100,230", "M46,100 C45,82 42,64 38,48", "M154,100 C155,82 158,64 162,48"],
      stitches: ["M114,88 L140,88 L140,116 L114,116 Z", "M48,154 L86,154 L86,196 L48,196 Z", "M114,154 L152,154 L152,196 L114,196 Z", "M35,224 L165,224", "M22,208 L44,210", "M178,208 L156,210"],
      folds: ["M70,74 C66,110 72,130 68,150", "M130,122 C134,136 130,146 132,150", "M68,200 C66,212 70,220 66,228", "M30,92 C28,140 30,180 27,214", "M170,92 C172,140 170,180 173,214"],
      buttons: [[106, 84], [106, 118], [106, 152], [106, 186], [106, 218]],
    },
    back: {
      body: "M80,34 C90,30 110,30 120,34 L162,48 C166,54 167,61 167,72 L166,230 L34,230 L33,72 C33,61 34,54 38,48 Z",
      sleeves: ["M38,48 C28,54 24,64 23,80 L19,218 C26,222 37,222 44,219 L46,100 C45,82 42,64 38,48 Z", "M162,48 C172,54 176,64 177,80 L181,218 C174,222 163,222 156,219 L154,100 C155,82 158,64 162,48 Z"],
      ribs: [],
      panels: [{ d: "M80,34 C90,30 110,30 120,34 L126,46 C110,39 90,39 74,46 Z", t: -0.04 }],
      seams: ["M36,76 C70,82 130,82 164,76", "M46,100 C45,82 42,64 38,48", "M154,100 C155,82 158,64 162,48"],
      stitches: ["M35,224 L165,224", "M36,80 C70,86 130,86 164,80"],
      folds: ["M70,90 C66,150 72,196 68,228", "M130,90 C134,150 128,196 132,228", "M30,92 C28,140 30,180 27,214", "M170,92 C172,140 170,180 173,214"],
    },
  },
  coat: {
    front: {
      body: "M80,34 C88,40 112,40 120,34 L164,50 C168,56 169,63 169,74 L174,294 L26,294 L31,74 C31,63 32,56 36,50 Z",
      sleeves: ["M36,50 C26,56 22,66 21,82 L16,240 C23,244 34,244 42,241 L45,104 C44,86 40,66 36,50 Z", "M164,50 C174,56 178,66 179,82 L184,240 C177,244 166,244 158,241 L155,104 C156,86 160,66 164,50 Z"],
      under: "M80,34 C90,28 110,28 120,34 L118,42 C110,37 90,37 82,42 Z",
      ribs: [],
      panels: [{ d: "M100,128 L106,128 L106,294 L100,294 Z", t: -0.06 }, { d: "M100,128 L80,34 C74,44 70,56 66,72 L76,78 L70,90 Z", t: 0.045 }, { d: "M100,128 L120,34 C126,44 130,56 134,72 L124,78 L130,90 Z", t: 0.045 }, { d: "M42,206 L84,206 L84,217 L42,217 Z", t: -0.05 }, { d: "M116,206 L158,206 L158,217 L116,217 Z", t: -0.05 }],
      seams: ["M100,128 L100,294", "M45,104 C44,86 40,66 36,50", "M155,104 C156,86 160,66 164,50", "M42,217 L84,217", "M116,217 L158,217"],
      stitches: ["M28,288 L172,288"],
      folds: ["M60,96 C56,170 64,230 54,292", "M140,96 C144,170 136,230 146,292", "M84,140 C82,200 86,250 82,292", "M28,96 C26,150 28,200 24,236", "M172,96 C174,150 172,200 176,236"],
      buttons: [[112, 146], [112, 180], [112, 214]],
    },
    back: {
      body: "M80,34 C90,30 110,30 120,34 L164,50 C168,56 169,63 169,74 L174,294 L26,294 L31,74 C31,63 32,56 36,50 Z",
      sleeves: ["M36,50 C26,56 22,66 21,82 L16,240 C23,244 34,244 42,241 L45,104 C44,86 40,66 36,50 Z", "M164,50 C174,56 178,66 179,82 L184,240 C177,244 166,244 158,241 L155,104 C156,86 160,66 164,50 Z"],
      ribs: [],
      panels: [{ d: "M80,34 C90,30 110,30 120,34 L124,48 C110,41 90,41 76,48 Z", t: 0.04 }, { d: "M100,232 L106,232 L106,294 L100,294 Z", t: -0.07 }],
      seams: ["M100,44 L100,294", "M45,104 C44,86 40,66 36,50", "M155,104 C156,86 160,66 164,50"],
      stitches: ["M28,288 L172,288"],
      folds: ["M62,96 C58,170 66,230 56,292", "M138,96 C142,170 134,230 144,292", "M28,96 C26,150 28,200 24,236", "M172,96 C174,150 172,200 176,236"],
    },
  },
};

const KINDS: GarmentKind[] = ["tee", "knit", "hoodie", "shirt", "jacket", "coat"];
const SIDE = {
  tee: { hem: 240, long: false, hood: false, width: 0.23 },
  knit: { hem: 232, long: true, hood: false, width: 0.25 },
  hoodie: { hem: 234, long: true, hood: true, width: 0.33 },
  shirt: { hem: 244, long: true, hood: false, width: 0.25 },
  jacket: { hem: 234, long: true, hood: false, width: 0.27 },
  coat: { hem: 296, long: true, hood: false, width: 0.27 },
};

function sideShapes(kind: GarmentKind) {
  const side = SIDE[kind];
  const hem = side.hem;
  const cuff = side.long ? hem - 24 : 104;
  const body = `M86,60 C85,96 88,132 85,168 C83,196 84,${hem - 18} 85,${hem} C92,${hem + 5} 109,${hem + 5} 116,${hem} C117,${hem - 18} 118,196 116,168 C113,132 116,96 114,60 Z`;
  const sleeve = `M84,56 C84,47 90,43 100,43 C110,43 116,47 116,56 C117,${Math.round(cuff * 0.62)} 119,${cuff - 14} 119,${cuff - 2} C119,${cuff + 4} 116,${cuff + 7} 111,${cuff + 7} C100,${cuff + 8} 90,${cuff + 6} 83,${cuff + 2} C80,${cuff - 1} 80,${cuff - 6} 81,${cuff - 10} C83,${cuff - 24} 83,70 84,56 Z`;
  const hood = side.hood ? "M110,46 C128,36 138,54 134,76 C130,90 118,94 113,86 C113,74 112,60 110,46 Z" : null;
  return { body, sleeve, hood, cuff };
}

function silhouettePaths(art: Art) {
  return [art.body, ...art.sleeves, ...(art.hood ? [art.hood] : [])];
}

const maskCache = new Map<string, string>();
function silhouetteMask(kind: GarmentKind, side: Face) {
  const key = `${kind}:${side}`;
  const cached = maskCache.get(key);
  if (cached) return cached;
  const paths = silhouettePaths(ART[kind][side]).map((d) => `<path d='${d}'/>`).join("");
  const url = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${VB_W} ${VB_H}' preserveAspectRatio='xMidYMin meet'>${paths}</svg>`)}")`;
  maskCache.set(key, url);
  return url;
}

function mix(color: string, amount: number) {
  if (amount === 0) return color;
  const keep = Math.round((1 - Math.min(1, Math.abs(amount))) * 1000) / 10;
  return `color-mix(in oklab, ${color} ${keep}%, ${amount > 0 ? "white" : "black"})`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lambert(angle: number) {
  const r = (angle * Math.PI) / 180;
  const diffuse = Math.max(0, Math.sin(r) * 0.42 + Math.cos(r) * 0.91);
  return 0.66 + 0.34 * diffuse;
}

function Defs({ uid }: { uid: string }) {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute" focusable="false">
      <defs>
        {KINDS.flatMap((kind) => (["front", "back"] as const).map((side) => (
          <clipPath key={`${kind}-${side}`} id={`${uid}-clip-${kind}-${side}`}>
            {silhouettePaths(ART[kind][side]).map((d) => <path key={d} d={d} />)}
          </clipPath>
        )))}
        <linearGradient id={`${uid}-volume`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="black" stopOpacity="0.34" /><stop offset="0.16" stopColor="black" stopOpacity="0.1" />
          <stop offset="0.42" stopColor="white" stopOpacity="0.07" /><stop offset="0.58" stopColor="white" stopOpacity="0.04" />
          <stop offset="0.84" stopColor="black" stopOpacity="0.12" /><stop offset="1" stopColor="black" stopOpacity="0.38" />
        </linearGradient>
        <linearGradient id={`${uid}-drape`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.16" /><stop offset="0.22" stopColor="white" stopOpacity="0" />
          <stop offset="0.75" stopColor="black" stopOpacity="0.04" /><stop offset="1" stopColor="black" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`${uid}-sidevol`} gradientUnits="userSpaceOnUse" x1="80" x2="120" y1="0" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0.14" /><stop offset="0.28" stopColor="white" stopOpacity="0.04" />
          <stop offset="0.7" stopColor="black" stopOpacity="0.08" /><stop offset="0.95" stopColor="black" stopOpacity="0.3" /><stop offset="1" stopColor="black" stopOpacity="0.18" />
        </linearGradient>
        <filter id={`${uid}-cloth`} x="-12%" y="-4%" width="124%" height="108%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016 0.028" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {KINDS.map((kind) => (
          <React.Fragment key={`side-${kind}`}>
            <clipPath id={`${uid}-sb-${kind}`}><path d={sideShapes(kind).body} /></clipPath>
            <clipPath id={`${uid}-ss-${kind}`}><path d={sideShapes(kind).sleeve} /></clipPath>
          </React.Fragment>
        ))}
        <linearGradient id={`${uid}-wood`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="color-mix(in oklab, sienna 55%, white)" /><stop offset="0.45" stopColor="color-mix(in oklab, sienna 80%, black)" /><stop offset="1" stopColor="color-mix(in oklab, sienna 45%, black)" />
        </linearGradient>
        <linearGradient id={`${uid}-woodgrain`} gradientUnits="userSpaceOnUse" spreadMethod="repeat" x1="0" x2="11" y1="0" y2="0.6">
          <stop offset="0" stopColor="black" stopOpacity="0" /><stop offset="0.45" stopColor="black" stopOpacity="0.16" /><stop offset="0.6" stopColor="white" stopOpacity="0.08" /><stop offset="1" stopColor="black" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-chrome`} gradientUnits="userSpaceOnUse" x1="98.5" x2="101.7" y1="0" y2="0">
          <stop offset="0" stopColor="color-mix(in oklab, white 45%, gray)" /><stop offset="0.35" stopColor="white" /><stop offset="0.78" stopColor="color-mix(in oklab, gray 65%, black)" /><stop offset="1" stopColor="color-mix(in oklab, gray 75%, white)" />
        </linearGradient>
        <pattern id={`${uid}-rib`} width="2.6" height="8" patternUnits="userSpaceOnUse"><rect width="1.1" height="8" fill="black" fillOpacity="0.2" /><rect x="1.3" width="0.7" height="8" fill="white" fillOpacity="0.08" /></pattern>
        <pattern id={`${uid}-knit`} width="5" height="4" patternUnits="userSpaceOnUse"><path d="M0,0 L2.5,4 L5,0" fill="none" stroke="black" strokeOpacity="0.09" strokeWidth="0.7" /></pattern>
        <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" /><feColorMatrix type="saturate" values="0" /><feComponentTransfer><feFuncA type="table" tableValues="0 0.55" /></feComponentTransfer>
        </filter>
        <filter id={`${uid}-soft`} x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation="2.4" /></filter>
      </defs>
    </svg>
  );
}

const HOOK = "M100,36 L100,-0.4 C100,-3.4 102.2,-4.2 103.9,-2.8 C104.9,-2 105.4,-1.2 105.6,-0.2";
const HOOK_HI = "M99.5,30 L99.5,-0.2 C99.5,-2.4 101,-3.2 102.4,-2.6";
const BAR = "M38,57 Q70,38 100,36 Q130,38 162,57";
const BAR_HI = "M40,54.5 Q71,35.5 100,33.5 Q129,35.5 160,54.5";

function Hook({ uid }: { uid: string }) {
  return <>
    <path d={HOOK} fill="none" stroke="black" strokeOpacity="0.28" strokeWidth="3.4" strokeLinecap="round" transform="translate(0.9 1.1)" />
    <path d={HOOK} fill="none" stroke={`url(#${uid}-chrome)`} strokeWidth="2.6" strokeLinecap="round" />
    <path d={HOOK_HI} fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="0.6" strokeLinecap="round" />
    <ellipse cx="105.9" cy="0.6" rx="1.9" ry="0.9" fill="black" fillOpacity="0.4" />
    <rect x="96" y="27" width="8" height="9" rx="2" fill={`url(#${uid}-chrome)`} /><rect x="97.2" y="28.2" width="2" height="6.6" rx="1" fill="white" fillOpacity="0.5" />
  </>;
}

function Hanger({ uid, side, kind, material }: { uid: string; side: Face; kind: GarmentKind | null; material: Material }) {
  const art = kind ? ART[kind][side] : null;
  const bar = material === "wood" ? `url(#${uid}-wood)` : "currentColor";
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMin meet" className="absolute inset-0 size-full overflow-visible text-foreground">
      {art?.hood && <><path d={art.hood} fill="var(--garment-color)" /><path d={art.hood} fill="black" fillOpacity="0.22" /></>}
      {art?.under && <path d={art.under} fill="var(--garment-under)" />}
      {material !== "none" && <>
        <path d={BAR} fill="none" stroke="black" strokeOpacity="0.25" strokeWidth="9.5" strokeLinecap="round" transform="translate(0.6 1.6)" />
        <path d={BAR} fill="none" stroke={bar} strokeWidth="8.5" strokeLinecap="round" />
        {material === "wood" && <path d={BAR} fill="none" stroke={`url(#${uid}-woodgrain)`} strokeWidth="8.5" strokeLinecap="round" />}
        <path d={BAR_HI} fill="none" stroke="white" strokeOpacity={material === "wood" ? 0.3 : 0.14} strokeWidth="1.1" strokeLinecap="round" /><Hook uid={uid} />
      </>}
    </svg>
  );
}

function SideHanger({ uid, material }: { uid: string; material: Material }) {
  if (material === "none") return null;
  return <svg aria-hidden="true" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMin meet" className="absolute inset-0 size-full overflow-visible text-foreground">
    <path d="M97.8,35 L102.2,35 L104.5,50 L95.5,50 Z" fill={material === "wood" ? `url(#${uid}-wood)` : "currentColor"} />
    <path d="M98.6,36 L100,36 L100,49 L97.3,49 Z" fill="white" fillOpacity="0.22" /><Hook uid={uid} />
  </svg>;
}

function ChestMark({ kind, brand = "ORION", color = "#f5f2e9" }: { kind: GarmentKind; brand?: string; color?: string }) {
  // In garment coordinates, keep the mark on the right of the visible chest;
  // pocketed pieces need a slightly lower position, clear of collars/buttons.
  const x = kind === "coat" ? 144 : kind === "jacket" ? 127 : 129;
  const y = kind === "shirt" || kind === "jacket" ? 106 : kind === "coat" ? 112 : 85;
  return <g data-chest-brand={brand} data-placement="right-chest" aria-hidden="true">
    <text x={x} y={y + 0.5} textAnchor="middle" fontSize="7.2" fontWeight="700" letterSpacing="0.8" fill="black" fillOpacity="0.15">{brand}</text>
    <text x={x} y={y} textAnchor="middle" fontSize="7.2" fontWeight="700" letterSpacing="0.8" fill={color}>{brand}</text>
    <path d={`M${x - 9},${y + 3} h18`} stroke={color} strokeWidth="0.45" opacity="0.6" />
  </g>;
}

function Fabric({ uid, kind, side, color, trim, brand, brandColor }: { uid: string; kind: GarmentKind; side: Face; color: string; trim: string; brand?: string; brandColor?: string }) {
  const art = ART[kind][side];
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMin meet" className="absolute inset-0 size-full overflow-visible">
      <path d={art.body} fill={color} />{art.sleeves.map((d) => <path key={d} d={d} fill={color} />)}
      <g clipPath={`url(#${uid}-clip-${kind}-${side})`}>
        {kind === "knit" && <rect width={VB_W} height={VB_H} fill={`url(#${uid}-knit)`} />}
        {art.panels.map((panel) => <path key={panel.d} d={panel.d} fill={mix(color, panel.t)} />)}
        {art.ribs.map((d) => <path key={d} d={d} fill={trim} />)}
        {art.ribs.map((d) => <path key={`${d}-rib`} d={d} fill={`url(#${uid}-rib)`} />)}
        <g filter={`url(#${uid}-soft)`} fill="none" strokeLinecap="round">
          {art.folds.map((d) => <path key={d} d={d} stroke="black" strokeOpacity="0.22" strokeWidth="4" />)}
          {art.folds.map((d) => <path key={`${d}-hi`} d={d} stroke="white" strokeOpacity="0.1" strokeWidth="2" transform="translate(2.2 0)" />)}
          {art.sleeves.map((d) => <path key={`${d}-edge`} d={d} stroke="black" strokeOpacity="0.2" strokeWidth="3" />)}
        </g>
        <rect width={VB_W} height={VB_H} fill={`url(#${uid}-volume)`} /><rect width={VB_W} height={VB_H} fill={`url(#${uid}-drape)`} />
        {side === "front" && <ChestMark kind={kind} brand={brand} color={brandColor} />}
        <rect width={VB_W} height={VB_H} filter={`url(#${uid}-grain)`} opacity="0.16" style={{ mixBlendMode: "multiply" }} />
      </g>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {art.seams.map((d) => <path key={d} d={d} stroke="black" strokeOpacity="0.22" strokeWidth="0.8" />)}
        {art.stitches.map((d) => <path key={d} d={d} stroke={mix(color, 0.35)} strokeOpacity="0.5" strokeWidth="0.6" strokeDasharray="1.6 1.4" />)}
        {art.cords?.map((d) => <path key={d} d={d} stroke={trim} strokeWidth="1.8" />)}
      </g>
      {art.cords?.map((d) => {
        const end = d.trim().split(" ").at(-1)?.split(",").map(Number) ?? [0, 0];
        return <rect key={`${d}-tip`} x={(end[0] ?? 0) - 1.4} y={(end[1] ?? 0) - 1} width="2.8" height="6" rx="1" fill={mix(trim, -0.3)} />;
      })}
      {art.buttons?.map(([x, y]) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="2.6" fill={mix(trim, -0.15)} /><circle cx={x - 0.6} cy={y - 0.7} r="0.9" fill="white" fillOpacity="0.45" /></g>)}
    </svg>
  );
}

function SideArt({ uid, kind, color, trim }: { uid: string; kind: GarmentKind; color: string; trim: string }) {
  const { body, sleeve, hood, cuff } = sideShapes(kind);
  const soft = `url(#${uid}-soft)`;
  const hem = SIDE[kind].hem;
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMin meet" className="absolute inset-0 size-full overflow-visible">
      <g filter={`url(#${uid}-cloth)`}>
        {hood && <><path d={hood} fill={mix(color, -0.14)} /><path d={hood} fill="none" stroke="black" strokeOpacity="0.2" strokeWidth="1.2" /></>}
        <path d={body} fill={color} />
        <g clipPath={`url(#${uid}-sb-${kind})`}>
          {kind === "knit" && <rect width={VB_W} height={VB_H} fill={`url(#${uid}-knit)`} />}
          <g filter={soft} fill="none" strokeLinecap="round">
            <path d={`M90,${cuff + 10} C87,150 92,190 88,${hem - 4}`} stroke="black" strokeOpacity="0.24" strokeWidth="2.6" />
            <path d={`M92,${cuff + 10} C89,150 94,190 90,${hem - 4}`} stroke="white" strokeOpacity="0.14" strokeWidth="1.2" />
            <path d={`M106,${cuff + 6} C109,140 104,186 108,${hem - 2}`} stroke="black" strokeOpacity="0.17" strokeWidth="2.2" />
            <path d={`M107.6,${cuff + 6} C110.6,140 105.6,186 109.6,${hem - 2}`} stroke="white" strokeOpacity="0.1" strokeWidth="1" />
            <path d={`M99,${cuff + 30} C97,170 101,205 98,${hem - 2}`} stroke="black" strokeOpacity="0.1" strokeWidth="2" />
            <path d={`M112,${cuff + 40} C113,170 111,200 113,${hem - 10}`} stroke="black" strokeOpacity="0.12" strokeWidth="1.6" />
            <path d={`M84,${cuff + 50} C86,160 85,200 86,${hem - 6}`} stroke="white" strokeOpacity="0.2" strokeWidth="1.4" />
            <path d={`M80,${cuff + 6} C90,${cuff + 12} 110,${cuff + 12} 120,${cuff + 7}`} stroke="black" strokeOpacity="0.4" strokeWidth="6" />
            <path d={`M84,${hem + 1} C92,${hem + 6} 108,${hem + 6} 116,${hem + 1}`} stroke="black" strokeOpacity="0.32" strokeWidth="6" />
          </g>
          <rect width={VB_W} height={VB_H} fill={`url(#${uid}-sidevol)`} /><rect width={VB_W} height={VB_H} fill={`url(#${uid}-drape)`} /><rect width={VB_W} height={VB_H} filter={`url(#${uid}-grain)`} opacity="0.16" style={{ mixBlendMode: "multiply" }} />
        </g>
        <path d={sleeve} fill={color} />
        <g clipPath={`url(#${uid}-ss-${kind})`}>
          {kind === "knit" && <rect width={VB_W} height={VB_H} fill={`url(#${uid}-knit)`} />}
          <g filter={soft} fill="none" strokeLinecap="round">
            <path d={`M91,62 C88,78 90,${cuff - 14} 91,${cuff}`} stroke="black" strokeOpacity="0.16" strokeWidth="2.6" />
            <path d={`M92.6,62 C89.6,78 91.6,${cuff - 14} 92.6,${cuff}`} stroke="white" strokeOpacity="0.12" strokeWidth="1.1" />
            <path d={`M109,58 C112,76 110,${cuff - 14} 109,${cuff}`} stroke="black" strokeOpacity="0.2" strokeWidth="2.6" />
            <path d={`M86,72 C94,80 104,86 115,${cuff - 10}`} stroke="black" strokeOpacity="0.1" strokeWidth="2.4" />
            <path d="M84,53 C92,49 108,49 116,53" stroke="black" strokeOpacity="0.24" strokeWidth="3.6" />
            <path d={`M81,${cuff - 2} C92,${cuff + 4} 108,${cuff + 5} 119,${cuff + 2}`} stroke="black" strokeOpacity="0.34" strokeWidth="3.2" />
            <path d={`M85,60 C84,80 85,${cuff - 20} 85,${cuff - 4}`} stroke="white" strokeOpacity="0.22" strokeWidth="1.4" />
            <ellipse cx="94" cy="47.5" rx="6" ry="2.4" fill="white" fillOpacity="0.22" stroke="none" />
          </g>
          <rect width={VB_W} height={VB_H} fill={`url(#${uid}-sidevol)`} /><rect width={VB_W} height={VB_H} fill={`url(#${uid}-drape)`} /><rect width={VB_W} height={VB_H} filter={`url(#${uid}-grain)`} opacity="0.16" style={{ mixBlendMode: "multiply" }} />
        </g>
        <path d={`M82,${cuff + 1} C92,${cuff + 6} 108,${cuff + 7} 118,${cuff + 4}`} fill="none" stroke={mix(color, 0.35)} strokeOpacity="0.45" strokeWidth="0.6" strokeDasharray="1.6 1.4" />
        <path d={`M86,${hem - 3} C92,${hem + 1} 109,${hem + 1} 115,${hem - 3}`} fill="none" stroke={mix(color, 0.35)} strokeOpacity="0.4" strokeWidth="0.6" strokeDasharray="1.6 1.4" />
      </g>
      <ellipse cx="100" cy="46" rx="10" ry="3.2" fill={trim} /><ellipse cx="100" cy="46" rx="10" ry="3.2" fill={`url(#${uid}-rib)`} /><ellipse cx="100" cy="46" rx="10" ry="3.2" fill="none" stroke="black" strokeOpacity="0.2" strokeWidth="0.6" />
    </svg>
  );
}

function Photo({ src, alt, full }: { src: string; alt: string; full: boolean }) {
  // Cut-outs deliberately use native img so the reusable rail needs no Next
  // image host configuration and also works in the standalone Orion preview.
  // eslint-disable-next-line @next/next/no-img-element
  return <img data-garment-photo src={src} alt={alt} draggable={false} decoding="sync" className={`pointer-events-none absolute inset-x-0 bottom-0 size-auto w-full select-none object-contain object-top ${full ? "top-0 h-full" : "top-[8%] h-[92%]"}`} />;
}

function facesFor(item: RailGarment): Face[] {
  return item.image && !item.backImage ? ["front"] : ["front", "back"];
}

function GarmentFace({ uid, item, face, hanger }: { uid: string; item: RailGarment; face: Face; hanger: Material }) {
  const kind = item.kind ?? "tee";
  const color = item.color ?? "var(--color-muted-foreground)";
  const trim = item.trim ?? mix(color, -0.12);
  return <>
    <Hanger uid={uid} side={face} kind={item.image ? null : kind} material={hanger} />
    {item.image ? <>
      <Photo src={(face === "back" ? item.backImage : undefined) ?? item.image} alt="" full={hanger === "none"} />
      {face === "front" && !item.brandBakedIn && <svg aria-hidden="true" viewBox={`0 0 ${VB_W} ${VB_H}`} className="pointer-events-none absolute inset-0 size-full" preserveAspectRatio="xMidYMin meet"><ChestMark kind={kind} brand={item.brand} color={item.brandColor} /></svg>}
    </> : <Fabric uid={uid} kind={kind} side={face} color={color} trim={trim} brand={item.brand} brandColor={item.brandColor} />}
  </>;
}

type Sim = {
  x: number[]; vx: number[]; tx: number[];
  turn: number[]; vturn: number[]; tturn: number[];
  swing: number[]; vswing: number[];
  tag: number[]; vtag: number[];
  last: number; raf: number;
  layout: ClothingRailLayout | null;
};

function emptySim(): Sim {
  return { x: [], vx: [], tx: [], turn: [], vturn: [], tturn: [], swing: [], vswing: [], tag: [], vtag: [], last: 0, raf: 0, layout: null };
}

export function ClothingRailHero({
  items, eyebrow, heading, headingAs: Heading = "h2", caption, action,
  autoplay = false, interval = 2600, hanger = "wood", labels = DEFAULT_LABELS,
  onOpenChange, className, ...rest
}: ClothingRailHeroProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const count = items.length;
  const stageRef = React.useRef<HTMLDivElement>(null);
  const slots = React.useRef<(HTMLButtonElement | null)[]>([]);
  const swings = React.useRef<(HTMLSpanElement | null)[]>([]);
  const turns = React.useRef<(HTMLSpanElement | null)[]>([]);
  const sides = React.useRef<(HTMLSpanElement | null)[]>([]);
  const drapes = React.useRef<(HTMLSpanElement | null)[]>([]);
  const shades = React.useRef<(HTMLSpanElement | null)[]>([]);
  const shadows = React.useRef<(HTMLSpanElement | null)[]>([]);
  const tags = React.useRef<(HTMLSpanElement | null)[]>([]);
  const sim = React.useRef(emptySim());
  const [size, setSize] = React.useState<ClothingRailLayout>(() => fitClothingRail(0, []));
  const middle = Math.max(0, Math.floor((count - 1) / 2));
  const [active, setActive] = React.useState<number | null>(count ? middle : null);
  const [focusIndex, setFocusIndex] = React.useState(middle);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const [reduced, setReduced] = React.useState(false);
  const [playing, setPlaying] = React.useState(autoplay);
  const [lifted, setLifted] = React.useState<number | null>(null);
  const [inView, setInView] = React.useState(true);
  const returnFocus = React.useRef<number | null>(null);
  const pendingOpen = React.useRef(-1);
  const pointer = React.useRef({ id: -1, index: -1, x: 0, y: 0, moved: false, kind: "", lastX: 0, lastT: 0, v: 0 });
  const baseSideWidths = React.useMemo(() => items.map((item) => item.image ? (item.sideImage ? 0.3 : 0.46) : SIDE[item.kind ?? "tee"].width), [items]);
  const live = React.useRef({ active, size, reduced, count, openIndex: null as number | null });
  const measured = size.width > 0;

  // Update the imperative simulation only after React commits. Rendering stays
  // pure; the animation loop reads the latest state without a per-frame render.
  React.useLayoutEffect(() => {
    live.current = { active, size, reduced, count, openIndex };
  }, [active, size, reduced, count, openIndex]);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  React.useEffect(() => { setPlaying(autoplay); }, [autoplay]);

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !("IntersectionObserver" in window)) return;
    let intersecting = true;
    const update = () => setInView(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); });
    observer.observe(stage);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);

  React.useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = (width: number) => {
      const next = fitClothingRail(width, baseSideWidths);
      setSize((old) => Math.abs(old.width - width) < 0.5 && old.h === next.h && Math.abs(old.restAngle - next.restAngle) < 0.01 && old.sideWidths.length === next.sideWidths.length && old.sideWidths.every((side, i) => Math.abs(side - next.sideWidths[i]) < 0.001) ? old : next);
    };
    measure(stage.clientWidth);
    // Container and viewport changes must commit before the next paint, so a
    // narrow viewport never briefly retains offscreen desktop hanger slots.
    const onResize = () => flushSync(() => measure(stage.clientWidth));
    const observer = new ResizeObserver(([entry]) => { if (entry) flushSync(() => measure(entry.contentRect.width)); });
    observer.observe(stage);
    window.addEventListener("resize", onResize);
    return () => { observer.disconnect(); window.removeEventListener("resize", onResize); };
  }, [baseSideWidths]);

  const paint = React.useCallback((i: number) => {
    const s = sim.current;
    const { h, restAngle, sideWidths, sideScale } = live.current.size;
    const w = h * ASPECT;
    const slot = slots.current[i];
    if (!slot) return;
    const photographic = slot.dataset.renderer === "photo";
    const turn = s.turn[i] ?? restAngle;
    const angle = railTurnAngle(turn, restAngle);
    const swing = s.swing[i] ?? 0;
    const hitWidth = footprint(h, turn, sideWidths[i], restAngle);
    slot.style.width = `${hitWidth.toFixed(2)}px`;
    slot.style.transform = `translate3d(${((s.x[i] ?? 0) - hitWidth / 2).toFixed(2)}px,0,0)`;
    const sw = swings.current[i];
    if (sw) sw.style.transform = `rotate(${swing.toFixed(3)}deg)`;
    const e = clamp(1 - turn / restAngle, 0, 1);
    const tu = turns.current[i];
    const sd = sides.current[i];
    if (tu) {
      tu.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${angle.toFixed(2)}deg)`;
      tu.style.opacity = sd ? clamp((e - 0.44) / 0.12, 0, 1).toFixed(3) : "1";
    }
    if (sd) {
      sd.style.opacity = clamp((0.56 - e) / 0.12, 0, 1).toFixed(3);
      sd.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${(Math.min(1, e * 2) * -84).toFixed(2)}deg) scaleX(${sideScale.toFixed(3)})`;
    }
    const lag = clamp(-(s.vswing[i] ?? 0) * 0.018, photographic ? -1 : -5, photographic ? 1 : 5);
    drapes.current[i]?.style.setProperty("--drape", `${lag.toFixed(3)}deg`);
    shades.current[i]?.style.setProperty("--shade", ((1 - lambert(angle)) * (photographic ? 0.25 : 1)).toFixed(3));
    const shadow = shadows.current[i];
    if (shadow) shadow.style.transform = `translate3d(${(w * 0.05).toFixed(1)}px,${(h * 0.035).toFixed(1)}px,0) scaleX(${Math.max(0.12, Math.abs(Math.cos((angle * Math.PI) / 180))).toFixed(3)})`;
    const tag = tags.current[i];
    if (tag) tag.style.transform = `rotate(${(-12 + (s.tag[i] ?? 0)).toFixed(2)}deg)`;
  }, []);

  const step = React.useCallback(function tick(now: number): void {
    const s = sim.current;
    const n = live.current.count;
    const dt = s.last ? Math.min(0.034, (now - s.last) / 1000) : 1 / 60;
    s.last = now;
    const { h, width, padding, restAngle, sideWidths } = live.current.size;
    let busy = false;
    const sdt = dt / 2;
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < n; i++) {
        const before = s.vx[i] ?? 0;
        const ax = -130 * ((s.x[i] ?? 0) - (s.tx[i] ?? 0)) - 2 * Math.sqrt(130) * 0.86 * before;
        s.vx[i] = before + ax * sdt;
        s.x[i] = (s.x[i] ?? 0) + s.vx[i] * sdt;
        const accel = ((s.vx[i] ?? 0) - before) / sdt;
        const ta = -150 * ((s.turn[i] ?? 0) - (s.tturn[i] ?? 0)) - 2 * Math.sqrt(150) * 0.78 * (s.vturn[i] ?? 0);
        s.vturn[i] = (s.vturn[i] ?? 0) + ta * sdt;
        s.turn[i] = (s.turn[i] ?? 0) + s.vturn[i] * sdt;
        const sa = -24 * (s.swing[i] ?? 0) - 2.1 * (s.vswing[i] ?? 0) - clamp(accel, -6000, 6000) * 0.0045;
        s.vswing[i] = (s.vswing[i] ?? 0) + sa * sdt;
        s.swing[i] = clamp((s.swing[i] ?? 0) + s.vswing[i] * sdt, -3, 3);
        const tagA = -46 * ((s.tag[i] ?? 0) - s.swing[i] * 0.6) - 3.4 * (s.vtag[i] ?? 0) - s.vswing[i] * 0.9;
        s.vtag[i] = (s.vtag[i] ?? 0) + tagA * sdt;
        s.tag[i] = clamp((s.tag[i] ?? 0) + s.vtag[i] * sdt, -30, 30);
      }
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < n - 1; i++) {
          const a = s.x[i] ?? 0;
          const b = s.x[i + 1] ?? 0;
          const minGap = (footprint(h, s.turn[i] ?? restAngle, sideWidths[i], restAngle) + footprint(h, s.turn[i + 1] ?? restAngle, sideWidths[i + 1], restAngle)) / 2 + h * 0.012;
          const overlap = minGap - (b - a);
          if (overlap <= 0) continue;
          s.x[i] = a - overlap / 2; s.x[i + 1] = b + overlap / 2;
          const va = s.vx[i] ?? 0;
          const vb = s.vx[i + 1] ?? 0;
          if (va > vb) {
            const shared = (va + vb) / 2;
            s.vx[i] = shared; s.vx[i + 1] = shared;
          }
        }
      }
      if (n > 0) {
        const first = padding + footprint(h, s.turn[0] ?? restAngle, sideWidths[0], restAngle) / 2;
        const last = width - padding - footprint(h, s.turn[n - 1] ?? restAngle, sideWidths[n - 1], restAngle) / 2;
        if ((s.x[0] ?? 0) < first) { s.x[0] = first; s.vx[0] = Math.abs(s.vx[0] ?? 0) * 0.3; }
        if ((s.x[n - 1] ?? 0) > last) { s.x[n - 1] = last; s.vx[n - 1] = -Math.abs(s.vx[n - 1] ?? 0) * 0.3; }
      }
    }
    for (let i = 0; i < n; i++) {
      paint(i);
      if (Math.abs(s.vx[i] ?? 0) > 0.4 || (Math.abs((s.x[i] ?? 0) - (s.tx[i] ?? 0)) > 0.25) || Math.abs((s.turn[i] ?? 0) - (s.tturn[i] ?? 0)) > 0.05 || Math.abs(s.vturn[i] ?? 0) > 0.05 || Math.abs(s.swing[i] ?? 0) > 0.02 || Math.abs(s.vswing[i] ?? 0) > 0.05 || Math.abs(s.tag[i] ?? 0) > 0.05 || Math.abs(s.vtag[i] ?? 0) > 0.08) busy = true;
    }
    if (busy) s.raf = requestAnimationFrame(tick);
    else {
      s.raf = 0; s.last = 0;
      for (let i = 0; i < n; i++) { s.x[i] = s.tx[i] ?? 0; s.vx[i] = 0; s.turn[i] = s.tturn[i] ?? restAngle; s.vturn[i] = 0; s.swing[i] = 0; s.vswing[i] = 0; s.tag[i] = 0; s.vtag[i] = 0; paint(i); }
    }
  }, [paint]);

  const kick = React.useCallback(() => {
    const s = sim.current;
    if (live.current.reduced) {
      cancelAnimationFrame(s.raf); s.raf = 0; s.last = 0;
      for (let i = 0; i < live.current.count; i++) {
        s.x[i] = s.tx[i] ?? 0; s.turn[i] = s.tturn[i] ?? live.current.size.restAngle;
        s.vx[i] = 0; s.vturn[i] = 0; s.swing[i] = 0; s.vswing[i] = 0; s.tag[i] = 0; s.vtag[i] = 0; paint(i);
      }
      return;
    }
    if (!s.raf) { s.last = 0; s.raf = requestAnimationFrame(step); }
  }, [paint, step]);

  const impulse = React.useCallback((i: number, amount: number) => {
    if (live.current.reduced || i < 0 || i >= live.current.count) return;
    sim.current.vswing[i] = (sim.current.vswing[i] ?? 0) + amount;
    kick();
  }, [kick]);

  React.useLayoutEffect(() => {
    if (!size.width) return;
    const s = sim.current;
    const front = active;
    const xs = railTargets(size, front);
    const relayout = s.layout !== size || s.x.length !== count;
    s.layout = size;
    for (let i = 0; i < count; i++) {
      s.tx[i] = xs[i] ?? 0;
      s.tturn[i] = i === front ? 0 : size.restAngle;
      // Resize in place, rather than animating from offscreen desktop slots.
      if (relayout || reduced) {
        s.x[i] = s.tx[i]; s.vx[i] = 0; s.turn[i] = s.tturn[i]; s.vturn[i] = 0;
        s.swing[i] = 0; s.vswing[i] = 0; s.tag[i] = 0; s.vtag[i] = 0;
      }
      paint(i);
    }
    s.x.length = count;
    kick();
  }, [size, active, count, reduced, paint, kick]);

  React.useEffect(() => {
    if (!measured || reduced) return;
    const timers = items.map((_, i) => window.setTimeout(() => impulse(i, 6 - i * 0.25), 120 + i * 55));
    return () => timers.forEach(window.clearTimeout);
  }, [measured, reduced, items, impulse]);

  React.useEffect(() => {
    const simulation = sim.current;
    return () => { cancelAnimationFrame(simulation.raf); simulation.raf = 0; };
  }, []);

  React.useLayoutEffect(() => {
    if (openIndex !== null || lifted !== null || returnFocus.current === null) return;
    const index = returnFocus.current;
    returnFocus.current = null;
    slots.current[index]?.focus({ preventScroll: true });
  }, [openIndex, lifted]);

  const choose = React.useCallback((index: number | null) => {
    const old = live.current.active;
    if (old === index) return;
    if (index !== null) { impulse(index - 1, -8); impulse(index + 1, 8); setFocusIndex(index); }
    if (old !== null) { impulse(old - 1, 5); impulse(old + 1, -5); }
    live.current.active = index;
    setActive(index);
  }, [impulse]);

  const stop = React.useCallback(() => setPlaying(false), []);

  React.useEffect(() => {
    if (!playing || reduced || !inView || openIndex !== null || count === 0 || !size.width) return;
    const timer = window.setTimeout(() => {
      const current = live.current.active;
      choose(current === null ? 0 : (current + 1) % live.current.count);
    }, active === null ? 1100 : Math.max(1200, interval));
    return () => window.clearTimeout(timer);
  }, [playing, reduced, inView, openIndex, count, interval, size.width, choose, active]);

  const open = React.useCallback((index: number) => {
    if (!items[index]) return;
    stop(); choose(index); setOpenIndex(index); onOpenChange?.(index);
  }, [items, onOpenChange, stop, choose]);

  // Stable callbacks are important: lifting changes parent state and must NOT
  // tear down and restart the dialog's opening animation/focus effect.
  const getSource = React.useCallback(() => openIndex === null ? null : turns.current[openIndex]?.getBoundingClientRect() ?? null, [openIndex]);
  const handleLift = React.useCallback((lift: boolean) => setLifted(lift ? openIndex : null), [openIndex]);
  const handleClose = React.useCallback(() => {
    if (openIndex === null) return;
    returnFocus.current = openIndex;
    setOpenIndex(null); onOpenChange?.(null);
    impulse(openIndex, (openIndex % 2 ? 1 : -1) * 12);
  }, [openIndex, onOpenChange, impulse]);

  function nearest(clientX: number, clientY: number) {
    const stage = stageRef.current;
    if (!stage) return null;
    const box = stage.getBoundingClientRect();
    const x = clientX - box.left;
    const y = clientY - box.top;
    const { h, sideWidths, restAngle } = live.current.size;
    if (y < 0 || y > h + 46) return null;
    let best: number | null = null;
    let distance = Infinity;
    for (let i = 0; i < count; i++) {
      const half = footprint(h, sim.current.turn[i] ?? restAngle, sideWidths[i], restAngle) / 2 + 4;
      const d = Math.abs(x - (sim.current.x[i] ?? 0));
      if (d < half && d < distance) { best = i; distance = d; }
    }
    return best;
  }

  const onPointerMove = (event: React.PointerEvent) => {
    const p = pointer.current;
    const stage = stageRef.current;
    if (p.id === event.pointerId && stage) {
      const dx = event.clientX - p.x;
      const now = performance.now();
      if (!p.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(event.clientY - p.y)) {
        p.moved = true; stop();
        stage.setPointerCapture(event.pointerId);
      }
      if (p.moved) {
        p.v = p.v * 0.6 + (event.clientX - p.lastX) / Math.max(1, now - p.lastT) * 0.4;
        p.lastX = event.clientX; p.lastT = now;
      }
      return;
    }
    if (event.pointerType !== "mouse" || size.compact || openIndex !== null) return;
    const hit = nearest(event.clientX, event.clientY);
    if (hit !== null && hit !== live.current.active) { stop(); choose(hit); }
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0 || !event.isPrimary) return;
    stop();
    const now = performance.now();
    pendingOpen.current = -1;
    pointer.current = { id: event.pointerId, index: nearest(event.clientX, event.clientY) ?? -1, x: event.clientX, y: event.clientY, moved: false, kind: event.pointerType, lastX: event.clientX, lastT: now, v: 0 };
  };

  const finishPointer = (event: React.PointerEvent, cancelled: boolean) => {
    const p = pointer.current;
    if (p.id !== event.pointerId) return;
    const stage = stageRef.current;
    if (stage?.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    pointer.current = { ...p, id: -1 };
    if (cancelled) return;
    if (p.moved) {
      // A swipe changes the selected hanger, never the position of the rack.
      // All pieces keep their ordered, centred slots on the same metal bar.
      const dx = event.clientX - p.x;
      if (Math.abs(dx) > 30 || Math.abs(p.v) > 0.4) {
        choose(clamp((live.current.active ?? focusIndex) + (dx < 0 ? 1 : -1), 0, count - 1));
      }
      return;
    }
    if (p.index < 0) return;
    if (p.kind !== "mouse" && live.current.active !== p.index) choose(p.index);
    else pendingOpen.current = p.index;
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key) || !count) return;
    event.preventDefault(); stop();
    const from = active ?? focusIndex;
    const next = event.key === "Home" ? 0 : event.key === "End" ? count - 1 : clamp(from + (event.key === "ArrowRight" ? 1 : -1), 0, count - 1);
    setFocusIndex(next); choose(next); slots.current[next]?.focus({ preventScroll: true });
  };

  const current = items[active ?? -1];
  const h = size.h;
  const boxW = h * ASPECT;
  const railY = Math.round(h * 0.07) + 10;
  const railR = Math.max(3, Math.round((RAIL_R / VB_H) * h * 10) / 10);
  const bottom = count ? Math.max(...items.map((item) => item.image ? VB_H : SIDE[item.kind ?? "tee"].hem + 8)) / VB_H : 1;

  return (
    <section {...rest} data-orion-rail data-slot="clothing-rail-hero" data-mode={size.compact ? "compact-rail" : "rail"} data-layout="fit-all" data-total={count} data-active={active ?? ""} aria-roledescription="clothing rail" className={`relative isolate w-full overflow-hidden bg-background text-foreground ${className ?? ""}`}>
      <Defs uid={uid} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(120% 70% at 18% 0%, color-mix(in oklab, var(--color-foreground) 7%, transparent), transparent 62%), linear-gradient(to bottom, transparent 55%, color-mix(in oklab, var(--color-foreground) 5%, transparent))" }} />
      {(eyebrow || heading) && <header className="relative z-10 flex flex-col items-center gap-2 px-6 pt-8 text-center">
        {eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>}
        {heading && <Heading className="text-balance text-2xl font-medium tracking-tight sm:text-3xl">{heading}</Heading>}
      </header>}
      <div ref={stageRef} data-stage role="group" aria-label={heading ?? "Clothing rail"} className="relative mt-5 w-full touch-pan-y select-none" style={{ height: Math.round(railY + h * bottom + h * 0.05 + 12), overflowX: "clip", visibility: measured ? "visible" : "hidden" }} onPointerMove={onPointerMove} onPointerDown={onPointerDown} onPointerUp={(event) => finishPointer(event, false)} onPointerCancel={(event) => finishPointer(event, true)} onKeyDown={onKeyDown}>
        <div aria-hidden="true" data-rail className="pointer-events-none absolute inset-x-0 z-0" style={{ top: railY - railR, height: railR * 2 }}>
          <div className="absolute inset-x-0 h-3 rounded-full bg-foreground/10 blur-[5px]" style={{ top: railR * 2 + 1 }} />
          <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(to bottom, color-mix(in oklab, var(--color-muted-foreground) 35%, white) 0%, white 18%, color-mix(in oklab, var(--color-muted-foreground) 70%, white) 38%, var(--color-muted-foreground) 62%, color-mix(in oklab, var(--color-muted-foreground) 55%, black) 100%)", boxShadow: "0 1px 0 color-mix(in oklab, var(--color-foreground) 18%, transparent)" }} />
          <div className="absolute inset-0 rounded-full opacity-40 mix-blend-overlay" style={{ background: "repeating-linear-gradient(90deg, transparent 0 2px, color-mix(in oklab, white 40%, transparent) 2px 3px, transparent 3px 7px)" }} />
          {[0, 1].map((side) => <div key={side} className="absolute top-1/2 h-7 w-4 -translate-y-1/2 rounded-[3px]" style={{ [side ? "right" : "left"]: 6, background: "linear-gradient(to right, color-mix(in oklab, var(--color-muted-foreground) 60%, white), var(--color-muted-foreground) 55%, color-mix(in oklab, var(--color-muted-foreground) 60%, black))", boxShadow: "0 3px 6px color-mix(in oklab, var(--color-foreground) 18%, transparent)" }}><span className="absolute left-1/2 top-1 size-1 -translate-x-1/2 rounded-full bg-foreground/35" /><span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-foreground/35" /></div>)}
        </div>
        {items.map((item, i) => {
          const kind = item.kind ?? "tee";
          const color = item.color ?? "var(--color-muted-foreground)";
          const trim = item.trim ?? mix(color, -0.12);
          const turned = active === i;
          const mask = item.image ? `url("${item.image}")` : silhouetteMask(kind, "front");
          const photoBox = hanger === "none" ? "inset-0" : "inset-x-0 bottom-0 top-[8%]";
          return <button key={item.id} ref={(node) => { slots.current[i] = node; }} type="button" data-garment={i} data-renderer={item.image ? "photo" : "illustration"} data-garment-brand={item.brand} data-front={turned || undefined} tabIndex={i === (active ?? focusIndex) ? 0 : -1} aria-label={item.name} aria-describedby={`${uid}-caption`} aria-pressed={turned} aria-haspopup="dialog" className="absolute left-0 cursor-pointer rounded-xl outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" style={{ top: railY - HOOK_TOP / VB_H * h - railR, width: footprint(h, turned ? 0 : size.restAngle, size.sideWidths[i], size.restAngle), height: h, zIndex: turned ? 30 : 10 + i, visibility: lifted === i ? "hidden" : undefined }} onFocus={() => { setFocusIndex(i); if (pointer.current.id < 0) { stop(); choose(i); } }} onClick={(event) => { const pending = pendingOpen.current; pendingOpen.current = -1; if (event.detail === 0 || pending === i) open(i); }}>
            <span ref={(node) => { swings.current[i] = node; }} className="pointer-events-none absolute inset-y-0" style={{ left: "50%", width: boxW, marginLeft: -boxW / 2, transformOrigin: `50% ${HOOK_TOP / VB_H * 100}%` }}>
              <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ filter: `blur(${Math.max(3, h * 0.022).toFixed(1)}px)` }}><span ref={(node) => { shadows.current[i] = node; }} className={`absolute block bg-black ${item.image ? `opacity-[0.1] ${photoBox}` : "inset-0 opacity-[0.16]"}`} style={{ WebkitMask: `${mask} top center / contain no-repeat`, mask: `${mask} top center / contain no-repeat` }} /></span>
              {(item.sideImage || !item.image) && <span ref={(node) => { sides.current[i] = node; }} data-face="side" className="absolute inset-0" style={{ transform: `perspective(${PERSPECTIVE}px) rotateY(0deg)` }}><SideHanger uid={uid} material={hanger} />{item.sideImage ? <Photo src={item.sideImage} alt="" full={hanger === "none"} /> : <SideArt uid={uid} kind={kind} color={color} trim={trim} />}</span>}
              <span ref={(node) => { turns.current[i] = node; }} data-turn className="absolute inset-0 rounded-lg [transform-style:preserve-3d]" style={{ transform: `perspective(${PERSPECTIVE}px) rotateY(${size.restAngle}deg)`, transformOrigin: `50% ${HOOK_TOP / VB_H * 100}%`, opacity: item.image && !item.sideImage ? 1 : 0 }}>
                {(item.image ? ["front" as const] : facesFor(item)).map((face) => <span key={face} data-face={face} className="absolute inset-0 [backface-visibility:hidden]" style={{ transform: face === "back" ? "rotateY(180deg)" : undefined, "--garment-color": color, "--garment-under": mix(color, -0.42) } as React.CSSProperties}>
                  <Hanger uid={uid} side={face} kind={item.image ? null : kind} material={hanger} />
                  <span ref={face === "front" ? (node) => { drapes.current[i] = node; } : undefined} data-drape className="absolute inset-0 origin-top [transform:skewX(var(--drape,0deg))]">
                    {item.image ? <><Photo src={(face === "back" ? item.backImage : undefined) ?? item.image} alt="" full={hanger === "none"} />{face === "front" && !item.brandBakedIn && <svg aria-hidden="true" viewBox={`0 0 ${VB_W} ${VB_H}`} className="pointer-events-none absolute inset-0 size-full"><ChestMark kind={kind} brand={item.brand} color={item.brandColor} /></svg>}</> : <Fabric uid={uid} kind={kind} side={face} color={color} trim={trim} brand={item.brand} brandColor={item.brandColor} />}
                    <span ref={face === "front" ? (node) => { shades.current[i] = node; } : undefined} className={`pointer-events-none absolute bg-black ${item.image ? photoBox : "inset-0"}`} style={{ opacity: "var(--shade, 0.2)", WebkitMask: `${item.image ? `url("${(face === "back" ? item.backImage : undefined) ?? item.image}")` : silhouetteMask(kind, face)} top center / contain no-repeat`, mask: `${item.image ? `url("${(face === "back" ? item.backImage : undefined) ?? item.image}")` : silhouetteMask(kind, face)} top center / contain no-repeat` }} />
                  </span>
                </span>)}
              </span>
              {item.tag && <span ref={(node) => { tags.current[i] = node; }} aria-hidden="true" className="pointer-events-none absolute left-1/2 origin-top" style={{ top: 32 / VB_H * h, transform: "rotate(-12deg)" }}><span className="block h-[14px] w-px translate-x-[3px] bg-foreground/35" /><span className="relative block -translate-x-1/2 whitespace-nowrap rounded-[3px] border border-foreground/10 bg-card px-1.5 pb-1 pt-2 text-[9px] font-semibold leading-none tracking-wide text-card-foreground shadow-sm"><span className="absolute left-1/2 top-[3px] size-[3px] -translate-x-1/2 rounded-full bg-foreground/30" />{item.tag}</span></span>}
            </span>
          </button>;
        })}
      </div>
      {count > 1 && <div data-rail-navigation className="relative z-10 mx-auto mt-1 flex items-center justify-center gap-4 px-4" role="group" aria-label="Choose a garment">
        <button type="button" aria-label="Previous garment" disabled={(active ?? 0) === 0} onClick={() => { stop(); choose(Math.max(0, (active ?? 0) - 1)); }} className="inline-flex size-11 items-center justify-center rounded-full border border-border outline-none disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring"><ChevronLeft aria-hidden="true" className="size-4" /></button>
        <div className="min-w-0 text-center">
          <p data-rail-count className="text-xs font-medium">All {count} pieces on the rail</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{String((active ?? 0) + 1).padStart(2, "0")} / {String(count).padStart(2, "0")} · {size.compact ? "Swipe or tap a hanger" : "Hover or select a hanger"}</p>
        </div>
        <button type="button" aria-label="Next garment" disabled={(active ?? 0) === count - 1} onClick={() => { stop(); choose(Math.min(count - 1, (active ?? 0) + 1)); }} className="inline-flex size-11 items-center justify-center rounded-full border border-border outline-none disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring"><ChevronRight aria-hidden="true" className="size-4" /></button>
      </div>}
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 pb-8 pt-4 text-center">
        <div id={`${uid}-caption`} aria-live={playing ? "off" : "polite"} className="min-h-[3.25rem]">
          <p className="text-sm font-medium">{current ? current.name : caption}</p>
          {current?.description && <p className="mx-auto mt-1 max-w-[42ch] text-[13px] leading-relaxed text-muted-foreground">{current.description}</p>}
        </div>
        {action}
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>{size.compact ? "Tap once to turn · Tap again to lift" : "Hover to turn · Click to lift"}</span>
          {autoplay && !reduced && count > 1 && <button type="button" aria-label={playing ? "Pause clothing rail" : "Play clothing rail"} aria-pressed={playing} onClick={() => setPlaying((value) => !value)} className="inline-flex size-9 items-center justify-center rounded-full border border-border outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">{playing ? <Pause aria-hidden="true" className="size-3.5" /> : <Play aria-hidden="true" className="size-3.5" />}</button>}
        </div>
      </div>
      {openIndex !== null && items[openIndex] && <Detail uid={uid} item={items[openIndex]} index={openIndex} total={count} hanger={hanger} labels={labels} reduced={reduced} source={getSource} onLift={handleLift} onClose={handleClose} />}
    </section>
  );
}

function Detail({ uid, item, index, total, hanger, labels, reduced, source, onLift, onClose }: {
  uid: string; item: RailGarment; index: number; total: number;
  hanger: Material; labels: ClothingRailHeroLabels; reduced: boolean;
  source: () => DOMRect | null; onLift: (lifted: boolean) => void; onClose: () => void;
}) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const figureRef = React.useRef<HTMLDivElement>(null);
  const spinRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [side, setSide] = React.useState<Face>("front");
  const [shown, setShown] = React.useState(false);
  const angle = React.useRef({ value: 0, target: 0, velocity: 0, raf: 0, last: 0, dragging: false, startX: 0, startAngle: 0 });
  const closing = React.useRef(false);
  const exitAnimation = React.useRef<Animation | null>(null);
  const kind = item.kind ?? "tee";
  const color = item.color ?? "var(--color-muted-foreground)";
  const titleId = `${uid}-detail-title`;
  const canTurn = !item.image || Boolean(item.backImage);

  const spin = React.useCallback(() => {
    const a = angle.current;
    const node = spinRef.current;
    const loop = (now: number) => {
      const dt = a.last ? Math.min(0.034, (now - a.last) / 1000) : 1 / 60;
      a.last = now;
      a.velocity += (-90 * (a.value - a.target) - 2 * Math.sqrt(90) * 0.82 * a.velocity) * dt;
      a.value += a.velocity * dt;
      if (node) node.style.transform = `rotateY(${a.value.toFixed(2)}deg)`;
      if (Math.abs(a.value - a.target) < 0.05 && Math.abs(a.velocity) < 0.05) { a.value = a.target; if (node) node.style.transform = `rotateY(${a.value}deg)`; a.raf = 0; a.last = 0; return; }
      a.raf = requestAnimationFrame(loop);
    };
    if (reduced) { cancelAnimationFrame(a.raf); a.raf = 0; a.value = a.target; if (node) node.style.transform = `rotateY(${a.value}deg)`; return; }
    if (!a.raf) a.raf = requestAnimationFrame(loop);
  }, [reduced]);

  const turnTo = React.useCallback((next: Face) => {
    if (!canTurn) return;
    const a = angle.current;
    a.target = Math.round(a.value / 360) * 360 + (next === "back" ? 180 : 0);
    if (Math.abs(a.target - a.value) > 180) a.target -= 360 * Math.sign(a.target - a.value);
    setSide(next); spin();
  }, [spin, canTurn]);

  React.useLayoutEffect(() => {
    const figure = figureRef.current;
    const from = source();
    const overflow = document.body.style.overflow;
    const background = [...document.body.children].filter((node): node is HTMLElement => node instanceof HTMLElement && node !== dialogRef.current);
    const oldInert = background.map((node) => node.inert);
    background.forEach((node) => { node.inert = true; });
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    let animation: Animation | null = null;
    const a = angle.current;
    if (figure && from && !reduced && from.width > 0 && typeof figure.animate === "function") {
      const to = figure.getBoundingClientRect();
      const scale = from.height / to.height;
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top - to.top;
      const lift = Math.min(90, Math.abs(dy) * 0.25 + 30);
      onLift(true);
      animation = figure.animate([
        { transform: `translate(${dx}px,${dy}px) scale(${scale})` },
        { transform: `translate(${dx * 0.4}px,${dy * 0.4 - lift}px) scale(${(scale + 1) / 2 * 1.03}) rotate(${dx > 0 ? -2.5 : 2.5}deg)`, offset: 0.5 },
        { transform: "none" },
      ], { duration: 680, easing: "cubic-bezier(.22,.85,.3,1)" });
    }
    const raf = requestAnimationFrame(() => setShown(true));
    return () => {
      cancelAnimationFrame(raf); animation?.cancel(); exitAnimation.current?.cancel(); cancelAnimationFrame(a.raf);
      document.body.style.overflow = overflow;
      background.forEach((node, i) => { node.inert = oldInert[i]; });
      onLift(false);
    };
  }, [source, reduced, onLift]);

  const dismiss = React.useCallback(() => {
    if (closing.current) return;
    closing.current = true; setShown(false);
    const figure = figureRef.current;
    const to = source();
    if (!figure || !to || reduced || to.width === 0 || typeof figure.animate !== "function") { onClose(); return; }
    const from = figure.getBoundingClientRect();
    const scale = to.height / from.height;
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top - from.top;
    const animation = figure.animate([
      { transform: "none" },
      { transform: `translate(${dx * 0.6}px,${dy * 0.6 - 30}px) scale(${(scale + 1) / 2})`, offset: 0.55 },
      { transform: `translate(${dx}px,${dy}px) scale(${scale})` },
    ], { duration: 560, easing: "cubic-bezier(.45,0,.55,1)", fill: "forwards" });
    exitAnimation.current = animation;
    animation.onfinish = onClose;
  }, [source, reduced, onClose]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); dismiss(); return; }
    if (canTurn && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); event.stopPropagation(); turnTo(side === "front" ? "back" : "front"); return; }
    if (event.key !== "Tab") return;
    const controls = [...(dialogRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])].filter((node) => !node.disabled);
    const first = controls[0]; const last = controls.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  return createPortal(
    <div ref={dialogRef} data-orion-rail data-slot="clothing-rail-detail" role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-[100] overflow-y-auto text-foreground" onKeyDown={onKeyDown}>
      <div aria-hidden="true" className={`fixed inset-0 bg-background/90 backdrop-blur-xl transition-opacity duration-300 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`} onClick={dismiss} />
      <button ref={closeRef} type="button" onClick={dismiss} className="fixed right-5 top-5 z-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{labels.close}<X aria-hidden="true" className="size-4" /></button>
      <div className="pointer-events-none relative mx-auto grid min-h-svh w-full max-w-5xl items-center gap-8 p-6 pb-10 pt-20 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div ref={figureRef} className="pointer-events-auto relative mx-auto aspect-[200/310] h-[min(52svh,520px)] max-w-full origin-top">
          <div aria-hidden="true" className="absolute left-1/2 h-[40vh] w-[3px] -translate-x-1/2 rounded-full" style={{ background: "linear-gradient(to right, color-mix(in oklab, var(--color-muted-foreground) 50%, white), var(--color-muted-foreground), color-mix(in oklab, var(--color-muted-foreground) 50%, black))", top: `calc(-40vh + ${HOOK_TOP / VB_H * 100}%)` }} />
          <div className={`absolute inset-0 touch-pan-y ${canTurn ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`} style={{ perspective: "1400px" }} onPointerDown={(event) => { if (!canTurn || event.button !== 0 || !event.isPrimary) return; const a = angle.current; a.dragging = true; a.startX = event.clientX; a.startAngle = a.value; cancelAnimationFrame(a.raf); a.raf = 0; a.last = 0; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { const a = angle.current; if (!a.dragging) return; a.value = clamp(a.startAngle + (event.clientX - a.startX) * 0.45, a.startAngle - 220, a.startAngle + 220); if (spinRef.current) spinRef.current.style.transform = `rotateY(${a.value.toFixed(2)}deg)`; }} onPointerUp={() => { const a = angle.current; if (!a.dragging) return; a.dragging = false; const facing = (a.value % 360 + 360) % 360; turnTo(facing > 90 && facing < 270 ? "back" : "front"); }} onPointerCancel={() => { angle.current.dragging = false; turnTo(side); }}>
            <div ref={spinRef} data-detail-spin className="absolute inset-0 [transform-style:preserve-3d]">
              {facesFor(item).map((face) => <div key={face} data-face={face} className="absolute inset-0 [backface-visibility:hidden]" style={{ transform: face === "back" ? "rotateY(180deg)" : undefined, "--garment-color": color, "--garment-under": mix(color, -0.42) } as React.CSSProperties}><GarmentFace uid={uid} item={item} face={face} hanger={hanger} /></div>)}
            </div>
          </div>
        </div>
        <div className={`pointer-events-auto flex flex-col gap-4 text-center transition-[opacity,transform] delay-150 duration-500 motion-reduce:transition-none md:text-left ${shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground">THE ORION EDIT · {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</p>
          <h2 id={titleId} className="text-2xl font-medium tracking-tight sm:text-3xl">{item.name}</h2>
          {item.description && <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
          {!!item.details?.length && <ul className="flex flex-wrap justify-center gap-2 md:justify-start">{item.details.map((detail) => <li key={detail} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{detail}</li>)}</ul>}
          {canTurn ? <div role="group" aria-label={`${labels.front} / ${labels.back}`} className="mt-2 inline-flex justify-center gap-6 md:justify-start">
            {(["front", "back"] as const).map((face) => <button key={face} type="button" aria-pressed={side === face} onClick={() => turnTo(face)} className={`relative min-h-11 pb-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${side === face ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{face === "front" ? labels.front : labels.back}<span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-px origin-left bg-foreground transition-transform duration-300 motion-reduce:transition-none ${side === face ? "scale-x-100" : "scale-x-0"}`} /></button>)}
          </div> : <p className="text-xs text-muted-foreground">Front view only</p>}
          <p className="text-[11px] leading-relaxed text-muted-foreground">AI-generated wardrobe inspiration, not a product listing. Explore the clothing stores at Orion Mall.</p>
        </div>
      </div>
    </div>, document.body,
  );
}

export default ClothingRailHero;
