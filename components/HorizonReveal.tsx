"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/* ─────────────────────────────────────────────────────────────────────────────
   Constants & helpers
   ──────────────────────────────────────────────────────────────────────────── */
const _AMBER = "#c9a853";   /* reserved for future use */

/* Per-character gradient for "HORIZON" — cream → amber → teal */
const H_COLS = [
  "#f5f0e4", "#eedfa0", "#e0c868",
  "#c9a853", "#94a055", "#4ba078", "#0f9388",
] as const;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const _hex  = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");

/* ─────────────────────────────────────────────────────────────────────────────
   Signal source data
   Each signal originates at (sx, sy) — normalised to viewport — and travels
   in a straight line to the horizon centre.  Label is displayed next to the
   leading dot until the signal accelerates out of view.
   ──────────────────────────────────────────────────────────────────────────── */
const SIG_DATA = [
  { label: "NVIDIA",        sx: 0.08,  sy: 0.16 },
  { label: "OpenAI",        sx: 0.85,  sy: 0.10 },
  { label: "Anthropic",     sx: 0.20,  sy: 0.29 },
  { label: "Robotics",      sx: 0.90,  sy: 0.22 },
  { label: "Quantum",       sx: 0.04,  sy: 0.42 },
  { label: "AI Research",   sx: 0.76,  sy: 0.35 },
  { label: "Breakthroughs", sx: 0.46,  sy: 0.12 },
  { label: "Startups",      sx: 0.63,  sy: 0.46 },
] as const;

/* Start times (seconds) for each signal — slightly staggered for variety */
const SIG_STARTS = [0.65, 0.74, 0.82, 0.70, 0.90, 0.68, 0.78, 0.86];

/* ─────────────────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────────────────── */
interface Signal {
  label: string;
  sx: number;
  sy: number;
  progress: number;  /* 0→1, GSAP with power3.in — slow then rushes */
  opacity: number;   /* 0→1→0, GSAP */
}

/* ═════════════════════════════════════════════════════════════════════════════
   Component
   ═════════════════════════════════════════════════════════════════════════════ */
