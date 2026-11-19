"use client";
import React, { type ReactNode, type RefObject } from "react";

/** Shelf presentation adapted from the supplied product shelf for mall brands. */
export function ProductShelf({ children, scroller, label }: { children: ReactNode; scroller: RefObject<HTMLDivElement | null>; label: string }) {
  return <div className="brand-shelf"><div ref={scroller} className="floor-track" tabIndex={0} aria-label={label}>{children}</div><div className="brand-shelf-edge" aria-hidden="true" /></div>;
}
