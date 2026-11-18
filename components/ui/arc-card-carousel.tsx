"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type ArcCardItem = { src: string; alt?: string; title: string; meta?: string; description: string };
export type ArcCardCarouselProps = { items: ArcCardItem[]; ariaLabel?: string };

/** Finite adaptation of the supplied scroll-driven wheel, with selectable brand details. */
export default function ArcCardCarousel({ items, ariaLabel = "Brand carousel" }: ArcCardCarouselProps) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const trigger = useRef<ScrollTrigger | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<ArcCardItem | null>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      if (!track.current || !stage.current || !items.length) return;
      const draw = (progress: number) => {
        const el = stage.current;
        if (!el) return;
        const h = el.clientHeight, w = el.clientWidth;
        const u = Math.min(h, w / .47), cardW = .3 * u, cardH = cardW / 1.65;
        const hubX = (.284 - .71) * u, hubY = .475 * h, radius = .71 * u;
        const position = progress * Math.max(items.length - 1, 0);
        setIndex(Math.round(position));
        cards.current.forEach((card, i) => {
          if (!card) return;
          const d = i - position, angle = -d * 14, radians = angle * Math.PI / 180;
          card.style.width = `${cardW}px`; card.style.height = `${cardH}px`;
          card.style.transform = `translate3d(${hubX + radius * Math.cos(radians) - cardW / 2}px,${hubY + radius * Math.sin(radians) - cardH / 2}px,0) rotate(${angle}deg)`;
          card.style.visibility = Math.abs(d) > 3.3 ? "hidden" : "visible";
          card.style.zIndex = String(20 - Math.round(d * 2));
        });
      };
      const st = ScrollTrigger.create({ trigger: track.current, start: "top top", end: "bottom bottom", invalidateOnRefresh: true,
        snap: items.length > 1 ? { snapTo: 1 / (items.length - 1), duration: { min: .2, max: .6 }, delay: .2, ease: "power2.inOut" } : undefined,
        onUpdate: self => draw(self.progress), onRefresh: self => draw(self.progress) });
      trigger.current = st;
      draw(st.progress);
      return () => { st.kill(); trigger.current = null; cards.current.forEach(c => { if (c) { c.style.removeProperty("width"); c.style.removeProperty("height"); c.style.removeProperty("transform"); c.style.removeProperty("visibility"); c.style.removeProperty("z-index"); } }); };
    });
    return () => mm.revert();
  }, [items]);

  const go = (i: number) => {
    const st = trigger.current;
    if (!st || items.length < 2) return;
    window.scrollTo({ top: st.start + (i / (items.length - 1)) * (st.end - st.start), behavior: "smooth" });
  };
  const open = (item: ArcCardItem, el: HTMLElement) => { opener.current = el; setSelected(item); };
  useEffect(() => { if (selected && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [selected]);
  return <div className="brand-wheel" ref={track} style={{ "--wheel-steps": Math.max(0, items.length - 1) } as React.CSSProperties} role="region" aria-label={ariaLabel}>
    <div className="brand-wheel-stage" ref={stage}>
      <div className="brand-wheel-cards">{items.map((item, i) => <button key={item.title} className="brand-wheel-card" ref={el => { cards.current[i] = el; }} onFocus={() => { if (trigger.current && Math.abs(index - i) > 1) go(i); }} onClick={e => open(item, e.currentTarget)} aria-label={`View ${item.title} details`}><img src={item.src} alt={item.alt || ""} loading="lazy" /><span>{item.title}</span></button>)}</div>
      {items[index] && <div className="brand-wheel-caption"><p className="brand-wheel-count">{String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</p><h3>{items[index].title}</h3><p>{items[index].meta}</p><button onClick={e => open(items[index], e.currentTarget)}>VIEW BRAND DETAILS ↗</button><div className="brand-wheel-controls"><button onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous brand">←</button><button onClick={() => go(index + 1)} disabled={index === items.length - 1} aria-label="Next brand">→</button></div><small>Scroll to explore, or select a logo</small></div>}
    </div>
    <dialog ref={dialog} className="brand-dialog" aria-labelledby="brand-dialog-title" onClose={() => { setSelected(null); opener.current?.focus(); }}>
      {selected && <><button className="brand-dialog-close" aria-label="Close brand details" onClick={() => dialog.current?.close()}>×</button><img src={selected.src} alt="" /><p className="brand-dialog-kicker">ORION MALL · BRAND DETAILS</p><h3 id="brand-dialog-title">{selected.title}</h3><p className="brand-dialog-floor">{selected.meta}</p><p>{selected.description}</p><a href="/clothing.html">Explore the clothing directory ↗</a></>}
    </dialog>
  </div>;
}
