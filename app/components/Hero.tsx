"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import Header from "./Header";
import { ROLL } from "../lib/motion";

gsap.registerPlugin(SplitText, CustomEase, useGSAP);

/* ── Intro configuration ──────────────────────────────────────────────── */

// The two words shown before the reveal. Left one exits left, right one right.
const INTRO_WORDS = ["Slow", "Meadow"] as const;

// The reveal window while fully closed: a zero-width pill in the centre.
const CLIP_CLOSED = {
  top: 47.5,
  bottom: 47.5,
  left: 50,
  right: 50,
  radius: 999,
};

// Timeline anchors (seconds).
const PUSH_AT = 1.0; // words start parting
const PUSH_DUR = 1.7;
const OPEN_AT = 2.55; // bar starts opening vertically
const OPEN_DUR = 1.4;
// EASE_OPEN is front-loaded, so ~30% visual progress lands at 22% of its
// duration. The centre content starts revealing right then — the copy rises
// while the image is still expanding behind it.
const OPEN_HALF = 0.22;
const CONTENT_AT = OPEN_AT + OPEN_DUR * OPEN_HALF;

/* ── Easing ───────────────────────────────────────────────────────────── */

const EASE_OUT = "expo.out";
// Custom curves for the intro. Both are expo.inOut-like but asymmetric:
//   PUSH — slow build, hard shove through the middle, long silky settle.
//   OPEN — snappier entry, same long settle so the two phases feel related.
const EASE_PUSH = CustomEase.create("heroPush", "M0,0 C0.76,0 0.12,1 1,1");
const EASE_OPEN = CustomEase.create("heroOpen", "M0,0 C0.6,0 0.1,1 1,1");

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scope = root.current;
      if (!scope) return;

      const q = gsap.utils.selector(scope);
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const intro = q("[data-intro]");
      const introLeft = q("[data-intro-left]");
      const introRight = q("[data-intro-right]");
      const bgClip = q("[data-bg-clip]");
      const bgImg = q("[data-bg-img]");
      const haze = q("[data-haze]");
      const navShell = q("[data-nav-shell]");
      const navItems = q("[data-nav-item]");
      const badge = q("[data-badge]");
      const heading = q("[data-heading]")[0];
      const copy = q("[data-copy]");
      const ctas = q("[data-cta]");

      // Root is `invisible` in CSS. Before un-hiding it, put every animated
      // element into its hidden start state *synchronously* — build() below
      // waits for webfonts, and anything not hidden here would flash in the
      // meantime.
      gsap.set([navShell, navItems, badge, heading, copy, ctas, haze], {
        opacity: 0,
      });
      gsap.set(bgClip, {
        clipPath: `inset(${CLIP_CLOSED.top}% ${CLIP_CLOSED.right}% ${CLIP_CLOSED.bottom}% ${CLIP_CLOSED.left}% round ${CLIP_CLOSED.radius}px)`,
      });
      gsap.set(bgImg, { scale: 1.35 });
      gsap.set(scope, { autoAlpha: 1 });

      if (reduced) {
        gsap.set(
          [bgClip, bgImg, haze, navShell, navItems, badge, heading, copy, ctas],
          { clearProps: "all", opacity: 1 },
        );
        gsap.set(intro, { autoAlpha: 0 });
        return;
      }

      let headingSplit: SplitText | undefined;
      let copySplit: SplitText | undefined;
      let tl: gsap.core.Timeline | undefined;
      let drift: gsap.core.Tween | undefined;

      const build = () => {
        // Line-masked splits: every line lives in an overflow-hidden mask, so
        // sliding from yPercent 100 -> 0 gives the "curtain" reveal.
        headingSplit = SplitText.create(heading, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
        });
        copySplit = SplitText.create(copy, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
        });
        // The split lines are what animate now; the parents can be visible.
        gsap.set([heading, copy], { opacity: 1 });

        /* ── Reveal-window geometry ─────────────────────────────────── */

        const clipEl = bgClip[0] as HTMLElement;
        const leftEl = introLeft[0];
        const rightEl = introRight[0];
        const GAP_PAD = 20; // px between a word's edge and the window
        // Side margin the bar keeps from the viewport edges before it opens.
        const edgeGap = () => Math.max(24, window.innerWidth * 0.04);

        // Live geometry of the window, in viewport %. Updated every frame
        // while the words part, then reused by the vertical open so both
        // phases share one source of truth (never the browser-serialised
        // clip-path string, whose shorthand form breaks GSAP interpolation).
        const win = { ...CLIP_CLOSED };

        const applyClip = () => {
          clipEl.style.clipPath = `inset(${win.top}% ${win.right}% ${win.bottom}% ${win.left}% round ${win.radius}px)`;
        };

        // The window *is* the gap between the words: left edge = left word's
        // right edge, right edge = right word's left edge, top/bottom = the
        // words' own text box.
        //
        // Layout is measured ONCE (words at rest, x = 0) and cached; every
        // frame afterwards only reads GSAP's transform value, which is a
        // plain property lookup — no forced reflow while the animation runs.
        let rest: {
          lRight: number;
          rLeft: number;
          top: number;
          bottom: number;
        } | null = null;
        const measureRest = () => {
          const l = leftEl.getBoundingClientRect();
          const r = rightEl.getBoundingClientRect();
          rest = {
            lRight: l.right,
            rLeft: r.left,
            top: Math.min(l.top, r.top),
            bottom: Math.max(l.bottom, r.bottom),
          };
        };
        const trackGap = () => {
          if (!rest) measureRest();
          const { lRight, rLeft, top, bottom } = rest!;
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const lx = Number(gsap.getProperty(leftEl, "x"));
          const rx = Number(gsap.getProperty(rightEl, "x"));
          const edge = edgeGap();
          const x1 = gsap.utils.clamp(edge, vw - edge, lRight + lx + GAP_PAD);
          const x2 = gsap.utils.clamp(edge, vw - edge, rLeft + rx - GAP_PAD);
          win.top = (top / vh) * 100;
          win.bottom = ((vh - bottom) / vh) * 100;
          if (x2 <= x1) {
            win.left = win.right = 50;
          } else {
            win.left = (x1 / vw) * 100;
            win.right = ((vw - x2) / vw) * 100;
          }
          win.radius = (bottom - top) / 2;
          applyClip();
        };

        // How far each word must travel to fully leave the viewport.
        const exitDistance = (el: Element) => {
          const rect = el.getBoundingClientRect();
          return window.innerWidth / 2 + rect.width / 2 + 40;
        };

        /* ── Timeline ───────────────────────────────────────────────── */

        tl = gsap.timeline({
          defaults: { ease: EASE_OUT },
          // Release compositor hints once the entrance is done so the
          // browser does not keep every layer promoted forever.
          onComplete: () =>
            gsap.set(
              [
                bgClip,
                haze,
                navShell,
                navItems,
                badge,
                ctas,
                intro,
                introLeft,
                introRight,
                headingSplit?.lines ?? [],
                copySplit?.lines ?? [],
              ],
              { willChange: "auto" },
            ),
        });

        // 0. Intro: two words appear, then the image "pushes" them apart.
        //    The clip window tracks the gap between them every frame.
        tl.fromTo(
          [introLeft, introRight],
          { yPercent: 40, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.08 },
          0,
        )
          // Measure right before the push: the fade-up has finished, so the
          // cached rest positions are exact.
          .call(measureRest, [], PUSH_AT)
          .to(
            introLeft,
            {
              x: () => -exitDistance(leftEl),
              duration: PUSH_DUR,
              ease: EASE_PUSH,
            },
            PUSH_AT,
          )
          .to(
            introRight,
            {
              x: () => exitDistance(rightEl),
              duration: PUSH_DUR,
              ease: EASE_PUSH,
              // Runs after both words have moved this frame (tweens render
              // in insertion order), so the window reads fresh positions.
              onUpdate: trackGap,
            },
            PUSH_AT,
          )
          .set(intro, { autoAlpha: 0 }, PUSH_AT + PUSH_DUR)
          // Words are gone and the bar spans the viewport: open vertically.
          .to(
            win,
            {
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              radius: 0,
              duration: OPEN_DUR,
              ease: EASE_OPEN,
              onUpdate: applyClip,
            },
            OPEN_AT,
          )
          // Zoom settles in two stages so it is still visibly easing during
          // the vertical open, not finished during the bar phase.
          .to(
            bgImg,
            { scale: 1.15, duration: OPEN_AT - PUSH_AT, ease: EASE_PUSH },
            PUSH_AT,
          )
          .to(bgImg, { scale: 1, duration: OPEN_DUR, ease: EASE_OPEN }, OPEN_AT)
          .to(haze, { opacity: 1, duration: 1.4 }, OPEN_AT + 0.25);

        // 1. Centre content, in reading order, starting when the open is
        //    visually halfway.
        tl.fromTo(
          badge,
          { y: 18, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 0.9 },
          CONTENT_AT,
        )
          .from(
            headingSplit.lines,
            { yPercent: 110, rotate: 2, duration: 1.3, stagger: 0.09 },
            CONTENT_AT + 0.05,
          )
          .from(
            copySplit.lines,
            { yPercent: 100, opacity: 0, duration: 1.1, stagger: 0.08 },
            CONTENT_AT + 0.3,
          )
          .fromTo(
            ctas,
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 },
            CONTENT_AT + 0.5,
          );

        // 2. Header drops in last: pill, then logo / links / Sign in.
        tl.fromTo(
          navShell,
          { yPercent: -140, opacity: 0, scale: 0.94 },
          { yPercent: 0, opacity: 1, scale: 1, duration: 1.1 },
          CONTENT_AT + 0.75,
        ).fromTo(
          navItems,
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.06 },
          CONTENT_AT + 0.95,
        );

        // 3. Slow infinite drift once everything has settled.
        drift = gsap.to(bgImg, {
          yPercent: -1.5,
          scale: 1.03,
          duration: 14,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: CONTENT_AT + 1.2,
        });
      };

      // Split only after webfonts load so line breaks are final.
      document.fonts.ready.then(build);

      return () => {
        tl?.kill();
        drift?.kill();
        headingSplit?.revert();
        copySplit?.revert();
      };
    },
    { scope: root },
  );

  return (
    <main
      ref={root}
      className="invisible relative min-h-svh w-full overflow-hidden bg-[#dfe6ee] font-sans"
    >
      {/* Background image — the clipped wrapper animates open */}
      <div data-bg-clip className="absolute inset-0 will-change-[clip-path]">
        <div
          data-bg-img
          className="absolute inset-0 backface-hidden will-change-transform"
        >
          <Image
            src="/hero-bg.png"
            alt="Sunlit alpine valley with wildflowers and a small cabin"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </div>

      {/* Soft haze so text stays legible against the sky */}
      <div
        data-haze
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/30 via-white/10 to-transparent will-change-[opacity]"
      />

      {/* Intro: two words that part to reveal the background */}
      <div
        data-intro
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center gap-[0.14em] px-6 text-[clamp(2.5rem,9vw,5.5rem)] font-semibold leading-[1.05] tracking-[-0.055em] text-zinc-900"
      >
        <span
          data-intro-left
          className="backface-hidden block opacity-0 will-change-[transform,opacity]"
        >
          {INTRO_WORDS[0]}
        </span>
        <span
          data-intro-right
          className="backface-hidden block opacity-0 will-change-[transform,opacity]"
        >
          {INTRO_WORDS[1]}
        </span>
      </div>

      <Header />

      {/* Hero copy */}
      <section className="relative z-10 flex min-h-svh flex-col items-center justify-center px-6 text-center">
        <span
          data-badge
          className="mb-6 inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/80 px-3.5 py-1.5 text-[13px] font-medium text-zinc-700 shadow-sm backdrop-blur-md will-change-[transform,opacity]"
        >
          Meadow 2.0 is here
          <span className="inline-block animate-float" aria-hidden="true">
            🌿
          </span>
        </span>

        <h1
          data-heading
          className="text-balance text-[clamp(2.5rem,9vw,5.5rem)] font-semibold leading-[1.05] tracking-[-0.065em] text-zinc-900"
        >
          Work at a walking pace.
        </h1>

        {/* One <p> per sentence: desktop gets a clean break between them,
            mobile balances each sentence on its own. */}
        <div className="mt-5 max-w-xl text-[clamp(1rem,2vw,1.4rem)] leading-relaxed text-zinc-800 sm:mt-6">
          <p data-copy className="text-balance">
            Meadow is the quiet workspace that tidies itself.
          </p>
          <p data-copy className="text-balance">
            Fewer pings, more shipped.
          </p>
        </div>

        {/* GSAP animates the wrappers; each <a> keeps its own CSS hover
            transitions so the two never fight over `transform`. */}
        <div className="mt-8 flex w-full max-w-xs flex-col items-stretch gap-3 sm:mt-9 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
          <span
            data-cta
            className="flex will-change-[transform,opacity] sm:inline-flex"
          >
            <a
              href="#"
              className={`inline-flex w-full items-center justify-center rounded-full bg-white px-7 py-3.5 text-[15px] font-medium text-zinc-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] duration-300 ${ROLL} will-change-transform hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)] active:translate-y-0 active:duration-150`}
            >
              Start for free
            </a>
          </span>
          <span
            data-cta
            className="flex will-change-[transform,opacity] sm:inline-flex"
          >
            <a
              href="#"
              className={`inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-7 py-3.5 text-[15px] font-medium text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)] transition-[transform,box-shadow,background-color] duration-300 ${ROLL} will-change-transform hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)] active:translate-y-0 active:duration-150`}
            >
              Take the tour
            </a>
          </span>
        </div>
      </section>
    </main>
  );
}
