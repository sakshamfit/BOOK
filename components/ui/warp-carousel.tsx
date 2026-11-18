"use client";
import React, { useState, useRef } from "react";

export type WarpPhoto = { name: string; image: string };
export type WarpCarouselProps = { photos: WarpPhoto[]; initialIndex?: number; label: string };

/** Photo-focused adaptation of the supplied warp carousel, without autoplay. */
export function WarpCarousel({ photos, initialIndex = 0, label }: WarpCarouselProps) {
  const [index, setIndex] = useState(Math.max(0, Math.min(initialIndex, photos.length - 1)));
  const start = useRef<number | null>(null);
  if (!photos.length) return null;
  const go = (delta: number) => setIndex(i => (i + delta + photos.length) % photos.length);
  return <section className="warp-photo-viewer" role="region" aria-roledescription="carousel" aria-label={`${label} photos`} onKeyDown={e => { if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } }}>
    <div className="warp-photo-heading"><span>STORE GALLERY</span><h2>{label}</h2><p aria-live="polite">Photo {index + 1} of {photos.length}</p></div>
    <div className="warp-photo-stage" onPointerDown={e => { start.current = e.clientX; }} onPointerUp={e => { if (start.current !== null && Math.abs(e.clientX - start.current) > 55) go(e.clientX < start.current ? 1 : -1); start.current = null; }} onPointerCancel={() => { start.current = null; }}>
      {photos.length > 1 && <><div className="warp-photo-side left" aria-hidden="true"><img src={photos[(index - 1 + photos.length) % photos.length].image} alt="" /></div><div className="warp-photo-side right" aria-hidden="true"><img src={photos[(index + 1) % photos.length].image} alt="" /></div></>}
      <figure className="warp-photo-current"><img src={photos[index].image} alt={photos[index].name} /><figcaption>{photos[index].name}</figcaption></figure>
    </div>
    {photos.length > 1 && <div className="warp-photo-controls"><button type="button" onClick={() => go(-1)} aria-label="Previous photo">←</button><span>SWIPE OR USE THE ARROWS</span><button type="button" onClick={() => go(1)} aria-label="Next photo">→</button></div>}
  </section>;
}
export default WarpCarousel;
