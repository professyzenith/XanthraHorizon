"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";

/* ─── EQUIRECTANGULAR PROJECTION ────────────────────────────────────────────
   Map region: X ∈ [3%, 97%]   Y ∈ [4%, 60%]
   Latitude clamped: [-58, 83]  — all continents without polar waste
   ─────────────────────────────────────────────────────────────────────────── */
const LON_MIN = -180, LON_MAX = 180;
const LAT_MAX = 83,   LAT_MIN = -58;
const MX0 = 0.03, MX1 = 0.97;
const MY0 = 0.04, MY1 = 0.60;

function plx(lon: number, W: number): number {
  return (MX0 + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (MX1 - MX0)) * W;
}
function ply(lat: number, H: number): number {
  const c = Math.max(LAT_MIN, Math.min(LAT_MAX, lat));
  return (MY0 + ((LAT_MAX - c) / (LAT_MAX - LAT_MIN)) * (MY1 - MY0)) * H;
}
function qBez(a: number, b: number, c: number, t: number): number {
  const m = 1 - t;
  return m * m * a + 2 * m * t * b + t * t * c;
}
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/* ─── TOPOJSON DECODER ──────────────────────────────────────────────────────
   Handles world-atlas@2  land-110m.json  format.
   ─────────────────────────────────────────────────────────────────────────── */
