"use client";

import * as React from "react";

/** A lightweight, Orion-specific adaptation of the supplied Doodle Crew Footer. */
export interface DoodleCrewFooterProps {
  wordmark?: string;
  brand?: string;
  blurb?: string;
  tagline?: string;
  copyright?: string;
  columns?: { title: string; links: { label: string; href: string }[] }[];
  actions?: { label: string; href: string }[];
  socials?: { label: string; href: string }[];
}

const defaults = {
  columns: [
    { title: "Discover", links: [{ label: "Shopping", href: "/shop.html" }, { label: "Dining", href: "/dine.html" }, { label: "Entertainment", href: "/entertain.html" }, { label: "Events", href: "/events.html" }, { label: "Offers", href: "/offers.html" }] },
    { title: "Your visit", links: [{ label: "About Orion", href: "/about.html" }, { label: "Movies", href: "/movie.html" }, { label: "Services", href: "/services.html" }, { label: "Contact", href: "/contact.html" }] },
    { title: "Find us", links: [{ label: "Get directions", href: "https://www.google.com/maps/dir/?api=1&destination=Orion+Mall%2C+Mohaddipur%2C+Gorakhpur%2C+Uttar+Pradesh" }, { label: "Call us", href: "tel:09517636465" }] },
  ],
  actions: [{ label: "Explore stores", href: "/shop.html" }, { label: "Get directions ↗", href: "https://www.google.com/maps/dir/?api=1&destination=Orion+Mall%2C+Mohaddipur%2C+Gorakhpur%2C+Uttar+Pradesh" }],
  socials: [{ label: "Instagram ↗", href: "https://www.instagram.com/orion.mall/" }, { label: "Facebook ↗", href: "https://www.facebook.com/orionmallgkp" }, { label: "YouTube ↗", href: "https://www.youtube.com/@orionmall5150" }],
};

function Friend({ name, line, kind }: { name: string; line: string; kind: "cat" | "bird" | "ghost" }) {
  const [speaking, setSpeaking] = React.useState(false);
  const [gaze, setGaze] = React.useState({ x: 0, y: 0 });
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const say = () => { setSpeaking(true); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setSpeaking(false), 2500); };
  return <div className={`orion-friend friend-${kind}`}>
    {speaking && <span className="orion-bubble" role="status">{line}</span>}
    <button type="button" aria-label={`${name}: ${line}`} onClick={say} onPointerMove={(event) => {
      const box = event.currentTarget.getBoundingClientRect();
      setGaze({ x: Math.max(-2, Math.min(2, (event.clientX - box.left - box.width / 2) / 14)), y: Math.max(-2, Math.min(2, (event.clientY - box.top - box.height / 2) / 14)) });
    }} onPointerLeave={() => setGaze({ x: 0, y: 0 })}>
      <svg viewBox="0 0 100 112" aria-hidden="true">
        {kind === "cat" ? <><path d="M19 47 18 11 39 28 Q50 23 62 28 L82 11 81 47 Q91 59 87 77 Q83 98 50 98 Q17 98 13 77 Q9 59 19 47Z"/><path d="M28 44 30 26 40 34 M72 44 70 26 60 34" fill="none"/></> : kind === "bird" ? <><path d="M17 67 Q12 28 50 25 Q87 28 83 67 Q80 96 50 98 Q20 96 17 67Z"/><path d="M39 27 50 7 61 27Z" fill="#e9a274"/><path d="M50 64 61 69 50 74Z" fill="#e9a274"/></> : <><path d="M17 94 V51 Q17 17 50 17 Q83 17 83 51 V94 L72 85 61 94 50 85 39 94 28 85Z"/><path d="M22 55 Q9 46 10 65 M78 55 Q91 46 90 65" fill="none"/></>}
        <g transform={`translate(${gaze.x} ${gaze.y})`}><circle cx="38" cy="58" r="4" fill="#344a38" stroke="none"/><circle cx="62" cy="58" r="4" fill="#344a38" stroke="none"/></g><path d="M43 75 Q50 81 57 75" fill="none"/>
      </svg>
    </button>
  </div>;
}

