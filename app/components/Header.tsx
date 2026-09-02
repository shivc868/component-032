import NavLink from "./NavLink";
import MobileMenu from "./MobileMenu";
import { ROLL } from "../lib/motion";

const NAV_LINKS = ["Product", "Features", "Pricing", "Journal", "Contact"];

/**
 * Floating pill header. Elements carry `data-nav-shell` / `data-nav-item`
 * so the Hero's GSAP timeline can stagger them in.
 */
export default function Header() {
  return (
    <header className="absolute inset-x-0 top-6 z-20 flex justify-center px-4">
      <nav
        data-nav-shell
        className="will-change-[transform,opacity] flex items-center gap-2 rounded-full border border-white/60 bg-white/85 py-1.5 pl-4 pr-1.5 md:pl-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl"
      >
        <a
          href="#"
          data-nav-item
          className="group will-change-[transform,opacity] flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-zinc-900"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={`transition-transform duration-300 ${ROLL} group-hover:rotate-90`}
          >
            {/* Leaf mark */}
            <path
              d="M20 4C11 4 5 9.5 5 17.5c0 1 .1 1.9.3 2.5C13.5 20 20 14 20 4Z"
              fill="var(--brand)"
            />
            <path
              d="M6 19.5C9.5 14.5 13.5 10.5 18 7.5"
              stroke="#fff"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          Meadow
        </a>

        <ul className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((label) => (
            <li key={label}>
              <NavLink label={label} />
            </li>
          ))}
        </ul>

        {/* GSAP animates the wrapper; the <a> keeps its own CSS hover transitions
            so the two never fight over `transform`. */}
        <span
          data-nav-item
          className="ml-2 inline-flex items-center will-change-[transform,opacity] md:ml-3"
        >
          <a
            href="#"
            className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-zinc-950 px-[18px] py-[7px] text-[12.5px] font-medium leading-none text-white transition-transform duration-300 ${ROLL} hover:scale-105 active:scale-95 active:duration-150`}
          >
            {/* Brand fill sweeps up on hover */}
            <span
              aria-hidden="true"
              className={`absolute inset-0 origin-bottom scale-y-0 will-change-transform bg-brand transition-transform duration-300 ${ROLL} group-hover:scale-y-100`}
            />
            <span className="relative block h-[1.25em] overflow-hidden leading-[1.25em]">
              <span
                className={`block will-change-transform transition-transform duration-300 ${ROLL} group-hover:-translate-y-full`}
              >
                Sign in
              </span>
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-full block will-change-transform transition-transform duration-300 ${ROLL} group-hover:-translate-y-full`}
              >
                Sign in
              </span>
            </span>
          </a>
        </span>

        <MobileMenu links={NAV_LINKS} />
      </nav>
    </header>
  );
}
