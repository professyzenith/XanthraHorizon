"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// ─── Types ────────────────────────────────────────────────────────────────────
interface IntelNode {
  x: number;           // 0-1 normalised to viewport width
  y: number;           // 0-1 normalised to viewport height
  opacity: number;     // GSAP-driven, starts 0
  targetOpacity: number;
  radius: number;
  color: string;
  pingOffset: number;  // phase offset for async ping ring animation
}
interface DataLine {
  fi: number;          // from-node index
  ti: number;          // to-node index
  progress: number;    // GSAP-driven 0-1 draw progress
}

// ─── Constants ────────────────────────────────────────────────────────────────
const AMBER    = "#c9a853";
const TEAL     = "#0f9388";
const VOID     = "#060504";
const HY_RATIO = 0.67;   // horizon sits at 67 % of viewport height
const N_NODES  = 26;

// ─── Helper: 0-255 to 2-digit hex ────────────────────────────────────────────
const hex = (v: number) =>
  Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");

// ─────────────────────────────────────────────────────────────────────────────
export default function HorizonReveal() {
  const overlayRef  = useRef<HTMLDivElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const xInnerRef   = useRef<HTMLDivElement>(null);
  const hInnerRef   = useRef<HTMLDivElement>(null);
  const taglineRef  = useRef<HTMLDivElement>(null);
  const skipRef     = useRef<HTMLParagraphElement>(null);
  const tlRef       = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // ── 1. Reduced-motion fast-exit ──────────────────────────────────────────
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("horizon-revealed");
      if (overlayRef.current) overlayRef.current.style.display = "none";
      return;
    }

    // ── 2. Lock scroll for the duration of the cinematic intro ───────────────
    const prevScroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // ── 3. Canvas setup ───────────────────────────────────────────────────────
    const overlay = overlayRef.current!;
    const cv  = canvasRef.current!;
    const ctx = cv.getContext("2d")!;
    let   rafId = 0;

    function resize() {
      cv.width  = window.innerWidth;
      cv.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // ── 4. GSAP-driven animation state object ─────────────────────────────────
    // GSAP tweens the numbers; the RAF draw loop reads them every frame.
    const S = {
      arcP:    0,    // horizon arc draw progress   0 → 1
      atmO:    0,    // atmosphere opacity           0 → 1
      atmR:    0.30, // atmosphere radius scale      0.3 → 1
      nReveal: 0,    // global node layer opacity    0 → 1
      cFade:   1.0,  // canvas master opacity        1 → 0.6 (brand text stands out)
    };

    // ── 5. Generate intelligence nodes (scattered in upper 54 % of screen) ────
    const nodes: IntelNode[] = Array.from({ length: N_NODES }, (_, i) => ({
      x:             0.07 + Math.random() * 0.86,
      y:             0.04 + Math.random() * 0.52,
      opacity:       0,
      targetOpacity: 0.65 + Math.random() * 0.35,
      radius:        1.2  + Math.random() * 1.9,
      color:         i % 3 === 0 ? TEAL : AMBER,
      pingOffset:    Math.random() * Math.PI * 2,
    }));

    // ── 6. Generate data lines between nearby nodes ───────────────────────────
    const lines: DataLine[] = [];
    for (let i = 0; i < N_NODES; i++) {
      const sorted = nodes
        .map((_, j) => {
          if (i === j) return null;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          return { j, d: Math.hypot(dx, dy) };
        })
        .filter((x): x is { j: number; d: number } => x !== null)
        .sort((a, b) => a.d - b.d);

      for (let k = 0; k < 2; k++) {
        if (!sorted[k] || sorted[k].d > 0.29) continue;
        const f = Math.min(i, sorted[k].j);
        const t = Math.max(i, sorted[k].j);
        if (!lines.find(l => l.fi === f && l.ti === t))
          lines.push({ fi: f, ti: t, progress: 0 });
      }
    }

    // ── 7. Faint star field (upper 52 % of screen) ───────────────────────────
    const stars = Array.from({ length: 88 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.52,
      r: 0.3 + Math.random() * 0.65,
      a: 0.04 + Math.random() * 0.11,
    }));

    // ── 8. Canvas draw loop ───────────────────────────────────────────────────
    function draw(ts: number) {
      const W  = cv.width,  H  = cv.height;
      const cx = W * 0.5,   hY = H * HY_RATIO;
      const ma = S.cFade;   // master alpha multiplier

      ctx.clearRect(0, 0, W, H);

      // ── 8a. Stars ────────────────────────────────────────────────────────
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,236,227,${s.a * S.atmO * ma})`;
        ctx.fill();
      });

      // ── 8b. Atmospheric sunrise glow ─────────────────────────────────────
      if (S.atmO > 0) {
        const ao = S.atmO * ma;
        const r1 = H * S.atmR * 0.54;
        const r2 = H * S.atmR * 1.00;

        // Golden core glow at horizon
        const g1 = ctx.createRadialGradient(cx, hY, 0, cx, hY, r1);
        g1.addColorStop(0,    `rgba(215,158,52,${0.30 * ao})`);
        g1.addColorStop(0.38, `rgba(155,97,33,${0.14 * ao})`);
        g1.addColorStop(0.75, `rgba(45,25,8,${0.05 * ao})`);
        g1.addColorStop(1,    "rgba(6,5,4,0)");
        ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

        // Deep-space blue haze above
        const g2 = ctx.createRadialGradient(cx, hY, r1 * 0.6, cx, hY, r2);
        g2.addColorStop(0,   `rgba(22,42,72,${0.09 * ao})`);
        g2.addColorStop(0.5, `rgba(14,26,50,${0.05 * ao})`);
        g2.addColorStop(1,   "rgba(6,5,4,0)");
        ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

        // Atmospheric limb — warm horizontal band right at the arc
        const lg = ctx.createLinearGradient(0, hY - H * 0.09, 0, hY + H * 0.04);
        lg.addColorStop(0,    "rgba(201,168,83,0)");
        lg.addColorStop(0.42, `rgba(201,168,83,${0.17 * ao})`);
        lg.addColorStop(0.67, `rgba(232,197,109,${0.27 * ao})`);
        lg.addColorStop(0.85, `rgba(201,168,83,${0.10 * ao})`);
        lg.addColorStop(1,    "rgba(6,5,4,0)");
        ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
      }

      // ── 8c. Earth horizon arc ─────────────────────────────────────────────
      if (S.arcP > 0) {
        const rx  = W * 0.62;
        const ry  = H * 0.165;
        const gap = (1 - S.arcP) * 0.44;   // arc draws out from the centre
        const a0  = Math.PI * (1 + gap);
        const a1  = Math.PI * (2 - gap);

        // Fill below arc with void colour (Earth's dark surface)
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, hY, rx, ry, 0, a0, a1);
        ctx.lineTo(cx + rx + 100, H + 60);
        ctx.lineTo(cx - rx - 100, H + 60);
        ctx.closePath();
        ctx.fillStyle = VOID;
        ctx.fill();
        ctx.restore();

        const la = Math.min(1, S.arcP * 2.2) * ma;

        // Multi-pass glow halos (outer → inner)
        const halos: [number, number][] = [[22, 0.05], [10, 0.09], [3.5, 0.16]];
        halos.forEach(([lw, oa]) => {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(cx, hY, rx, ry, 0, a0, a1);
          ctx.strokeStyle = `rgba(201,168,83,${oa * la})`;
          ctx.lineWidth = lw;
          ctx.stroke();
          ctx.restore();
        });

        // Crisp core line — gradient brighter in the centre
        const arcGrd = ctx.createLinearGradient(cx - rx, hY, cx + rx, hY);
        arcGrd.addColorStop(0,    "rgba(201,168,83,0)");
        arcGrd.addColorStop(0.12, `rgba(201,168,83,${0.50 * la})`);
        arcGrd.addColorStop(0.50, `rgba(232,197,109,${0.96 * la})`);
        arcGrd.addColorStop(0.88, `rgba(201,168,83,${0.50 * la})`);
        arcGrd.addColorStop(1,    "rgba(201,168,83,0)");
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, hY, rx, ry, 0, a0, a1);
        ctx.strokeStyle = arcGrd;
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.restore();
      }

      // ── 8d. Intelligence nodes & data lines ──────────────────────────────
      if (S.nReveal > 0) {
        const now = ts / 1000;

        nodes.forEach(nd => {
          if (nd.opacity < 0.01) return;
          const nx = nd.x * W,  ny = nd.y * H;
          const a  = nd.opacity * S.nReveal * ma;

          // Async ping ring
          const ph = ((now * 0.60 + nd.pingOffset * 0.16) % 1);
          if (ph < 0.58) {
            const pr = ph / 0.58;
            ctx.beginPath();
            ctx.arc(nx, ny, nd.radius + pr * 16, 0, Math.PI * 2);
            ctx.strokeStyle = `${nd.color}${hex((1 - pr) * 0.40 * a * 255)}`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }

          // Soft radial glow around node
          const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, nd.radius * 3.2);
          glow.addColorStop(0, `${nd.color}${hex(a * 52)}`);
          glow.addColorStop(1, `${nd.color}00`);
          ctx.beginPath();
          ctx.arc(nx, ny, nd.radius * 3.2, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();

          // Core dot
          ctx.beginPath();
          ctx.arc(nx, ny, nd.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${nd.color}${hex(a * 224)}`;
          ctx.fill();
        });

        // Data connection lines
        lines.forEach(ln => {
          if (ln.progress < 0.01) return;
          const fn = nodes[ln.fi], tn = nodes[ln.ti];
          if (fn.opacity < 0.06 || tn.opacity < 0.06) return;

          const x1 = fn.x * W, y1 = fn.y * H;
          const x2 = tn.x * W, y2 = tn.y * H;
          const la = Math.min(fn.opacity, tn.opacity) * S.nReveal * ln.progress * 0.30 * ma;

          const cg = ctx.createLinearGradient(x1, y1, x2, y2);
          cg.addColorStop(0, `rgba(201,168,83,${la})`);
          cg.addColorStop(1, `rgba(15,147,136,${la * 0.55})`);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 + (x2 - x1) * ln.progress, y1 + (y2 - y1) * ln.progress);
          ctx.strokeStyle = cg;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        });
      }

      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);

    // ── 9. Complete / cleanup ─────────────────────────────────────────────────
    function finish() {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      document.body.style.overflow = prevScroll;
      document.documentElement.classList.add("horizon-revealed");
      if (!overlay) return;
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.75,
        ease: "power2.inOut",
        onComplete: () => {
          overlay.style.display = "none";
        },
      });
    }

    // ── 10. GSAP master timeline ──────────────────────────────────────────────
    const tl = gsap.timeline({ onComplete: finish });
    tlRef.current = tl;

    // ── Phase 1: Arrival — horizon arc draws (0 → 1.1 s) ─────────────────────
    tl.to(S, { arcP: 1, duration: 1.1, ease: "power2.out" }, 0);

    // ── Phase 2: Sunrise — atmosphere expands (0.25 s → 2.2 s) ──────────────
    tl.to(S, { atmO: 1, duration: 1.3, ease: "power1.inOut" }, 0.25);
    tl.to(S, { atmR: 1, duration: 2.0, ease: "power1.out"   }, 0.25);

    // ── Phase 3: Intelligence awakens — nodes & lines appear ─────────────────
    tl.to(S, { nReveal: 1, duration: 0.65, ease: "power2.out" }, 1.2);

    nodes.forEach((nd, i) => {
      tl.to(nd, {
        opacity: nd.targetOpacity,
        duration: 0.38,
        ease: "power2.out",
      }, 1.18 + i * 0.052);
    });

    lines.forEach((ln, i) => {
      tl.to(ln, {
        progress: 1,
        duration: 0.62,
        ease: "power1.inOut",
      }, 1.52 + i * 0.030);
    });

    // ── Phase 4: Brand reveal — "XANTHRA" rises from the horizon (2.3 s) ─────
    tl.fromTo(
      xInnerRef.current,
      { yPercent: 112 },
      { yPercent: 0, duration: 1.05, ease: "power4.out" },
      2.3
    );
    // "HORIZON" follows with a slight delay (2.68 s) for cinematic stagger
    tl.fromTo(
      hInnerRef.current,
      { yPercent: 112 },
      { yPercent: 0, duration: 1.05, ease: "power4.out" },
      2.68
    );

    // Canvas dims so brand text reads cleanly against it (3.0 s)
    tl.to(S, { cFade: 0.58, duration: 0.85, ease: "power1.inOut" }, 3.0);

    // ── Phase 5: Full reveal — tagline + skip hint appear ─────────────────────
    tl.fromTo(
      taglineRef.current,
      { opacity: 0, y: 9 },
      { opacity: 1, y: 0, duration: 0.75, ease: "power2.out" },
      3.15
    );
    tl.fromTo(
      skipRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: "power1.out" },
      3.45
    );

    // Hold briefly, then onComplete fires → finish()
    tl.to({}, { duration: 0.6 }, 3.85);

    // ── 11. Skip on Escape / Space / click (armed after 0.9 s) ───────────────
    function skip() {
      tlRef.current?.kill();
      tlRef.current = null;
      // Instantly place brand text in its revealed position then fade out
      gsap.set([xInnerRef.current, hInnerRef.current], { yPercent: 0 });
      gsap.set(taglineRef.current, { opacity: 1, y: 0 });
      finish();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey);

    let clickArmed = false;
    const armTimer = setTimeout(() => {
      clickArmed = true;
      overlay?.addEventListener("click", skip);
    }, 900);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      tlRef.current?.kill();
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey);
      clearTimeout(armTimer);
      if (clickArmed) overlay?.removeEventListener("click", skip);
      document.body.style.overflow = prevScroll;
    };
  }, []);

  return (
    <div ref={overlayRef} className="xh-overlay" role="presentation" aria-hidden="true">
      {/* Canvas: all visual rendering happens here */}
      <canvas ref={canvasRef} className="xh-canvas" />

      {/* Brand text — centred, slightly above the canvas horizon arc */}
      <div className="xh-brand">
        {/* XANTHRA — overflow:hidden wrapper clips the rising reveal */}
        <div className="xh-word-wrap">
          <div ref={xInnerRef} className="xh-title xh-title--xanthra">
            XANTHRA
          </div>
        </div>
        {/* HORIZON — gradient variant, offset by 380 ms */}
        <div className="xh-word-wrap">
          <div ref={hInnerRef} className="xh-title xh-title--horizon">
            HORIZON
          </div>
        </div>
        {/* Tagline */}
        <p ref={taglineRef} className="xh-tagline" style={{ opacity: 0 }}>
          Know What Matters Next.
        </p>
      </div>

      {/* Skip hint — appears at ~3.45 s */}
      <p ref={skipRef} className="xh-skip" style={{ opacity: 0 }}>
        Press any key to skip
      </p>
    </div>
  );
}