function SocialIcon({ label }: { label: string }) {
  const name = label.toLowerCase();
  if (name.includes("instagram")) return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>;
  if (name.includes("facebook")) return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-8h2.8l.4-3h-3.2V8.2c0-.9.3-1.5 1.6-1.5h1.8V4.1c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.2V10H8v3h2.5v8z"/></svg>;
  if (name.includes("youtube")) return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 7.1a2.7 2.7 0 0 0-1.9-1.9C17.4 4.7 12 4.7 12 4.7s-5.4 0-7.1.5A2.7 2.7 0 0 0 3 7.1 28 28 0 0 0 2.5 12c0 1.7.2 3.3.5 4.9a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.1.5 7.1.5s5.4 0 7.1-.5a2.7 2.7 0 0 0 1.9-1.9c.3-1.6.5-3.2.5-4.9s-.2-3.3-.5-4.9ZM10 15.4V8.6l5.9 3.4z"/></svg>;
  return null;
}

export default function DoodleCrewFooter({ wordmark = "ORION", brand = "Orion Mall", blurb = "A little more to discover. Find us in Mohaddipur, Gorakhpur.", tagline = "Good days are better together.", copyright = "© Orion Mall Gorakhpur", columns = defaults.columns, actions = defaults.actions, socials = defaults.socials }: DoodleCrewFooterProps) {
  const root = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { threshold: 0.08 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <footer id="visit" className={`orion-doodle-footer ${visible ? "is-visible" : ""}`} ref={root}>
    <div className="orion-footer-top"><div><div className="orion-footer-brand"><img className="orion-footer-logo" src="https://orionmallgorakhpur.com/wp-content/uploads/2023/06/Orion-Logo.png" alt={brand} /></div><p>{blurb}</p></div><nav className="orion-footer-columns" aria-label="Footer navigation">{columns.map(column => <div key={column.title}><h3>{column.title}</h3>{column.links.map(link => <a key={link.label} href={link.href} target={link.href.includes("google.com/maps/dir/") ? "_blank" : undefined} rel={link.href.includes("google.com/maps/dir/") ? "noopener noreferrer" : undefined}>{link.label}</a>)}</div>)}</nav></div>
    <div className="orion-doodle-stage"><span className="orion-doodle doodle-one" aria-hidden="true">✳</span><span className="orion-doodle doodle-two" aria-hidden="true">✦</span><span className="orion-doodle doodle-three" aria-hidden="true">♡</span><div className="orion-word" aria-label={wordmark}>{Array.from(wordmark.toUpperCase()).map((letter, index) => <span aria-hidden="true" key={index} style={{ animationDelay: `${index * 90}ms` }}>{letter}</span>)}</div><Friend kind="cat" name="Orion cat" line="See you at Orion!"/><Friend kind="bird" name="Orion bird" line="A good day starts here!"/><Friend kind="ghost" name="Orion friend" line="Hello, Gorakhpur!"/><div className="orion-ground"/></div>
    <div className="orion-footer-cta"><p>{tagline}</p><div>{actions.map((action, index) => <a key={action.label} className={index ? "orion-pill solid" : "orion-pill"} href={action.href} target={action.href.includes("google.com/maps/dir/") ? "_blank" : undefined} rel={action.href.includes("google.com/maps/dir/") ? "noopener noreferrer" : undefined}>{action.label}</a>)}</div></div>
    <div className="orion-footer-bottom"><span>{copyright}</span><div>{socials.map(social => <a key={social.label} href={social.href} className="footer-social-icon" aria-label={social.label.replace(" ↗", "")}><SocialIcon label={social.label} /><span className="footer-social-text">{social.label}</span></a>)}</div><a href="#top">Back to top ↑</a></div>
  </footer>;
}
