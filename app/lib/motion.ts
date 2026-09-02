/**
 * Shared motion values.
 *
 * ROLL is the house easing curve for CSS hover transitions (label rolls,
 * fills, lifts). It lives here as a full Tailwind class so every component
 * uses the exact same curve — and so Tailwind's scanner sees the literal
 * `ease-[cubic-bezier(...)]` string and generates the utility.
 */
export const ROLL = "ease-[cubic-bezier(0.76,0,0.24,1)]";