export default function HorizonReveal() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const tlRef      = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    /* ── Accessibility fast-exit ──────────────────────────────────────── */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("horizon-revealed");
      if (overlayRef.current) overlayRef.current.style.display = "none";
      return;
    }

    const overlay = overlayRef.current!;
    const cv      = canvasRef.current!;
    const ctx     = cv.getContext("2d")!;
    let   rafId   = 0;
    const prevOvf = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function resize() {
      cv.width  = window.innerWidth;
      cv.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    /* ── Scene objects ────────────────────────────────────────────────── */
    const signals: Signal[] = SIG_DATA.map(d => ({ ...d, progress: 0, opacity: 0 }));

    /* Star field — sparse, barely there */
    const stars = Array.from({ length: 170 }, () => ({
      x:  Math.random(),
      y:  Math.random() * 0.60,
      r:  0.1 + Math.random() * 0.5,
      a:  0.02 + Math.random() * 0.09,
      ts: 0.18 + Math.random() * 0.42,
      tp: Math.random() * Math.PI * 2,
    }));

    /* ── GSAP-driven animation state ──────────────────────────────────── */
    const S = {
      starsO:   0,     /* star field opacity          0 → 1        */
      horizonO: 0,     /* horizon line opacity        0 → 1        */
      horizonW: 0,     /* horizon draw width (0→1 of screen half)  */
      horizonB: 0,     /* brightness boost at centre  0 → 1        */
      sigMast:  0,     /* signal-layer master opacity 0 → 1        */
      burstO:   0,     /* light burst opacity          0 → 1 → 0   */
      burstR:   0.05,  /* burst radius fraction of W               */
      cvFade:   1.0,   /* canvas master opacity        1 → 0.3     */
    };

    /* ── Draw loop ────────────────────────────────────────────────────── */
    function draw(ts: number) {
      const now = ts / 1000;
      const W   = cv.width,  H = cv.height;
      const cx  = W * 0.5;
      const hY  = H * 0.67;   /* horizon sits at 67 % of viewport height */
      const ma  = S.cvFade;

      ctx.clearRect(0, 0, W, H);

      /* ─── Stars ──────────────────────────────────────────────────── */
      if (S.starsO > 0.005) {
        stars.forEach(s => {
          const tw = 0.78 + 0.22 * Math.sin(now * s.ts + s.tp);
          ctx.beginPath();
          ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240,236,227,${s.a * S.starsO * tw * ma})`;
          ctx.fill();
        });
      }

      /* ─── Horizon ────────────────────────────────────────────────────
         Three visual layers:
         1. Ground fill — warm dark below the line
         2. Atmospheric band — soft haze around the line, brighter at centre
         3. Core 1 px line — gradient, brightest at centre
         4. Central halo — grows as signals arrive                       */
      if (S.horizonO > 0.005) {
        const ho  = S.horizonO;
        const brt = 1.0 + S.horizonB * 3.0;  /* brightness multiplier */

        /* Ground fill */
        ctx.fillStyle = `rgba(10,7,3,${0.94 * ho * ma})`;
        ctx.fillRect(0, hY, W, H - hY);

        /* Atmospheric band */
        const bH  = H * 0.13;
        const bnd = ctx.createLinearGradient(0, hY - bH, 0, hY + H * 0.055);
        bnd.addColorStop(0,    "rgba(201,168,83,0)");
        bnd.addColorStop(0.40, `rgba(201,168,83,${0.05 * ho * brt * ma})`);
        bnd.addColorStop(0.70, `rgba(225,185,65,${0.12 * ho * brt * ma})`);
        bnd.addColorStop(1,    "rgba(201,168,83,0)");
        ctx.fillStyle = bnd;
        ctx.fillRect(0, hY - bH, W, bH + H * 0.055);

        /* Central halo — powered by horizonB */
        if (S.horizonB > 0.005) {
          const hr   = W * 0.40 * S.horizonB;
          const halo = ctx.createRadialGradient(cx, hY, 0, cx, hY, hr);
          halo.addColorStop(0,    `rgba(255,248,168,${0.36 * S.horizonB * ma})`);
          halo.addColorStop(0.22, `rgba(228,182,60,${0.20 * S.horizonB * ma})`);
          halo.addColorStop(0.60, `rgba(201,168,83,${0.07 * S.horizonB * ma})`);
          halo.addColorStop(1,    "rgba(201,168,83,0)");
          ctx.fillStyle = halo;
          ctx.fillRect(cx - hr, hY - hr * 0.8, hr * 2, hr * 1.6);
        }

        /* Core horizon line — draws outward from centre */
        const hw = W * 0.5 * S.horizonW;
        if (hw > 1) {
          const la  = clamp(ho, 0, 1) * ma;
          const cb  = clamp(brt, 1, 3.5);

          /* Wide outer glow (very low opacity, wide) */
          const og = ctx.createLinearGradient(cx - hw, hY, cx + hw, hY);
          og.addColorStop(0,    "rgba(201,168,83,0)");
          og.addColorStop(0.10, `rgba(201,168,83,${0.15 * la})`);
          og.addColorStop(0.50, `rgba(201,168,83,${0.28 * la * cb})`);
          og.addColorStop(0.90, `rgba(201,168,83,${0.15 * la})`);
          og.addColorStop(1,    "rgba(201,168,83,0)");
          ctx.fillStyle = og;
          ctx.fillRect(cx - hw, hY - 6, hw * 2, 12);

          /* Crisp 1 px core */
          const cg = ctx.createLinearGradient(cx - hw, hY, cx + hw, hY);
          cg.addColorStop(0,    "rgba(201,168,83,0)");
          cg.addColorStop(0.10, `rgba(201,168,83,${0.52 * la})`);
          cg.addColorStop(0.44, `rgba(228,188,68,${0.85 * la * cb})`);
          cg.addColorStop(0.50, `rgba(255,228,100,${la * cb})`);
          cg.addColorStop(0.56, `rgba(228,188,68,${0.85 * la * cb})`);
          cg.addColorStop(0.90, `rgba(201,168,83,${0.52 * la})`);
          cg.addColorStop(1,    "rgba(201,168,83,0)");
          ctx.fillStyle = cg;
          ctx.fillRect(cx - hw, hY - 0.75, hw * 2, 1.5);
        }
      }

      /* ─── Intelligence signals ───────────────────────────────────────
         Each signal travels from its origin toward the horizon centre.
         Visual elements:
         • Fading trail line (last 12 % of path)
         • Soft leading glow
         • 1.6 px core dot
         • Label text — dims and disappears as signal accelerates      */
      if (S.sigMast > 0.005) {
        ctx.save();
        ctx.font = "9px 'JetBrains Mono', 'Courier New', monospace";

        signals.forEach(sig => {
          if (sig.opacity < 0.005) return;

          const startX = sig.sx * W;
          const startY = sig.sy * H;
          const t      = sig.progress;
          const px     = startX + (cx - startX) * t;
          const py     = startY + (hY - startY) * t;
          const a      = sig.opacity * S.sigMast * ma;

          /* Trail */
          const tT = Math.max(0, t - 0.12);
          if (t > 0.005 && tT < t) {
            const tx = startX + (cx - startX) * tT;
            const ty = startY + (hY - startY) * tT;
            const tg = ctx.createLinearGradient(tx, ty, px, py);
            tg.addColorStop(0, `rgba(201,168,83,0)`);
            tg.addColorStop(1, `rgba(201,168,83,${a * 0.48})`);
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(px, py);
            ctx.strokeStyle = tg;
            ctx.lineWidth   = 0.65;
            ctx.stroke();
          }

          /* Leading glow */
          const gw = ctx.createRadialGradient(px, py, 0, px, py, 11);
          gw.addColorStop(0,    `rgba(255,238,140,${a * 0.75})`);
          gw.addColorStop(0.38, `rgba(201,168,83,${a * 0.22})`);
          gw.addColorStop(1,    "rgba(201,168,83,0)");
          ctx.beginPath();
          ctx.arc(px, py, 11, 0, Math.PI * 2);
          ctx.fillStyle = gw;
          ctx.fill();

          /* Core dot */
          ctx.beginPath();
          ctx.arc(px, py, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,248,185,${a})`;
          ctx.fill();

          /* Label — fades as signal enters final burst phase */
          const labelA = a * clamp(1 - (t - 0.52) / 0.32, 0, 1);
          if (labelA > 0.005) {
            const fromRight = sig.sx >= 0.5;
            ctx.textAlign   = fromRight ? "right" : "left";
            ctx.fillStyle   = `rgba(115,90,38,${labelA})`;
            ctx.fillText(
              sig.label.toUpperCase(),
              px + (fromRight ? -9 : 9),
              py + 3.5,
            );
          }
        });

        ctx.restore();
      }

      /* ─── Light burst ─────────────────────────────────────────────────
         Radiates from the horizon centre when all signals have converged.
         Inspired by Dune / Interstellar — a controlled, inevitable dawn.
         Not explosive. More like the moment the sun clears the horizon.  */
      if (S.burstO > 0.005) {
        const br = W * S.burstR;
        const bo = S.burstO;
        const bg = ctx.createRadialGradient(cx, hY, 0, cx, hY, br);
        bg.addColorStop(0,    `rgba(255,254,238,${clamp(bo * 1.08, 0, 1)})`);
        bg.addColorStop(0.035,`rgba(255,248,158,${bo * 0.95})`);
        bg.addColorStop(0.10, `rgba(248,215,82,${bo * 0.78})`);
        bg.addColorStop(0.25, `rgba(225,172,52,${bo * 0.46})`);
        bg.addColorStop(0.48, `rgba(195,145,40,${bo * 0.20})`);
        bg.addColorStop(0.78, `rgba(150,110,32,${bo * 0.06})`);
        bg.addColorStop(1,    "rgba(6,5,4,0)");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
      }

      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);

    /* ── Finish ───────────────────────────────────────────────────────── */
    function finish() {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      document.body.style.overflow = prevOvf;
      document.documentElement.classList.add("horizon-revealed");
      gsap.to(overlay, {
        opacity: 0, duration: 0.9, ease: "power2.inOut",
        onComplete: () => { overlay.style.display = "none"; },
      });
    }

    /* ── GSAP master timeline ─────────────────────────────────────────── */
    const tl = gsap.timeline({ onComplete: finish });
    tlRef.current = tl;

    /* Phase 0 — Deep space appears (0 → 0.55 s) */
    tl.to(S, { starsO: 1, duration: 0.65, ease: "power1.out" }, 0);

    /* Phase 1 — Horizon line materialises (0.25 → 1.25 s) */
    tl.to(S, { horizonO: 1, duration: 0.80, ease: "power2.out" }, 0.25);
    tl.to(S, { horizonW: 1, duration: 1.15, ease: "power2.out" }, 0.30);

    /* Phase 2 — Signals appear and travel (0.62 → 2.5 s)
       Each uses power3.in — barely moving at first, then rushing.
       This is the key cinematic beat: stillness → inevitability.       */
    tl.to(S, { sigMast: 1, duration: 0.35, ease: "power1.out" }, 0.62);

    signals.forEach((sig, i) => {
      const t0 = SIG_STARTS[i] ?? 0.75;
      tl.to(sig, { opacity: 1, duration: 0.42, ease: "power1.out" }, t0);
      tl.to(sig, { progress: 1, duration: 1.55, ease: "power3.in"  }, t0 + 0.04);
      /* Fade out as signal merges with the horizon */
      tl.to(sig, { opacity: 0, duration: 0.22, ease: "power1.in"   }, t0 + 0.04 + 1.36);
    });

    /* Phase 3 — Horizon brightens as convergence completes (2.15 → 2.85 s) */
    tl.to(S, { horizonB: 1, duration: 0.68, ease: "power2.inOut" }, 2.15);

    /* Phase 4 — Light burst, then recedes (2.70 → 3.55 s) */
    tl.to(S, { burstO: 1, burstR: 0.82, duration: 0.40, ease: "power2.out" }, 2.70);
    tl.to(S, { burstO: 0,               duration: 0.75, ease: "power1.in"  }, 3.12);

    /* Canvas + stars dim so brand text reads cleanly */
    tl.to(S, { cvFade: 0.25, duration: 0.90, ease: "power1.inOut" }, 2.80);
    tl.to(S, { starsO: 0.30, duration: 0.70, ease: "power1.inOut" }, 2.85);
    /* Keep a soft horizon glow under the brand text */
    tl.to(S, { horizonB: 0.40, duration: 0.80, ease: "power1.inOut" }, 3.15);

    /* Phase 5 — Brand text appears (3.25 → 4.35 s)
       Restrained: pure opacity fade + 5 px upward drift.
       No blur, no flip, no drama. Like a title card in a film.        */
    const xEls = Array.from(overlay.querySelectorAll<HTMLElement>(".xh-char--x"));
    const hEls = Array.from(overlay.querySelectorAll<HTMLElement>(".xh-char--h"));

    /* XANTHRA */
    tl.fromTo(
      xEls,
      { opacity: 0, y: 5 },
      {
        opacity: 1, y: 0,
        stagger:  { amount: 0.30, ease: "power1.out" },
        duration: 1.05,
        ease:     "power1.out",
      },
      3.25
    );

    /* HORIZON — 380 ms after first letter of XANTHRA */
    tl.fromTo(
      hEls,
      { opacity: 0, y: 5 },
      {
        opacity: 1, y: 0,
        stagger:  { amount: 0.26, ease: "power1.out" },
        duration: 1.00,
        ease:     "power1.out",
      },
      3.60
    );

    /* Decorative line draws left to right */
    tl.fromTo(
      overlay.querySelector(".xh-deco-line"),
      { scaleX: 0 },
      { scaleX: 1, duration: 0.80, ease: "power2.inOut" },
      3.58
    );

    /* Tagline */
    tl.fromTo(
      overlay.querySelector(".xh-tagline"),
      { opacity: 0, y: 3 },
      { opacity: 1, y: 0, duration: 0.70, ease: "power1.out" },
      4.05
    );

    /* Skip hint */
    tl.fromTo(
      overlay.querySelector(".xh-skip"),
      { opacity: 0 },
      { opacity: 1, duration: 0.50 },
      4.35
    );

    /* Hold → onComplete → finish() (~5.05 s total) */
    tl.to({}, { duration: 0.70 }, 4.35);

    /* ── Skip handler ─────────────────────────────────────────────────── */
    function skip() { tlRef.current?.kill(); tlRef.current = null; finish(); }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        e.preventDefault(); skip();
      }
    };
    window.addEventListener("keydown", onKey);
    let armed = false;
    const arm  = setTimeout(() => {
      armed = true;
      overlay.addEventListener("click", skip);
    }, 950);

    return () => {
      tlRef.current?.kill();
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey);
      clearTimeout(arm);
      if (armed) overlay.removeEventListener("click", skip);
      document.body.style.overflow = prevOvf;
    };
  }, []);

  /* ── JSX ──────────────────────────────────────────────────────────────── */
  return (
    <div ref={overlayRef} className="xh-overlay" role="presentation" aria-hidden="true">

      {/* All visual effects rendered on the canvas */}
      <canvas ref={canvasRef} className="xh-canvas" />

      {/* Brand block — centred above the horizon */}
      <div className="xh-brand">

        {/* XANTHRA */}
        <div className="xh-word-wrap">
          {"XANTHRA".split("").map((ch, i) => (
            <span key={i} className="xh-char xh-char--x" style={{ opacity: 0 }}>
              {ch}
            </span>
          ))}
        </div>

        {/* HORIZON — each letter carries a colour from the gradient */}
        <div className="xh-word-wrap xh-word-wrap--h">
          {H_COLS.map((col, i) => (
            <span key={i} className="xh-char xh-char--h" style={{ color: col, opacity: 0 }}>
              {"HORIZON"[i]}
            </span>
          ))}
        </div>

        {/* Decorative rule — GSAP scaleX 0→1 */}
        <div
          className="xh-deco-line"
          style={{ transformOrigin: "left center", transform: "scaleX(0)" }}
        />

        {/* Tagline */}
        <p className="xh-tagline" style={{ opacity: 0 }}>
          Know What Matters Next.
        </p>

      </div>

      {/* Skip hint */}
      <p className="xh-skip" style={{ opacity: 0 }}>
        Press any key to skip
      </p>

    </div>
  );
}
