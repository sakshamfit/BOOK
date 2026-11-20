"use client";

import * as React from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import ClothingRailHero, { type RailGarment } from "./ui/product-rail-gallery";
import photography from "../orion-preview/images/clothing-rail/manifest.json";

/** Photorealistic wardrobe concepts, not mall inventory or priced products. */
const ORION_RAIL_STYLES = [
  {
    id: "orion-bone-tee", name: "Everyday tee · Bone", kind: "tee", color: "#EFEBE2", brandColor: "#344A38",
    description: "A clean, easy silhouette in warm bone, with a small ORION mark on the right chest.",
    details: ["Crew neck", "Warm bone", "ORION chest mark"],
  },
  {
    id: "orion-ink-tee", name: "Signature tee · Ink", kind: "tee", color: "#25292C", brandColor: "#F3EDE0",
    description: "An understated ink tee. A little ORION detail, a lot of everyday possibility.",
    details: ["Short sleeves", "Ink", "ORION chest mark"],
  },
  {
    id: "orion-sky-shirt", name: "Pocket shirt · Sky", kind: "shirt", color: "#A3CADD", brandColor: "#263E47",
    description: "Soft sky blue, a classic collar and the ORION signature tucked onto the right chest pocket.",
    details: ["Button front", "Chest pockets", "ORION chest mark"],
  },
  {
    id: "orion-olive-knit", name: "Textured knit · Olive", kind: "knit", color: "#758151", brandColor: "#FFF5DD",
    description: "An earthy olive knit with ribbed edges and a quiet ORION detail on the right chest.",
    details: ["Textured knit", "Ribbed edges", "ORION chest mark"],
  },
  {
    id: "orion-heather-hoodie", name: "Weekend hoodie · Heather", kind: "hoodie", color: "#A0A5AB", brandColor: "#24382C",
    description: "The laid-back layer: a drawstring hood, a roomy front pocket and the ORION chest signature.",
    details: ["Drawstring hood", "Kangaroo pocket", "ORION chest mark"],
  },
  {
    id: "orion-lilac-knit", name: "Crewneck knit · Lilac", kind: "knit", color: "#CCB2E0", brandColor: "#44294E",
    description: "A softer shade for your everyday rotation, finished with the ORION mark on the right chest.",
    details: ["Crew neck", "Muted lilac", "ORION chest mark"],
  },
  {
    id: "orion-forest-jacket", name: "Utility jacket · Forest", kind: "jacket", color: "#28553D", brandColor: "#F5EBD7",
    description: "Forest green, practical pockets and a small ORION signature. A fresh way to layer up.",
    details: ["Button front", "Patch pockets", "ORION chest mark"],
  },
  {
    id: "orion-brick-knit", name: "Long-sleeve knit · Brick", kind: "knit", color: "#B05139", brandColor: "#FFF1DF",
    description: "A warm brick-red layer with long sleeves, ribbed trims and ORION on the right chest.",
    details: ["Long sleeves", "Brick red", "ORION chest mark"],
  },
  {
    id: "orion-sand-coat", name: "Everywhere coat · Sand", kind: "coat", color: "#C6AD88", brandColor: "#3C352B",
    description: "A long sand-coloured coat with notched lapels and a considered ORION detail on the right chest.",
    details: ["Notched lapels", "Long silhouette", "ORION chest mark"],
  },
  {
    id: "orion-ochre-tee", name: "Colour-pop tee · Ochre", kind: "tee", color: "#DE9C31", brandColor: "#3D3222",
    description: "A little sunshine for the rail. Rich ochre, a simple shape and the ORION chest mark.",
    details: ["Crew neck", "Golden ochre", "ORION chest mark"],
  },
] satisfies RailGarment[];

export const ORION_RAIL_ITEMS: RailGarment[] = ORION_RAIL_STYLES.map((item) => {
  const photos = photography.items.find((photo) => `orion-${photo.id}` === item.id);
  if (!photos) throw new Error(`Missing clothing imagery for ${item.id}`);
  return {
    ...item,
    brand: "ORION",
    brandBakedIn: true,
    image: `/images/clothing-rail/${photos.front}`,
    backImage: photos.back ? `/images/clothing-rail/${photos.back}` : undefined,
  };
});

export default function OrionClothingRail({ autoplay = true, variant = "page" }: { autoplay?: boolean; variant?: "page" | "home" }) {
  const isHome = variant === "home";
  return (
    <ClothingRailHero
      items={ORION_RAIL_ITEMS}
      hanger="none"
      eyebrow="The Orion edit · Clothing"
      heading="Your next favourite is on the rail."
      headingAs={isHome ? "h2" : "h1"}
      caption="Ten pieces. Your kind of style. Take a look around."
      autoplay={autoplay}
      interval={3200}
      className="orion-clothing-rail"
      aria-label="Clothing at Orion Mall"
      action={<>
        <a href={isHome ? "/clothing.html#clothing-stores" : "#clothing-stores"} className="inline-flex min-h-11 items-center gap-3 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background outline-none transition-transform hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none">Explore clothing stores {isHome ? <ArrowUpRight aria-hidden="true" className="size-4" /> : <ArrowDown aria-hidden="true" className="size-4" />}</a>
        <p className="text-[11px] text-muted-foreground">AI-generated style imagery · Discover the clothing stores at Orion Mall.</p>
      </>}
    />
  );
}
