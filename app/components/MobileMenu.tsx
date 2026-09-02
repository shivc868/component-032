"use client";

import { useEffect, useState } from "react";
import { ROLL } from "../lib/motion";

type MobileMenuProps = {
  links: readonly string[];
};

/**
 * Hamburger + dropdown panel for < md screens. The button carries
 * `data-nav-item` so the Hero's GSAP timeline staggers it in with the rest
 * of the header; the panel itself is CSS-driven.
 */
export default function MobileMenu({ links }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  // Close on Escape and when the viewport grows past the mobile breakpoint.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        data-nav-item
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
        className="relative ml-1 flex size-9 items-center justify-center rounded-full text-zinc-900 will-change-[transform,opacity] transition-colors hover:bg-zinc-100 md:hidden"
      >
        <span
          aria-hidden="true"
          className={`absolute h-[1.5px] w-4 rounded-full bg-current transition-transform duration-300 ${ROLL} ${
            open ? "rotate-45" : "-translate-y-[3px]"
          }`}
        />
        <span
          aria-hidden="true"
          className={`absolute h-[1.5px] w-4 rounded-full bg-current transition-transform duration-300 ${ROLL} ${
            open ? "-rotate-45" : "translate-y-[3px]"
          }`}
        />
      </button>

      {/* Dropdown panel — positioned relative to the <header> */}
      <div
        id="mobile-menu"
        aria-hidden={!open}
        className={`absolute inset-x-4 top-full mt-2 origin-top rounded-3xl border border-white/60 bg-white p-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-[opacity,transform] duration-300 ${ROLL} md:hidden ${
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <ul className="flex flex-col">
          {links.map((label, i) => (
            <li key={label}>
              <a
                href="#"
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                style={{ transitionDelay: open ? `${60 + i * 40}ms` : "0ms" }}
                className={`block rounded-2xl px-4 py-3 text-[15px] font-medium text-zinc-800 transition-[opacity,transform,background-color] duration-300 ${ROLL} hover:bg-zinc-100 ${
                  open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
