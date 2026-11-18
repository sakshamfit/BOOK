"use client";
import React, { useState } from "react";

export type FolderFile = { name: string; image: string };
export type GlassFolderProps = { label: string; meta?: string; logo?: string; files: FolderFile[]; contentId: string; onOpenChange: (open: boolean) => void; onPhotoSelect: (index: number, button: HTMLButtonElement) => void };

/** Frosted store folder. Its photo gallery is kept in the existing page. */
export default function GlassFolder({ label, meta, files, contentId, onOpenChange, onPhotoSelect }: GlassFolderProps) {
  const [open, setOpen] = useState(false);
  return <div className="glass-folder-object" data-open={open || undefined}>
    <div className="glass-folder-back" aria-hidden="true">{files[0] && <img src={files[0].image} alt="" loading="lazy" />}</div>
    <div className="glass-folder-stack">{files.slice(0, 3).map((f, i) => <button type="button" key={i} className="glass-folder-peek" aria-label={`View ${f.name}`} onClick={e => onPhotoSelect(i, e.currentTarget)} style={{ "--slot": i - 1, zIndex: i + 1 } as React.CSSProperties}><img src={f.image} alt="" loading="lazy" /></button>)}</div>
    <button className="glass-folder-front" type="button" aria-expanded={open} aria-controls={contentId} aria-label={`${open ? 'Close' : 'Open'} ${label} photo gallery`} onClick={() => { const next = !open; setOpen(next); onOpenChange(next); }}>
      <span className="glass-folder-logo"><strong>{label}</strong></span>
      <span className="glass-folder-front-bottom"><small>{meta} · {files.length} {files.length === 1 ? 'photo' : 'photos'}</small><b aria-hidden="true">{open ? '−' : '+'}</b></span>
    </button>
  </div>;
}
