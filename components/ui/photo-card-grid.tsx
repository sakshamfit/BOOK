"use client";

import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export type ArcCard = { image: string; alt: string; label: string; href: string };

/** A finite, scroll-animated arc of links. All cards remain keyboard accessible. */
export function ArcCardCarousel({ cards }: { cards: ArcCard[] }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const items = gsap.utils.toArray<HTMLElement>(".arc-card", root.current);
      const middle = (items.length - 1) / 2;
      items.forEach((item, index) => {
        const distance = index - middle;
        gsap.fromTo(item,
          { y: 30 + Math.abs(distance) * 12, rotation: distance * 4, opacity: 0.6 },
          { y: Math.abs(distance) * 14, rotation: distance * 2, opacity: 1,
            ease: "none", scrollTrigger: { trigger: root.current, start: "top 90%", end: "center 55%", scrub: true } });
      });
    });
    return () => media.revert();
  }, []);

  return <div className="arc-carousel" ref={root} aria-label="Explore Orion Mall">
    {cards.map((card) => <a className="arc-card" key={card.label} href={card.href}>
      <img src={card.image} alt={card.alt} loading="lazy" />
      <span>{card.label}<b aria-hidden="true">↗</b></span>
    </a>)}
  </div>;
}
