"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/* ─────────────────────────────────────────────────────────────────────────────
   TOPOJSON DECODER — minimal, no dependency
   ──────────────────────────────────────────────────────────────────────────── */
type Coord2 = [number, number];
type Ring   = Coord2[];
type Poly   = Ring[];

// TopoJSON has a flexible structure — typed loosely here
type TopoJSON = Record<string, any>;

function decodeTopo(topo: TopoJSON): Poly[] {
  const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;

  const arcs: Ring[] = topo.arcs.map((raw: Coord2[]) => {
    let qx = 0, qy = 0;
    return raw.map(([dx, dy]) => { qx += dx; qy += dy; return [qx * sx + tx, qy * sy + ty] as Coord2; });
  });

  const resolveArc = (i: number): Ring =>
    i >= 0 ? arcs[i] : [...arcs[~i]].reverse();

  const buildRing = (refs: number[]): Ring => refs.flatMap(resolveArc);

  const polys: Poly[] = [];
  function addGeom(g: TopoJSON) {
    if      (g.type === "Polygon")           polys.push(g.arcs.map(buildRing));
    else if (g.type === "MultiPolygon")      g.arcs.forEach((p: number[][]) => polys.push(p.map(buildRing)));
    else if (g.type === "GeometryCollection") g.geometries.forEach(addGeom);
  }
  const obj: TopoJSON = topo.objects.land ?? Object.values(topo.objects)[0];
  if (obj.type === "GeometryCollection") obj.geometries.forEach(addGeom);
  else addGeom(obj);

  return polys;
}

/* ─────────────────────────────────────────────────────────────────────────────
   EQUIRECTANGULAR PROJECTION  — lat clipped ±72°
   Map occupies W*4%…W*96% × H*6%…H*62%  (leaves horizon zone clear)
   ──────────────────────────────────────────────────────────────────────────── */
const LAT_MAX = 72, LAT_MIN = -58, LAT_SPAN = LAT_MAX - LAT_MIN;
const MX0 = 0.04, MX1 = 0.96;
const MY0 = 0.06, MY1 = 0.62;

function px(lon: number, W: number) { return (MX0 + ((lon + 180) / 360) * (MX1 - MX0)) * W; }
function py(lat: number, H: number) {
  const c = Math.max(LAT_MIN, Math.min(LAT_MAX, lat));
  return (MY0 + ((LAT_MAX - c) / LAT_SPAN) * (MY1 - MY0)) * H;
}

/* ─────────────────────────────────────────────────────────────────────────────
   REGIONS — 6 global intelligence-gathering nodes
   ──────────────────────────────────────────────────────────────────────────── */
const REGIONS = [
  { label: "NORTH AMERICA", lon: -97,  lat: 38  },
  { label: "EUROPE",        lon:   8,  lat: 51  },
  { label: "INDIA",         lon:  79,  lat: 22  },
  { label: "MIDDLE EAST",   lon:  47,  lat: 25  },
  { label: "EAST ASIA",     lon: 116,  lat: 36  },
  { label: "S.E. ASIA",     lon: 101,  lat: 14  },
] as const;

const ACT_T = [0.45, 0.72, 1.00, 1.25, 1.52, 1.80] as const;