type Coord2 = [number, number];
type Ring2  = Coord2[];
type Poly2  = Ring2[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeTopo(topo: any): Poly2[] {
  const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;
  const arcs: Ring2[] = (topo.arcs as Coord2[][]).map((raw: Coord2[]) => {
    let qx = 0, qy = 0;
    return raw.map(([dqx, dqy]) => {
      qx += dqx; qy += dqy;
      return [qx * sx + tx, qy * sy + ty] as Coord2;
    });
  });
  const resolve   = (i: number): Ring2 => i >= 0 ? arcs[i] : [...arcs[~i]].reverse();
  const ringCoords = (r: number[]): Ring2 => r.flatMap(resolve);
  const polys: Poly2[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function addGeom(g: any) {
    if      (g.type === "Polygon")
      polys.push((g.arcs as number[][]).map(ringCoords));
    else if (g.type === "MultiPolygon")
      (g.arcs as number[][][]).forEach((p: number[][]) => polys.push(p.map(ringCoords)));
    else if (g.type === "GeometryCollection")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      g.geometries.forEach((c: any) => addGeom(c));
  }
  const obj = topo.objects.land ?? Object.values(topo.objects)[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (obj.type === "GeometryCollection") obj.geometries.forEach((g: any) => addGeom(g));
  else addGeom(obj);
  return polys;
}

/* ─── INTELLIGENCE HUBS ─────────────────────────────────────────────────────
   Six curated cities.  Maximum restraint.  Each one globally indispensable.
   ─────────────────────────────────────────────────────────────────────────── */
const CITIES = [
  { lon:   -0.1, lat:  51.5, w: 1.00 },  // London        — Western anchor
  { lon: -122.4, lat:  37.8, w: 0.95 },  // San Francisco — Pacific gateway
  { lon:   55.3, lat:  25.2, w: 0.80 },  // Dubai         — Silk Road node
  { lon:  103.8, lat:   1.4, w: 0.92 },  // Singapore     — Eastern hub
  { lon:   72.9, lat:  19.1, w: 0.75 },  // Mumbai        — South Asian relay
  { lon:  151.2, lat: -33.9, w: 0.68 },  // Sydney        — Southern terminus
] as const;

/* ─── INTELLIGENCE ROUTES ───────────────────────────────────────────────────
   Five arcs.  Every connection has meaning.
   Variable travel speed makes each route feel distinct.
   ─────────────────────────────────────────────────────────────────────────── */
const EDGES: [number, number][] = [
  [0, 1],   // London ↔ San Francisco   trans-Atlantic backbone
  [0, 2],   // London ↔ Dubai           Silk Road of data
  [2, 3],   // Dubai  ↔ Singapore       Orient Express
  [3, 5],   // Singapore ↔ Sydney       Southern Pacific relay
  [1, 3],   // San Francisco ↔ Singapore  great Pacific arc
];
// Relative packet speeds — trans-Pacific is slower, regional arcs faster
const EDGE_SPDS = [1.00, 1.20, 0.95, 1.10, 0.72];

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */
export default function GlobalSyncPrelude() {
  const overlayRef  = useRef<HTMLDivElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const skipBtnRef  = useRef<HTMLButtonElement>(null);
  // Lifted to component level so handleSkip can access them
  const tlRef       = useRef<gsap.core.Timeline | null>(null);
  const rafIdRef    = useRef<number>(0);
  const skippedRef  = useRef(false);

  /* ── Skip handler — click anywhere or press the skip button ───────────
     Kills the GSAP timeline and fades the overlay out quickly.
     Idempotent: second call is a no-op.
     ─────────────────────────────────────────────────────────────────── */
  const handleSkip = useCallback(() => {
    if (skippedRef.current) return;
    skippedRef.current = true;

    tlRef.current?.kill();
    cancelAnimationFrame(rafIdRef.current);

    const overlay = overlayRef.current;
    if (!overlay) return;

    gsap.to(overlay, {
      opacity: 0,
      duration: 0.38,
      ease: "power2.in",
      onComplete: () => {
        overlay.style.display = "none";
      },
    });
  }, []);

  useEffect(() => {
    // Respect user's motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (overlayRef.current) overlayRef.current.style.display = "none";
      return;
    }

    const overlay = overlayRef.current!;
    const cv      = canvasRef.current!;
    const ctx     = cv.getContext("2d")!;
    const dpr     = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const W = window.innerWidth, H = window.innerHeight;
      cv.width  = W * dpr;   cv.style.width  = W + "px";
      cv.height = H * dpr;   cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    /* ══════════════════════════════════════════════════════════════════════
       ANIMATION STATE
       All values are plain-object properties driven by GSAP.
       No React state — no re-renders.
       ══════════════════════════════════════════════════════════════════════ */
    const G = {
      mapO:      0,      // earth opacity (fades in)
      atmO:      0,      // atmospheric glow opacity
      cameraZ:   1.07,   // camera zoom — slow satellite pull-back → 1.00
      parallaxX: -7,     // subtle horizontal drift → 0
      dissolveP: 0,      // particle dissolution progress 0→1
      pulseR:    0,      // global synchronized pulse radius
      pulseO:    0,      // global pulse opacity
      heroO:     0,      // hero moment global illumination surge
      horizO:    0,      // horizon line opacity
      horizW:    0,      // horizon line width fraction
      overlayO:  1,      // master overlay (fades to 0 at handoff)
    };

    // Per-node — cs.o can exceed 1.0 briefly (elastic overshoot = flash bloom)
    const CS = CITIES.map(c => ({
      o:      0,   // activation value  (elastic: 0 → 1.25 → 1.00)
      pulseR: 0,   // pulse ring radius
      pulseO: 0,   // pulse ring opacity
      w:      c.w, // weight
    }));

    // Per-edge
    const EC = EDGES.map(() => ({
      progress: 0,   // 0→1  light packet position
      alpha:    0,   // ambient path opacity
    }));

    /* ══════════════════════════════════════════════════════════════════════
       PARTICLE SYSTEM  — "dust becoming light"
       Sampled from polygon outer rings.  Fewer, more intentional.
       ══════════════════════════════════════════════════════════════════════ */
    type Particle = {
      sx: number; sy: number;   // raw screen coords (before camera zoom)
      tx: number; ty: number;   // target at horizon
      a:  number;               // alpha (skewed dim)
      r:  number;               // size
      d:  number;               // personal delay  0–0.40
      cv: number;               // horizontal organic curve offset ±20
    };
    let particles: Particle[] = [];
    let landPolys: Poly2[] = [];
    let dataReady = false;

    function genParticles() {
      const W  = window.innerWidth, H = window.innerHeight;
      const hY = H * 0.67;
      const cx = W * 0.5;
      particles = [];

      landPolys.forEach(poly => {
        const outer = poly[0];
        if (!outer) return;
        for (let i = 0; i < outer.length; i += 5) {
          const [lon, lat] = outer[i];
          const x = plx(lon, W), y = ply(lat, H);
          if (x < MX0 * W - 4 || x > MX1 * W + 4) continue;
          if (y < MY0 * H - 4 || y > MY1 * H + 4) continue;
          particles.push({
            sx: x, sy: y,
            tx: cx + (Math.random() - 0.5) * 44,
            ty: hY + (Math.random() - 0.5) * 4,
            a:  0.12 + Math.pow(Math.random(), 2.8) * 0.88,  // mostly dim
            r:  0.28 + Math.pow(Math.random(), 2.2) * 2.70,  // mostly small
            d:  Math.random() * 0.40,
            cv: (Math.random() - 0.5) * 20,
          });
        }
      });

      // Hard cap: 680 particles — performance first
      if (particles.length > 680) {
        const step = Math.ceil(particles.length / 680);
        particles = particles.filter((_, i) => i % step === 0);
      }
    }

    /* ══════════════════════════════════════════════════════════════════════
       DRAW  — runs every animation frame
       ══════════════════════════════════════════════════════════════════════ */
    function draw(ts: number) {
      const W   = window.innerWidth, H = window.innerHeight;
      const cx  = W * 0.5;
      // Camera center drifts slightly right with parallax
      const mcx = cx + G.parallaxX;
      const mcy = H * (MY0 + MY1) * 0.5;
      const hY  = H * 0.67;          // horizon — exact match with HorizonReveal
      const oa  = G.overlayO;
      const t   = ts / 1000;
      const dis = G.dissolveP;
      const mo  = G.mapO * oa;
      const ma  = Math.max(0, 1 - dis) * mo;  // map alpha: fades as particles dissolve

      /* ── Deep space — almost-black with warmth ────────────────── */
      ctx.clearRect(0, 0, W, H);
      // Not pure black — a breath of deep charcoal with warm hint
      ctx.fillStyle = "rgba(5,5,7," + oa + ")";
      ctx.fillRect(0, 0, W, H);

      if (!dataReady) { rafIdRef.current = requestAnimationFrame(draw); return; }

      // Planetary atmosphere below the map — grounds the composition, fills the void
      if (G.mapO > 0.01) {
        const bG = ctx.createLinearGradient(0, MY1 * H, 0, MY1 * H + H * 0.28);
        bG.addColorStop(0, "rgba(6,8,14," + (G.mapO * 0.62 * oa) + ")");
        bG.addColorStop(1, "rgba(3,4,6,0)");
        ctx.fillStyle = bG;
        ctx.fillRect(0, MY1 * H, W, H * 0.28);
      }

      /* ════════════════════════════════════════════════════════════
         CAMERA TRANSFORM
         Slow satellite pull-back: scale 1.07 → 1.00 over ~7s.
         Everything map-related draws inside this transform.
         Particles + horizon draw OUTSIDE (absolute screen position).
         ════════════════════════════════════════════════════════════ */
      ctx.save();
      ctx.translate(mcx, mcy);
      ctx.scale(G.cameraZ, G.cameraZ);
      ctx.translate(-mcx, -mcy);

      /* ── Deep ocean — radial gradient, alive with depth ──────── */
      if (ma > 0.003) {
        const mapW = (MX1 - MX0) * W;
        const mapH = (MY1 - MY0) * H;

        // Ocean depth — rich layered blue-charcoal; lighter at center (sun reflection),
        // darker toward the limb where the planet curves away
        const og = ctx.createRadialGradient(mcx, mcy, 0, mcx, mcy, mapW * 0.56);
        og.addColorStop(0,    "rgba(10,15,26," + (0.78 * ma) + ")");
        og.addColorStop(0.30, "rgba(6,10,20,"  + (0.92 * ma) + ")");
        og.addColorStop(0.68, "rgba(4,6,12,"   + (0.96 * ma) + ")");
        og.addColorStop(1,    "rgba(3,4,8,"    + (0.26 * ma) + ")");
        ctx.fillStyle = og;
        ctx.fillRect(MX0 * W, MY0 * H, mapW, mapH);

        // Warm sunrise glow reflected on ocean near equator-south
        // // sunrise swell
        const sunReflect = ctx.createLinearGradient(0, mcy + mapH * 0.1, 0, MY1 * H);
        sunReflect.addColorStop(0, "rgba(70,35,8,0)");
        sunReflect.addColorStop(1, "rgba(70,35,8," + (0.055 * ma) + ")");
        ctx.fillStyle = sunReflect;
        ctx.fillRect(MX0 * W, mcy + mapH * 0.1, mapW, mapH * 0.5);
      }

      /* ── Graticule — whisper thin, barely a presence ─────────── */
      if (ma > 0.012) {
        ctx.save();
        ctx.lineWidth = 0.14;
        for (let lon = -150; lon <= 150; lon += 30) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(155,125,65," + (0.007 * ma) + ")";
          ctx.moveTo(plx(lon, W), ply(LAT_MAX, H));
          ctx.lineTo(plx(lon, W), ply(LAT_MIN, H));
          ctx.stroke();
        }
        for (let lat = -45; lat <= 75; lat += 30) {
          const iEq = (lat === 0);
          ctx.beginPath();
          ctx.strokeStyle = "rgba(155,125,65," + ((iEq ? 0.024 : 0.007) * ma) + ")";
          ctx.moveTo(plx(LON_MIN, W), ply(lat, H));
          ctx.lineTo(plx(LON_MAX, W), ply(lat, H));
          ctx.stroke();
        }
        ctx.restore();
      }

      /* ── Land polygons — two-pass rendering for depth + warmth ──
         Pass A: wide coastal glow stroke (amber warmth)
         Pass B: terrain gradient fill + fine golden outline
         Pass C: directional sunrise illumination
         ─────────────────────────────────────────────────────────── */
      if (ma > 0.003) {
        // Terrain fill: warm at south (sunrise), cool at north
        const cg = ctx.createLinearGradient(0, MY0 * H, 0, MY1 * H);
        cg.addColorStop(0,    "rgba(20,14,5,"  + (0.82 * ma) + ")");
        cg.addColorStop(0.38, "rgba(28,18,7,"  + (0.76 * ma) + ")");
        cg.addColorStop(0.72, "rgba(36,24,9,"  + (0.70 * ma) + ")");
        cg.addColorStop(1,    "rgba(44,28,11," + (0.64 * ma) + ")");

        // ── Pass A + B: per-polygon ──────────────────────────────
        landPolys.forEach(poly => {
          const outer = poly[0];
          if (!outer || outer.length < 3) return;
          ctx.beginPath();
          outer.forEach(([lon, lat], i) => {
            const x = plx(lon, W), y = ply(lat, H);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          });
          ctx.closePath();

          // A: coastal warmth — slightly more luminous amber halo
          ctx.strokeStyle = "rgba(175,108,28," + (0.058 * ma) + ")";
          ctx.lineWidth   = 4.6;
          ctx.stroke();

          // B: terrain fill
          ctx.fillStyle = cg;
          ctx.fill();

          // B: fine golden coastline — crisp defining edge
          ctx.strokeStyle = "rgba(192,158,68," + (0.25 * ma) + ")";
          ctx.lineWidth   = 0.54;
          ctx.stroke();
        });

        // ── Pass C: sunrise directional light ───────────────────
        // Warm amber source: rises from bottom-left (South Atlantic)
        // Normal blending at low alpha — physically accurate tint
        const sunGrad = ctx.createRadialGradient(
          W * 0.20, H * 0.88, 0,
          W * 0.20, H * 0.88, W * 0.62
        );
        sunGrad.addColorStop(0,   "rgba(155,88,22," + (0.14 * ma) + ")");
        sunGrad.addColorStop(0.38,"rgba(120,68,15," + (0.07 * ma) + ")");
        sunGrad.addColorStop(1,   "rgba(80,45,8,0)");
        ctx.fillStyle = sunGrad;
        ctx.fillRect(MX0 * W, MY0 * H, (MX1 - MX0) * W, (MY1 - MY0) * H);

        // ── Pass D: spherical limb darkening ────────────────────
        // The single biggest visual change: globe edges curve away from the viewer.
        // A radial vignette on the map makes the centre appear illuminated and
        // the edges recede — transforming a flat SVG into a real planet.
        const limbR = (MX1 - MX0) * W * 0.50;
        const limbG = ctx.createRadialGradient(cx, mcy, limbR * 0.44, cx, mcy, limbR * 0.94);
        limbG.addColorStop(0,    "rgba(0,0,0,0)");
        limbG.addColorStop(0.58, "rgba(0,0,0,0)");
        limbG.addColorStop(1,    "rgba(0,0,0," + (0.55 * ma) + ")");
        ctx.fillStyle = limbG;
        ctx.fillRect(MX0 * W - 2, MY0 * H - 2, (MX1 - MX0) * W + 4, (MY1 - MY0) * H + 4);
      }

      /* ── Atmospheric scattering — Fresnel planetary edge ─────────
         Simulate the blue atmospheric limb of a real planet.
         Elliptical to match the map aspect ratio.
         ─────────────────────────────────────────────────────────── */
      if (G.atmO > 0.01) {
        const ao    = G.atmO * oa;
        const mapW  = (MX1 - MX0) * W;
        const mapH  = (MY1 - MY0) * H;
        const atmR  = mapW * 0.52;

        ctx.save();
        ctx.translate(cx, mcy);
        ctx.scale(1.0, mapH / mapW * 0.88);
        const fGrad = ctx.createRadialGradient(0, 0, atmR * 0.78, 0, 0, atmR);
        fGrad.addColorStop(0,    "rgba(0,0,0,0)");
        fGrad.addColorStop(0.72, "rgba(38,72,155," + (0.034 * ao) + ")");
        fGrad.addColorStop(0.88, "rgba(48,88,175," + (0.060 * ao) + ")");
        fGrad.addColorStop(1,    "rgba(55,100,190,0)");
        ctx.beginPath(); ctx.arc(0, 0, atmR, 0, Math.PI * 2);
        ctx.fillStyle = fGrad; ctx.fill();
        ctx.restore();

        // Volumetric back-scatter from above — very subtle
        // // sunrise swell
        const volGrad = ctx.createRadialGradient(cx, MY0 * H - 5, 0, cx, MY0 * H - 5, W * 0.46);
        volGrad.addColorStop(0,   "rgba(255,252,215," + (0.015 * ao * G.mapO) + ")");
        volGrad.addColorStop(0.5, "rgba(235,208,158," + (0.008 * ao * G.mapO) + ")");
        volGrad.addColorStop(1,   "rgba(200,175,110,0)");
        ctx.fillStyle = volGrad;
        ctx.fillRect(MX0 * W, MY0 * H, (MX1-MX0)*W, (MY1-MY0)*H);

        // Edge vignette — deep space darkens at screen margins
        const vigL = ctx.createLinearGradient(MX0*W, 0, (MX0+0.055)*W, 0);
        vigL.addColorStop(0, "rgba(3,4,6," + (0.38 * ao) + ")");
        vigL.addColorStop(1, "rgba(3,4,6,0)");
        ctx.fillStyle = vigL;
        ctx.fillRect(0, MY0*H, (MX0+0.055)*W, (MY1-MY0)*H);

        const vigR = ctx.createLinearGradient((MX1-0.055)*W, 0, MX1*W, 0);
        vigR.addColorStop(0, "rgba(3,4,6,0)");
        vigR.addColorStop(1, "rgba(3,4,6," + (0.38 * ao) + ")");
        ctx.fillStyle = vigR;
        ctx.fillRect((MX1-0.055)*W, MY0*H, 0.055*W, (MY1-MY0)*H);
      }

      /* ── Intelligence routes — premium bezier light flows ────────
         Each route:
         1. Ambient path: faint, established after packet arrives
         2. Traveling packet: gradient trail  amber → teal
         3. Packet head: 3-layer bloom sphere
         Variable arc height, variable thickness, variable speed.
         ─────────────────────────────────────────────────────────── */
      EDGES.forEach(([ai, bi], ei) => {
        const ec = EC[ei];
        if (ec.alpha < 0.005 && ec.progress <= 0) return;

        const ax = plx(CITIES[ai].lon, W), ay = ply(CITIES[ai].lat, H);
        const bx = plx(CITIES[bi].lon, W), by = ply(CITIES[bi].lat, H);
        const dist = Math.hypot(bx - ax, by - ay);
        // Longer routes arc higher — trans-Pacific soars
        const lift = 0.20 + (dist / W) * 0.24;
        const mcx2 = (ax + bx) * 0.5;
        const mcy2 = (ay + by) * 0.5 - dist * lift;

        // Ambient established path
        if (ec.alpha > 0.005) {
          const steps = 22;
          ctx.beginPath();
          for (let s = 0; s <= steps; s++) {
            const bt = s / steps;
            s === 0
              ? ctx.moveTo(qBez(ax, mcx2, bx, bt), qBez(ay, mcy2, by, bt))
              : ctx.lineTo(qBez(ax, mcx2, bx, bt), qBez(ay, mcy2, by, bt));
          }
          // Variable thickness: heavier routes look more substantial
          ctx.strokeStyle = "rgba(190,150,62," + (ec.alpha * 0.13 * oa) + ")";
          ctx.lineWidth   = 0.32 + EDGE_SPDS[ei] * 0.20;
          ctx.stroke();
        }

        // Traveling packet
        if (ec.progress > 0 && ec.progress < 1.02) {
          const pH = Math.min(ec.progress, 1.0);
          const pT = Math.max(0, pH - 0.16);

          const tailX = qBez(ax, mcx2, bx, pT), tailY = qBez(ay, mcy2, by, pT);
          const headX = qBez(ax, mcx2, bx, pH), headY = qBez(ay, mcy2, by, pH);

          // Gradient trail: amber at tail → teal at head
          const steps = 20;
          ctx.beginPath();
          for (let s = 0; s <= steps; s++) {
            const bt = pT + (pH - pT) * s / steps;
            s === 0
              ? ctx.moveTo(qBez(ax, mcx2, bx, bt), qBez(ay, mcy2, by, bt))
              : ctx.lineTo(qBez(ax, mcx2, bx, bt), qBez(ay, mcy2, by, bt));
          }
          const lg = ctx.createLinearGradient(tailX, tailY, headX, headY);
          lg.addColorStop(0,    "rgba(195,122,40,0)");
          lg.addColorStop(0.28, "rgba(208,148,48,"  + (0.20 * oa) + ")");
          lg.addColorStop(0.70, "rgba(55,188,168,"  + (0.28 * oa) + ")");
          lg.addColorStop(1,    "rgba(38,205,182,"  + (0.36 * oa) + ")");
          ctx.strokeStyle = lg;
          ctx.lineWidth   = 0.72;
          ctx.stroke();

          // Inner luminous core — bright photon-dense centre of the fiber
          // Makes the connection feel like real information flow, not a drawn line
          const coreT  = Math.max(pT, pH - 0.09);
          const coreTX = qBez(ax, mcx2, bx, coreT), coreTY = qBez(ay, mcy2, by, coreT);
          ctx.beginPath();
          for (let s = 0; s <= 6; s++) {
            const bt = coreT + (pH - coreT) * s / 6;
            s === 0
              ? ctx.moveTo(qBez(ax, mcx2, bx, bt), qBez(ay, mcy2, by, bt))
              : ctx.lineTo(qBez(ax, mcx2, bx, bt), qBez(ay, mcy2, by, bt));
          }
          const ci = ctx.createLinearGradient(coreTX, coreTY, headX, headY);
          ci.addColorStop(0, "rgba(80,220,200,0)");
          ci.addColorStop(1, "rgba(195,255,248," + (0.46 * oa) + ")");
          ctx.strokeStyle = ci;
          ctx.lineWidth   = 0.20;
          ctx.stroke();

          // Packet head — 3-layer bloom
          if (pH < 1.0) {
            // Layer 3: wide diffuse bloom — slightly softer, more photographic
            const hg3 = ctx.createRadialGradient(headX, headY, 0, headX, headY, 13);
            hg3.addColorStop(0, "rgba(80,210,190," + (0.14 * oa) + ")");
            hg3.addColorStop(1, "rgba(38,205,182,0)");
            ctx.beginPath(); ctx.arc(headX, headY, 13, 0, Math.PI * 2);
            ctx.fillStyle = hg3; ctx.fill();
            // Layer 2: mid bloom
            const hg2 = ctx.createRadialGradient(headX, headY, 0, headX, headY, 5.5);
            hg2.addColorStop(0, "rgba(160,242,232," + (0.55 * oa) + ")");
            hg2.addColorStop(1, "rgba(55,210,190,0)");
            ctx.beginPath(); ctx.arc(headX, headY, 5.5, 0, Math.PI * 2);
            ctx.fillStyle = hg2; ctx.fill();
            // Core — near-white, maximum local luminance
            ctx.beginPath(); ctx.arc(headX, headY, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(230,255,252," + (0.88 * oa) + ")"; ctx.fill();
            // Pinpoint — pure light at the very centre
            ctx.beginPath(); ctx.arc(headX, headY, 0.85, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255," + oa + ")"; ctx.fill();
          }
        }
      });

      /* ── Global synchronized pulse — the hero moment ────────────
         One powerful golden ring expands across the entire Earth.
         Screen blending = additive glow without blowout.
         // synchronization pulse
         ─────────────────────────────────────────────────────────── */
      if (G.pulseO > 0.005) {
        const pR = G.pulseR * W * 0.62;
        ctx.save();
        ctx.globalCompositeOperation = "screen";

        // Diffuse outer ring
        const pg1 = ctx.createRadialGradient(cx, mcy, pR * 0.58, cx, mcy, pR);
        pg1.addColorStop(0,    "rgba(255,192,68,0)");
        pg1.addColorStop(0.48, "rgba(255,172,48," + (G.pulseO * 0.08) + ")");
        pg1.addColorStop(0.84, "rgba(240,152,35," + (G.pulseO * 0.05) + ")");
        pg1.addColorStop(1,    "rgba(220,132,25,0)");
        ctx.beginPath(); ctx.arc(cx, mcy, pR, 0, Math.PI * 2);
        ctx.fillStyle = pg1; ctx.fill();

        // Crisp leading edge ring
        const pg2 = ctx.createRadialGradient(cx, mcy, pR * 0.90, cx, mcy, pR * 1.06);
        pg2.addColorStop(0,   "rgba(255,212,88,0)");
        pg2.addColorStop(0.5, "rgba(255,198,72," + (G.pulseO * 0.12) + ")");
        pg2.addColorStop(1,   "rgba(255,182,55,0)");
        ctx.beginPath(); ctx.arc(cx, mcy, pR * 1.06, 0, Math.PI * 2);
        ctx.fillStyle = pg2; ctx.fill();

        ctx.restore();
      }

      /* ── Hero moment global illumination surge ───────────────────
         At synchronization peak: the whole Earth briefly brightens.
         ─────────────────────────────────────────────────────────── */
      if (G.heroO > 0.005) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const hg = ctx.createRadialGradient(cx, mcy, 0, cx, mcy, W * 0.48);
        hg.addColorStop(0,   "rgba(255,222,120," + (G.heroO * 0.07) + ")");
        hg.addColorStop(0.5, "rgba(210,168,78,"  + (G.heroO * 0.03) + ")");
        hg.addColorStop(1,   "rgba(165,125,48,0)");
        ctx.fillStyle = hg;
        ctx.fillRect(MX0*W, MY0*H, (MX1-MX0)*W, (MY1-MY0)*H);
        ctx.restore();
      }

      /* ── City nodes — multi-layer bloom, organic micro-animation ──
         cs.o can overshoot 1.0 on activation (elastic ease).
         The overshoot drives a temporary bloom expansion — natural.
         Each city breathes at its own frequency.
         No two nodes feel the same.
         ─────────────────────────────────────────────────────────── */
      const nBase = Math.max(0, 1 - dis * 1.35) * oa;
      CITIES.forEach((city, i) => {
        const cs    = CS[i];
        const oVis  = clamp(cs.o, 0, 1);   // clamped for opacity calcs
        const oFull = cs.o;                 // allows > 1 for overshoot bloom
        const no    = oVis * nBase;
        if (no < 0.005) return;

        const x = plx(city.lon, W), y = ply(city.lat, H);
        const w = cs.w;

        // Each city's breathing is uniquely phased
        const breathA = 0.58 + 0.42 * Math.sin(t * 1.18 + i * 1.12);
        const breathB = 0.68 + 0.32 * Math.cos(t * 0.78 + i * 0.82);

        // Extra bloom during hero moment + overshoot
        const extra = G.heroO * 0.45 + Math.max(0, oFull - 1.0) * 0.60;

        // Layer 3 — large ambient halo, breathing
        const r3  = (28 + extra * 10) * w;
        const rg3 = ctx.createRadialGradient(x, y, 0, x, y, r3);
        rg3.addColorStop(0, "rgba(255,198,55," + (no * (0.055 + extra * 0.04) * breathA) + ")");
        rg3.addColorStop(1, "rgba(255,175,38,0)");
        ctx.beginPath(); ctx.arc(x, y, r3, 0, Math.PI * 2);
        ctx.fillStyle = rg3; ctx.fill();

        // Layer 2 — medium glow, slower breathe
        const r2  = (15 + extra * 5) * w;
        const rg2 = ctx.createRadialGradient(x, y, 0, x, y, r2);
        rg2.addColorStop(0, "rgba(255,215,65," + (no * (0.18 + extra * 0.08) * breathB) + ")");
        rg2.addColorStop(1, "rgba(255,192,50,0)");
        ctx.beginPath(); ctx.arc(x, y, r2, 0, Math.PI * 2);
        ctx.fillStyle = rg2; ctx.fill();

        // Layer 1 — tight core halo, slightly larger when overshooting
        const r1  = (6.5 + Math.max(0, oFull - 0.9) * 4.0) * w;
        const rg1 = ctx.createRadialGradient(x, y, 0, x, y, r1);
        rg1.addColorStop(0, "rgba(255,252,218," + (no * (0.52 + extra * 0.20)) + ")");
        rg1.addColorStop(1, "rgba(255,230,80,0)");
        ctx.beginPath(); ctx.arc(x, y, r1, 0, Math.PI * 2);
        ctx.fillStyle = rg1; ctx.fill();

        // Core dot — warm ivory point
        ctx.beginPath(); ctx.arc(x, y, 1.75, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,254,240," + no + ")"; ctx.fill();

        // Hairline ring — barely a whisper
        ctx.beginPath(); ctx.arc(x, y, 3.9 * w, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(192,155,62," + (no * 0.26) + ")";
        ctx.lineWidth   = 0.42; ctx.stroke();

        // Activation / hero pulse ring
        if (cs.pulseO > 0.005) {
          const pr = cs.pulseR * 32 * w + 6;
          ctx.beginPath(); ctx.arc(x, y, pr, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(192,155,52," + (cs.pulseO * 0.26 * oa) + ")";
          ctx.lineWidth   = 0.60; ctx.stroke();
          // Trailing secondary ring (appears at pulseR > 0.28)
          if (cs.pulseR > 0.28) {
            const pr2 = (cs.pulseR - 0.25) * 32 * w + 6;
            ctx.beginPath(); ctx.arc(x, y, pr2, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(192,138,42," + (cs.pulseO * 0.12 * oa) + ")";
            ctx.lineWidth   = 0.95; ctx.stroke();
          }
        }
      });

      /* ════════════════════════════════════════════════════════════
         END CAMERA TRANSFORM
         Everything below is in absolute screen space.
         ════════════════════════════════════════════════════════════ */
      ctx.restore();

      /* ── Particle dissolution — "continents become light" ────────
         Particles are sampled from polygon edges.
         Each one peel off, arcs organically, streams to the horizon.
         The horizon literally forms from their arrival.
         No visible cut between Prelude and HorizonReveal.
         // particle convergence
         ─────────────────────────────────────────────────────────── */
      if (dis > 0.005 && particles.length > 0) {
        // Camera zoom correction for particle start positions
        const zCX = cx;
        const zCY = H * (MY0 + MY1) * 0.5;

        particles.forEach(p => {
          // Personal staggered launch
          const delayed = Math.max(0, dis - p.d * 0.40);
          const adjP    = clamp(delayed / Math.max(0.001, 1 - p.d * 0.40), 0, 1);
          const eased   = Math.pow(adjP, 1.58);  // slightly smoother acceleration

          // Apply current camera zoom to source position
          // so particles peel off the visually-scaled continent surface
          const vSX = zCX + (p.sx - zCX) * G.cameraZ;
          const vSY = zCY + (p.sy - zCY) * G.cameraZ;

          // Physical lift: particles briefly rise before being drawn to the horizon.
          // Mimics embers peeling off burning terrain before falling as light.
          const liftY = -10 * Math.sin(adjP * Math.PI * 0.70) * (1 - eased * 0.55);

          // Organic lateral arc + vertical lift
          const px = vSX + (p.tx - vSX) * eased + p.cv * Math.sin(adjP * Math.PI);
          const py = vSY + (p.ty - vSY) * eased + liftY;

          // Fade: present during journey, fully absorbed at horizon
          const fade = p.a * oa * Math.max(0, 1 - adjP * 1.20);
          if (fade < 0.005) return;
          const r = p.r * (1 + adjP * 0.42);

          // Colour: warm amber → luminous ivory as each particle becomes light.
          // The horizon they converge toward is formed from their own luminance.
          const blend = adjP * adjP;
          const pR = Math.round(202 + (248 - 202) * blend);
          const pG = Math.round(155 + (230 - 155) * blend);
          const pB = Math.round(52  + (180 - 52)  * blend);

          ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${pR},${pG},${pB},${fade})`;
          ctx.fill();
        });
      }

      /* ── Horizon — assembles from converging particles ───────────
         Exact position: H * 0.67 — matches HorizonReveal frame 0.
         Particles become this line.  The seam is invisible.
         // horizon formation
         ─────────────────────────────────────────────────────────── */
      if (G.horizO > 0.005 && G.horizW > 0) {
        const hw = W * 0.5 * G.horizW;
        const ho = G.horizO * oa;

        // Diffuse glow band — warmth at the edge of light
        const dg = ctx.createLinearGradient(cx - hw, hY, cx + hw, hY);
        dg.addColorStop(0,    "rgba(192,160,68,0)");
        dg.addColorStop(0.09, "rgba(192,160,68," + (0.14 * ho) + ")");
        dg.addColorStop(0.50, "rgba(222,182,62,"  + (0.30 * ho) + ")");
        dg.addColorStop(0.91, "rgba(192,160,68," + (0.14 * ho) + ")");
        dg.addColorStop(1,    "rgba(192,160,68,0)");
        ctx.fillStyle = dg;
        ctx.fillRect(cx - hw, hY - 15, hw * 2, 30);

        // Crisp luminous core — 1.5px
        const cg = ctx.createLinearGradient(cx - hw, hY, cx + hw, hY);
        cg.addColorStop(0,    "rgba(192,160,68,0)");
        cg.addColorStop(0.06, "rgba(192,160,68," + (0.52 * ho) + ")");
        cg.addColorStop(0.50, "rgba(250,235,105," + ho + ")");
        cg.addColorStop(0.94, "rgba(192,160,68," + (0.52 * ho) + ")");
        cg.addColorStop(1,    "rgba(192,160,68,0)");
        ctx.fillStyle = cg;
        ctx.fillRect(cx - hw, hY - 0.75, hw * 2, 1.50);
      }

      rafIdRef.current = requestAnimationFrame(draw);
    }

    /* Start immediately — black canvas while data loads */
    rafIdRef.current = requestAnimationFrame(draw);

    /* Show skip button after 1.6 s — enough for the earth to materialise */
    const skipShowTimer = window.setTimeout(() => {
      if (skipBtnRef.current && !skippedRef.current) {
        skipBtnRef.current.style.opacity = "1";
      }
    }, 1600);

    /* ── Data load → decode → begin timeline ───────────────────── */
    fetch("/world-110m.json")
      .then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((topo: any) => {
        landPolys = decodeTopo(topo);
        dataReady = true;
        genParticles();
        beginTimeline();
      })
      .catch(() => {
        // Graceful: run animation without map geometry
        dataReady = true;
        beginTimeline();
      });

    /* ════════════════════════════════════════════════════════════════════════
       GSAP TIMELINE — 7.5 s cinematic sequence

       EMOTIONAL JOURNEY:
         0.0–1.5s  Curiosity   — Earth emerges from void
         1.5–4.4s  Scale       — Network comes alive, city by city
         4.4–5.5s  Awe         — Synchronized pulse + 500ms hold
         5.5–7.5s  Calm        — Dissolution → inevitable handoff

       SOUND DESIGN HOOKS (for future audio implementation):
         // sunrise swell          → t = 0.85
         // node activation        → t = 1.20, 1.82, 2.42, 2.98, 3.38, 3.72
         // synchronization pulse  → t = 4.48
         // hero hold              → t = 4.68  (500ms of stillness)
         // particle convergence   → t = 5.55
         // horizon formation      → t = 6.62
       ════════════════════════════════════════════════════════════════════════ */
    function beginTimeline() {
      const tl = gsap.timeline({
        onComplete: () => {
          cancelAnimationFrame(rafIdRef.current);
          window.removeEventListener("resize", resize);
          overlay.style.display = "none";
        },
      });
      tlRef.current = tl;

      /* ── Phase 1: Earth materializes from void ─────────────────────
         Slow, dignified emergence.  The user's eye adjusts.
         Camera begins its silent pull-back throughout.
         ─────────────────────────────────────────────────────────────── */
      // // sunrise swell
      tl.to(G, { mapO: 1,  duration: 1.12, ease: "power2.out"  }, 0.85);
      tl.to(G, { atmO: 1,  duration: 1.50, ease: "power1.out"  }, 1.00);
      // Camera zoom-out: the entire duration — barely perceptible
      tl.to(G, { cameraZ:   1.00, duration: 7.40, ease: "power1.inOut" }, 0.0);
      tl.to(G, { parallaxX: 0,    duration: 7.40, ease: "power1.inOut" }, 0.0);

      /* ── Phase 2: Sequential node activations ──────────────────────
         Elastic ease = natural micro-physics:
           anticipation (slight pause) → overshoot → settle
         Deliberately long gaps between each node.
         Silence is part of the composition.
         ─────────────────────────────────────────────────────────────── */
      // Longer breathing pauses — each city gets a moment of its own
      const nodeTimes = [1.20, 1.94, 2.62, 3.24, 3.68, 4.08];
      CITIES.forEach((_, i) => {
        const t0 = nodeTimes[i];
        const cs = CS[i];

        // // node activation
        // circ.out: instant sharp bloom (snap), then sine.inOut: organic settle
        tl.to(cs, { o: 1.28, duration: 0.14, ease: "circ.out"   }, t0);
        tl.to(cs, { o: 1.00, duration: 0.54, ease: "sine.inOut" }, t0 + 0.14);

        // Activation pulse ring — expo.out snaps out, then decays naturally
        tl.set(cs,  { pulseR: 0, pulseO: 1.0 }, t0);
        tl.to(cs,   { pulseR: 1, pulseO: 0,  duration: 0.94, ease: "expo.out" }, t0 + 0.04);
      });

      /* ── Intelligence route activation ─────────────────────────────
         Each arc fires after both endpoints are lit.
         Variable speed via EDGE_SPDS.
         Packet leaves a settling ambient path on arrival.
         ─────────────────────────────────────────────────────────────── */
      const arcTimes = [
        2.16,   // London→SF       SF lit at 1.94
        2.80,   // London→Dubai    Dubai lit at 2.62
        3.42,   // Dubai→Singapore Singapore lit at 3.24
        3.86,   // Singapore→Sydney Sydney lit at 3.68
        4.26,   // SF→Singapore    both lit by 4.08
      ];
      EDGES.forEach((_, ei) => {
        const t0  = arcTimes[ei];
        const spd = EDGE_SPDS[ei];
        const dur = 1.32 / spd;  // natural travel time per route weight
        // sine easing throughout — smooth, organic, like real signal propagation
        tl.to(EC[ei], { alpha: 0.28, duration: 0.56, ease: "sine.out"   }, t0);
        tl.to(EC[ei], { progress: 1, duration: dur,  ease: "sine.inOut" }, t0 + 0.08);
        tl.to(EC[ei], { alpha: 0.10, duration: 1.12, ease: "sine.out"   }, t0 + dur);
      });

      /* ── Phase 3: Hero moment — synchronized global pulse ───────────
         ALL nodes pulse as one.
         ONE golden ring expands across the planet.
         No text.  No UI.  Just light.

         // synchronization pulse
         ─────────────────────────────────────────────────────────────── */
      const heroT = 4.76;  // breathing room after last node (4.08) — the stillness before the pulse

      // Global illumination surge — the whole Earth briefly glows
      tl.to(G, { heroO: 0.75, duration: 0.28, ease: "power2.out" }, heroT);
      tl.to(G, { heroO: 0,    duration: 0.85, ease: "power2.in"  }, heroT + 0.38);

      // All nodes flash bright simultaneously — synchronized
      CS.forEach(cs => {
        tl.to(cs, { o: 1.30, duration: 0.14, ease: "power2.out" }, heroT);
        tl.to(cs, { o: 1.00, duration: 0.45, ease: "power2.in"  }, heroT + 0.16);
        tl.set(cs, { pulseR: 0, pulseO: 1.0 }, heroT);
        tl.to(cs,  { pulseR: 1, pulseO: 0,  duration: 0.85, ease: "power1.out" }, heroT + 0.05);
      });

      // Global pulse wave
      tl.to(G, { pulseO: 1,   duration: 0.16, ease: "power3.out" }, heroT);
      tl.to(G, { pulseR: 1.1, duration: 1.55, ease: "power1.out" }, heroT);
      // // hero hold — 500ms of stillness while pulse expands slowly
      tl.to(G, { pulseO: 0,   duration: 0.68, ease: "power2.in"  }, heroT + 0.82);

      /* ── Phase 4: Dissolution — continents become light ─────────────
         Terrain particles peel away gracefully.
         Organic, not explosive.  Thousands of soft amber motes.
         Atmospheric haze fades.  Earth becomes dark again.

         // particle convergence
         ─────────────────────────────────────────────────────────────── */
      const dS = 5.62;  // slightly later — hero hold fully settles before dissolve begins
      // sine.inOut: starts slow (particles barely stirring), builds, then pulls away
      tl.to(G, { dissolveP: 1, duration: 1.36, ease: "sine.inOut" }, dS);
      tl.to(G, { atmO: 0,     duration: 0.65, ease: "sine.in"    }, dS + 0.05);
      // Map dims as particles carry its light toward the horizon
      tl.to(G, { mapO: 0.14,  duration: 0.95, ease: "sine.in"    }, dS + 0.05);

      /* ── Phase 5: Horizon forms from converging particles ───────────
         The particles literally become the HorizonReveal horizon.
         No cut.  No transition.  One seamless handoff.

         // horizon formation
         ─────────────────────────────────────────────────────────────── */
      const hS = dS + 1.06;   // ≈ 6.68 — horizon forms as last particles arrive
      tl.to(G, { horizO: 1, duration: 0.34, ease: "sine.out" }, hS);
      tl.to(G, { horizW: 1, duration: 0.68, ease: "sine.out" }, hS + 0.05);
      tl.to(G, { overlayO: 0, duration: 0.68, ease: "sine.inOut" }, hS + 0.24);
      tl.to({}, { duration: 0.08 }, hS + 0.96);
    }

    return () => {
      tlRef.current?.kill();
      cancelAnimationFrame(rafIdRef.current);
      clearTimeout(skipShowTimer);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      onClick={handleSkip}
      style={{
        position: "fixed", inset: 0, zIndex: 201,
        pointerEvents: "auto",
        cursor: "default",
      }}
      role="presentation"
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          display: "block",
        }}
      />

      {/* ── Skip button — appears after 1.6 s, fades in gently ── */}
      <button
        ref={skipBtnRef}
        onClick={(e) => { e.stopPropagation(); handleSkip(); }}
        aria-label="Skip intro"
        style={{
          position:    "absolute",
          bottom:      "28px",
          right:       "28px",
          display:     "flex",
          alignItems:  "center",
          gap:         "7px",
          padding:     "7px 16px 7px 14px",
          background:  "rgba(255,255,255,0.055)",
          border:      "1px solid rgba(255,255,255,0.10)",
          borderRadius:"28px",
          color:       "rgba(255,255,255,0.45)",
          fontSize:    "11px",
          letterSpacing:"0.10em",
          fontFamily:  "'Inter', system-ui, sans-serif",
          fontWeight:  500,
          cursor:      "pointer",
          opacity:     0,
          transition:  "opacity 0.55s ease, background 0.22s ease, color 0.22s ease, border-color 0.22s ease",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          userSelect:  "none",
        }}
        onMouseEnter={e => {
          const b = e.currentTarget;
          b.style.background    = "rgba(255,255,255,0.10)";
          b.style.color         = "rgba(255,255,255,0.75)";
          b.style.borderColor   = "rgba(255,255,255,0.20)";
        }}
        onMouseLeave={e => {
          const b = e.currentTarget;
          b.style.background    = "rgba(255,255,255,0.055)";
          b.style.color         = "rgba(255,255,255,0.45)";
          b.style.borderColor   = "rgba(255,255,255,0.10)";
        }}
      >
        <span style={{ textTransform: "uppercase", letterSpacing: "0.12em" }}>Skip</span>
        {/* Animated chevron — bounces right gently on repeat */}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ animation: "skipChevron 1.4s ease-in-out infinite" }}
          aria-hidden="true"
        >
          <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Keyframe for the chevron bounce */}
      <style>{`
        @keyframes skipChevron {
          0%,100% { transform: translateX(0);   opacity: 0.6; }
          50%      { transform: translateX(3px); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
