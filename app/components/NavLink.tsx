import { ROLL } from "../lib/motion";

type NavLinkProps = {
  label: string;
  href?: string;
  className?: string;
};

/**
 * Rolling-label nav link: on hover the current label masks upward and a
 * duplicate label rolls in from below.
 */
export default function NavLink({
  label,
  href = "#",
  className = "",
}: NavLinkProps) {
  return (
    <a
      href={href}
      data-nav-item
      className={`group will-change-[transform,opacity] relative inline-flex items-center px-2.5 py-1 text-[12.5px] text-zinc-600 transition-colors duration-300 hover:text-zinc-950 ${className}`}
    >
      {/* Mask that clips both stacked labels to one line height */}
      <span className="relative block h-[1.25em] overflow-hidden leading-[1.25em]">
        <span
          className={`block will-change-transform transition-transform duration-300 ${ROLL} group-hover:-translate-y-full`}
        >
          {label}
        </span>
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 top-full block will-change-transform font-medium text-zinc-950 transition-transform duration-300 ${ROLL} group-hover:-translate-y-full`}
        >
          {label}
        </span>
      </span>
    </a>
  );
}