/* ═════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═════════════════════════════════════════════════════════════════════════════ */
export default function GlobalSyncPrelude() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const skipBtnRef = useRef<HTMLButtonElement>(null);
  const tlRef      = useRef<gsap.core.Timeline | null>(null);
  const rafRef     = useRef<number>(0);
  const doneRef    = useRef(false);
  const skipRef    = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (overlayRef.current) overlayRef.current.style.display = "none";
      return;
    }

    const overlay = overlayRef.current!;
    const cv      = canvasRef.current!;
    const skipBtn = skipBtnRef.current!;
    const ctx     = cv.getContext("2d")!;
    const dpr     = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const W = window.innerWidth, H = window.innerHeight;
      cv.width  = W * dpr; cv.style.width  = W + "px";
      cv.height = H * dpr; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    /* ── Skip handler ──────────────────────────────────────────────────── */
    function doSkip() {
      if (doneRef.current) return;
      doneRef.current = true;
      tlRef.current?.kill();
      cancelAnimationFrame(rafRef.current);
      gsap.to(overlay, {
        opacity: 0, duration: 0.4, ease: "power2.in",
        onComplete: () => { overlay.style.display = "none"; },
      });
    }
    skipRef.current = doSkip;

    /* ── Animation state ────────────────────────────────────────────────── */
    const G = {
      mapO:    0,   // map + graticule opacity
      titleO:  0,   // header text
      syncO:   0,   // "NETWORK SYNCHRONIZED"
      horizO:  0,   // horizon line opacity
      horizW:  0,   // horizon line width 0→1
      overlayO: 1,  // whole overlay alpha
      scanY:   0,   // 0→1 scan line progress
    };

    const R = REGIONS.map(r => ({
      ...r,
      dotO:   0, pulseO: 0, pulseR: 0,
      checkO: 0, sigO:   0, sigP:   0,
    }));

    /* ── Real world map data ─────────────────────────────────────────────── */
    let polys: Poly[] = [];
    let dataReady = false;

    fetch("/world-110m.json")
      .then(r => r.json())
      .then(topo => { polys = decodeTopo(topo); dataReady = true; })
      .catch(() => { dataReady = true; /* continue without land */ });

    /* ── Draw ─────────────────────────────────────────────────────────────── */
    function draw(ts: number) {
      const W = cv.width / dpr, H = cv.height / dpr;
      const cx = W * 0.5;
      const hY = H * 0.67;
      const oa = G.overlayO;

      /* ALWAYS paint solid background first — never transparent */
      ctx.fillStyle = "rgb(6,5,4)";
      ctx.fillRect(0, 0, W, H);
      /* Overlay fade multiplied on top */
      if (oa < 0.999) {
        ctx.fillStyle = `rgba(6,5,4,${1 - oa})`;
        ctx.fillRect(0, 0, W, H);
      }

      if (G.mapO > 0.005) {
        const mo = G.mapO * oa;

        /* ── Graticule ──────────────────────────────────────────────────── */
        ctx.save();
        ctx.lineWidth = 0.35;
        for (let lon = -180; lon <= 180; lon += 30) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(201,168,83,${(lon === 0 ? 0.07 : 0.032) * mo})`;
          ctx.moveTo(px(lon, W), py(LAT_MAX, H));
          ctx.lineTo(px(lon, W), py(LAT_MIN, H));
          ctx.stroke();
        }
        for (let lat = -60; lat <= 72; lat += 30) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(201,168,83,${(lat === 0 ? 0.09 : 0.032) * mo})`;
          ctx.moveTo(px(-180, W), py(lat, H));
          ctx.lineTo(px(180,  W), py(lat, H));
          ctx.stroke();
        }
        ctx.restore();

        /* ── Real land polygons (topojson) ──────────────────────────────── */
        if (dataReady) {
          for (const poly of polys) {
            const ring = poly[0];
            if (ring.length < 3) continue;

            ctx.beginPath();
            let first = true;
            for (const [lon, lat] of ring) {
              if (lat < LAT_MIN - 2 || lat > LAT_MAX + 2) { first = true; continue; }
              const sx = px(lon, W), sy = py(lat, H);
              first ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
              first = false;
            }
            ctx.closePath();
            ctx.fillStyle   = `rgba(40,30,12,${0.60 * mo})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(201,168,83,${0.24 * mo})`;
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }

        /* ── Moving scan line ────────────────────────────────────────────── */
        const sy = (MY0 + G.scanY * (MY1 - MY0)) * H;
        const sg = ctx.createLinearGradient(0, sy - 20, 0, sy + 10);
        sg.addColorStop(0,    "rgba(201,168,83,0)");
        sg.addColorStop(0.65, `rgba(201,168,83,${0.06 * mo})`);
        sg.addColorStop(1,    "rgba(201,168,83,0)");
        ctx.fillStyle = sg;
        ctx.fillRect(MX0 * W, sy - 20, (MX1 - MX0) * W, 30);
      }

      /* ── Network mesh lines ──────────────────────────────────────────── */
      for (let i = 0; i < R.length; i++) {
        for (let j = i + 1; j < R.length; j++) {
          const a = R[i], b = R[j];
          const alpha = Math.min(a.dotO, b.dotO) * 0.09 * oa;
          if (alpha < 0.005) continue;
          const ax = px(a.lon, W), ay = py(a.lat, H);
          const bx = px(b.lon, W), by = py(b.lat, H);
          const lg = ctx.createLinearGradient(ax, ay, bx, by);
          lg.addColorStop(0,   `rgba(201,168,83,${alpha})`);
          lg.addColorStop(0.5, `rgba(255,210,80,${alpha * 1.6})`);
          lg.addColorStop(1,   `rgba(201,168,83,${alpha})`);
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
          ctx.strokeStyle = lg; ctx.lineWidth = 0.5; ctx.stroke();
        }
      }

      /* ── Region nodes ────────────────────────────────────────────────── */
      const t = ts / 1000;
      R.forEach(r => {
        if (r.dotO < 0.005) return;
        const rx = px(r.lon, W), ry = py(r.lat, H);

        /* Pulse ring */
        if (r.pulseO > 0.005) {
          ctx.beginPath();
          ctx.arc(rx, ry, r.pulseR * 24, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(201,168,83,${r.pulseO * 0.38 * oa})`;
          ctx.lineWidth = 0.8; ctx.stroke();
        }

        /* Breathing glow */
        const breath = 0.72 + 0.28 * Math.sin(t * 2.4 + r.lon * 0.03);
        const grd = ctx.createRadialGradient(rx, ry, 0, rx, ry, 22);
        grd.addColorStop(0,   `rgba(255,220,80,${r.dotO * 0.72 * breath * oa})`);
        grd.addColorStop(0.4, `rgba(201,168,83,${r.dotO * 0.18 * oa})`);
        grd.addColorStop(1,   "rgba(201,168,83,0)");
        ctx.beginPath(); ctx.arc(rx, ry, 22, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();

        /* Core dot */
        ctx.beginPath(); ctx.arc(rx, ry, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,200,${r.dotO * oa})`; ctx.fill();

        /* Label */
        const fr = r.lon > 30;
        ctx.save();
        ctx.font = "600 8px 'JetBrains Mono','Courier New',monospace";
        ctx.textAlign = fr ? "right" : "left";
        const lx = rx + (fr ? -14 : 14);
        const ly = ry - 10;
        const tw = ctx.measureText(r.label).width;
        ctx.fillStyle = `rgba(6,5,4,${r.dotO * 0.65 * oa})`;
        ctx.fillRect(fr ? lx - tw - 3 : lx - 3, ly - 9, tw + 6, 12);
        ctx.fillStyle = `rgba(210,185,110,${r.dotO * 0.85 * oa})`;
        ctx.fillText(r.label, lx, ly);
        ctx.restore();

        /* ✓ checkmark */
        if (r.checkO > 0.005) {
          ctx.save();
          ctx.font = "700 10px monospace";
          ctx.textAlign = fr ? "right" : "left";
          ctx.fillStyle = `rgba(16,185,129,${r.checkO * oa})`;
          ctx.fillText("\u2713", rx + (fr ? -14 : 14), ry + 14);
          ctx.restore();
        }

        /* Signal trail */
        if (r.sigO > 0.005 && r.sigP > 0) {
          const t0   = Math.max(0, r.sigP - 0.13);
          const curX = rx + (cx - rx) * r.sigP;
          const curY = ry + (hY - ry) * r.sigP;
          const tailX = rx + (cx - rx) * t0;
          const tailY = ry + (hY - ry) * t0;
          const lg = ctx.createLinearGradient(tailX, tailY, curX, curY);
          lg.addColorStop(0, "rgba(201,168,83,0)");
          lg.addColorStop(1, `rgba(255,220,80,${r.sigO * 0.65 * oa})`);
          ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(curX, curY);
          ctx.strokeStyle = lg; ctx.lineWidth = 1.0; ctx.stroke();
          /* tip glow */
          const tg = ctx.createRadialGradient(curX, curY, 0, curX, curY, 9);
          tg.addColorStop(0, `rgba(255,248,160,${r.sigO * 0.90 * oa})`);
          tg.addColorStop(1, "rgba(255,210,60,0)");
          ctx.beginPath(); ctx.arc(curX, curY, 9, 0, Math.PI * 2);
          ctx.fillStyle = tg; ctx.fill();
        }
      });

      /* ── Header ──────────────────────────────────────────────────────── */
      if (G.titleO > 0.005) {
        const to = G.titleO * oa;
        ctx.save();
        ctx.font = "600 10px 'JetBrains Mono','Courier New',monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(6,5,4,${to * 0.7})`;
        ctx.fillRect(cx - 190, H * 0.015, 380, 20);
        ctx.fillStyle = `rgba(201,168,83,${to * 0.80})`;
        ctx.fillText("GLOBAL INTELLIGENCE NETWORK", cx, H * 0.031);
        ctx.restore();
      }

      /* ── Horizon line ────────────────────────────────────────────────── */
      if (G.horizO > 0.005 && G.horizW > 0) {
        const hw = W * 0.5 * G.horizW;
        const ho = G.horizO * oa;
        const og = ctx.createLinearGradient(cx - hw, hY, cx + hw, hY);
        og.addColorStop(0,    "rgba(201,168,83,0)");
        og.addColorStop(0.15, `rgba(201,168,83,${0.18 * ho})`);
        og.addColorStop(0.50, `rgba(228,188,68,${0.36 * ho})`);
        og.addColorStop(0.85, `rgba(201,168,83,${0.18 * ho})`);
        og.addColorStop(1,    "rgba(201,168,83,0)");
        ctx.fillStyle = og; ctx.fillRect(cx - hw, hY - 8, hw * 2, 16);

        const cg = ctx.createLinearGradient(cx - hw, hY, cx + hw, hY);
        cg.addColorStop(0,    "rgba(201,168,83,0)");
        cg.addColorStop(0.10, `rgba(201,168,83,${0.55 * ho})`);
        cg.addColorStop(0.50, `rgba(255,240,110,${ho})`);
        cg.addColorStop(0.90, `rgba(201,168,83,${0.55 * ho})`);
        cg.addColorStop(1,    "rgba(201,168,83,0)");
        ctx.fillStyle = cg; ctx.fillRect(cx - hw, hY - 0.75, hw * 2, 1.5);
      }

      /* ── NETWORK SYNCHRONIZED ────────────────────────────────────────── */
      if (G.syncO > 0.005) {
        const so = G.syncO * oa;
        ctx.save();
        ctx.font = "600 11px 'JetBrains Mono','Courier New',monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(6,5,4,${so * 0.75})`;
        ctx.fillRect(cx - 130, hY - 38, 260, 18);
        ctx.fillStyle = `rgba(16,185,129,${so})`;
        ctx.fillText("NETWORK SYNCHRONIZED", cx, hY - 24);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    /* ── GSAP timeline — ~4.2 s total (tight & cinematic) ───────────────── */
    const tl = gsap.timeline({
      onComplete: () => {
        if (doneRef.current) return;
        doneRef.current = true;
        cancelAnimationFrame(rafRef.current);
        gsap.to(overlay, {
          opacity: 0, duration: 0.4, ease: "power2.in",
          onComplete: () => { overlay.style.display = "none"; },
        });
      },
    });
    tlRef.current = tl;

    /* Map + title fade in */
    tl.to(G, { mapO: 1,   duration: 0.55, ease: "power2.out" }, 0);
    tl.to(G, { titleO: 1, duration: 0.35, ease: "power1.out" }, 0.08);
    /* Scan line sweeps top→bottom */
    tl.to(G, { scanY: 1,  duration: 1.85, ease: "none"       }, 0.12);

    /* Nodes appear one by one */
    R.forEach((r, i) => {
      const t0 = ACT_T[i];
      tl.to(r, { dotO: 1,  duration: 0.28, ease: "power1.out"      }, t0);
      tl.to(r, { pulseO: 1, pulseR: 0, duration: 0.06              }, t0 + 0.03);
      tl.to(r, { pulseO: 0, pulseR: 1, duration: 0.50, ease: "power1.out" }, t0 + 0.07);
      tl.to(r, { checkO: 1, duration: 0.20, ease: "power1.out"     }, t0 + 0.30);
    });

    /* Signal trails from each node to the horizon convergence point */
    R.forEach((r, i) => {
      const t0 = 1.08 + i * 0.075;
      tl.to(r, { sigO: 1, duration: 0.14 },                    t0);
      tl.to(r, { sigP: 1, duration: 0.85, ease: "power2.in" }, t0 + 0.06);
      tl.to(r, { sigO: 0, duration: 0.22, ease: "power1.in" }, t0 + 0.72);
    });

    /* Horizon forms */
    tl.to(G, { horizO: 1, duration: 0.28, ease: "power2.out" }, 2.30);
    tl.to(G, { horizW: 1, duration: 0.55, ease: "power2.out" }, 2.32);
    tl.to(G, { syncO:  1, duration: 0.25, ease: "power1.out" }, 2.60);

    /* Hold for a beat then fade out */
    tl.to(G, { titleO: 0, syncO: 0, mapO: 0, duration: 0.30, ease: "power1.in" }, 3.55);
    tl.to(G, { overlayO: 0, duration: 0.35, ease: "power2.in" }, 3.60);
    tl.to({},  { duration: 0.05 }, 4.00); // ← onComplete fires here

    /* Show skip button after 1.2 s */
    const skipTimer = setTimeout(() => {
      if (!doneRef.current) skipBtn.style.opacity = "1";
    }, 1200);

    return () => {
      tl.kill();
      cancelAnimationFrame(rafRef.current);
      clearTimeout(skipTimer);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      onClick={() => skipRef.current()}
      style={{ position: "fixed", inset: 0, zIndex: 201, pointerEvents: "auto", cursor: "default" }}
      role="presentation"
    >
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />

      {/* Skip button */}
      <button
        ref={skipBtnRef}
        onClick={e => { e.stopPropagation(); skipRef.current(); }}
        aria-label="Skip intro"
        style={{
          position: "absolute", bottom: "28px", right: "28px",
          display: "flex", alignItems: "center", gap: "7px",
          padding: "7px 16px 7px 14px",
          background: "rgba(255,255,255,0.055)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "28px",
          color: "rgba(255,255,255,0.45)",
          fontSize: "11px", letterSpacing: "0.10em",
          fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500,
          cursor: "pointer", opacity: 0,
          transition: "opacity 0.55s ease, background 0.22s ease, color 0.22s ease",
          backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
          userSelect: "none",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background  = "rgba(255,255,255,0.10)";
          e.currentTarget.style.color       = "rgba(255,255,255,0.75)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.20)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = "rgba(255,255,255,0.055)";
          e.currentTarget.style.color       = "rgba(255,255,255,0.45)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
        }}
      >
        <span style={{ textTransform: "uppercase", letterSpacing: "0.12em" }}>Skip</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ animation: "skipChevron 1.4s ease-in-out infinite" }}
          aria-hidden="true">
          <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <style>{`
        @keyframes skipChevron {
          0%,100% { transform: translateX(0);   opacity: 0.6; }
          50%      { transform: translateX(3px); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
