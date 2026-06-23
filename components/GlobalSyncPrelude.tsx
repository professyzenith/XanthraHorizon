"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/* ─────────────────────────────────────────────────────────────────────────────
   PROJECTION  — equirectangular, lat clipped ±72°
   Map occupies W*4%…W*96% × H*6%…H*60%  (leaves horizon zone clear)
   ──────────────────────────────────────────────────────────────────────────── */
const LAT_MAX =  72, LAT_MIN = -58;
const LAT_SPAN = LAT_MAX - LAT_MIN;
const MX0 = 0.04, MX1 = 0.96;
const MY0 = 0.06, MY1 = 0.60;

function px(lon: number, W: number) {
  return (MX0 + ((lon + 180) / 360) * (MX1 - MX0)) * W;
}
function py(lat: number, H: number) {
  const c = Math.max(LAT_MIN, Math.min(LAT_MAX, lat));
  return (MY0 + ((LAT_MAX - c) / LAT_SPAN) * (MY1 - MY0)) * H;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LAND POLYGONS  — [lon, lat][]
   Each entry is one closed landmass / peninsula.
   Separated so peninsulas (India, Arabia, Korea, Scandinavia) are distinct.
   ──────────────────────────────────────────────────────────────────────────── */
const POLYS: [number, number][][] = [

  /* ── NORTH AMERICA (main body) ─────────────────────────────────────── */
  [
    [-168,63],[-155,60],[-149,61],[-136,59],
    [-127,49],[-124,48],[-121,38],[-117,33],
    [-115,30],[-110,24],[-105,20],[-96,16],[-87,12],
    [-83,10],[-77,8],[-76,10],[-82,10],
    [-90,26],[-88,22],[-90,20],[-94,20],[-97,19],
    [-97,22],[-80,25],[-81,26],[-80,28],
    [-75,35],[-76,34],[-74,38],[-73,41],[-70,42],
    [-66,44],[-62,45],[-60,47],[-56,50],[-54,48],
    [-58,54],[-64,60],[-72,64],[-78,72],
    [-95,72],[-110,72],[-120,70],[-140,70],
    [-150,70],[-168,65],[-168,63],
  ],
  /* Alaska */
  [
    [-168,63],[-168,57],[-163,55],[-160,55],
    [-156,56],[-152,57],[-148,59],[-145,60],
    [-141,60],[-136,59],[-135,57],[-140,54],
    [-152,55],[-160,55],[-165,55],[-168,57],
  ],
  /* Greenland */
  [
    [-44,83],[-24,83],[-18,78],[-18,72],[-22,70],
    [-26,68],[-32,66],[-40,65],[-46,65],[-52,68],
    [-56,74],[-52,78],[-44,83],
  ],
  /* Cuba */
  [[-84,22],[-82,22],[-79,22],[-75,20],[-74,20],[-80,20],[-84,22]],

  /* ── SOUTH AMERICA ─────────────────────────────────────────────────── */
  [
    [-77,10],[-72,12],[-65,11],[-62,8],[-58,6],
    [-52,4],[-50,2],[-48,0],[-44,-2],
    [-36,-6],[-35,-8],[-37,-12],[-38,-16],
    [-40,-20],[-44,-23],[-47,-28],[-50,-30],
    [-52,-34],[-58,-40],[-64,-46],[-68,-52],
    [-68,-55],[-65,-55],[-63,-52],[-64,-46],
    [-68,-40],[-72,-44],[-75,-50],[-76,-48],
    [-78,-4],[-79,0],[-76,1],[-78,4],[-77,8],[-77,10],
  ],

  /* ── EUROPE (main body incl. Iberia) ──────────────────────────────── */
  [
    [-9,38],[-9,44],[-8,44],[-7,48],[-2,48],[2,50],
    [2,52],[4,52],[4,54],[8,54],[10,54],[12,54],
    [14,55],[18,57],[20,58],[24,59],[26,60],[28,62],
    [24,64],[22,70],[28,72],[32,70],[30,66],[32,62],
    [36,58],[40,58],[42,52],[38,48],[36,46],[32,46],
    [28,44],[26,40],[22,38],[18,40],[16,40],
    [14,42],[12,44],[14,46],[10,44],[8,44],
    [4,44],[2,43],[-2,44],[-4,44],
    [-6,38],[-5,36],[-2,36],[2,35],[8,37],
    [12,37],[16,38],[18,38],[22,38],[24,38],
    [26,38],[22,40],[20,40],[18,40],
    /* back up west coast of Iberia */
    [-4,36],[-8,38],[-9,38],
  ],
  /* Scandinavia */
  [
    [5,58],[8,58],[10,58],[12,56],[14,56],[16,58],
    [18,60],[20,62],[24,64],[26,66],[28,70],[26,72],
    [22,70],[20,68],[18,66],[16,64],[14,60],[12,58],
    [10,56],[8,56],[6,58],[5,58],
  ],
  /* UK + Ireland */
  [[-5,50],[-2,52],[0,54],[0,56],[-2,58],[-4,58],
   [-6,58],[-6,56],[-5,54],[-4,50],[-2,50],[-5,50]],
  [[-8,52],[-10,52],[-10,54],[-8,55],[-6,54],[-6,52],[-8,52]],

  /* ── AFRICA ─────────────────────────────────────────────────────────── */
  [
    [-5,36],[-2,35],[4,35],[8,37],[14,37],[20,37],
    [26,38],[32,32],[36,24],[38,18],[40,14],[42,12],
    [44,12],[48,12],[50,12],[52,11],[52,4],
    [44,2],[42,0],[40,-4],[38,-10],[36,-16],
    [34,-20],[30,-26],[26,-30],[22,-34],[18,-34],
    [16,-30],[14,-22],[12,-18],[10,-2],[8,4],
    [4,6],[2,6],[0,5],[-4,5],[-8,5],
    [-12,8],[-15,10],[-17,14],[-16,18],
    [-14,24],[-8,30],[-6,34],[-5,36],
  ],
  /* Madagascar */
  [[44,-26],[48,-16],[50,-14],[48,-12],[44,-14],
   [44,-20],[44,-26]],

  /* ── ARABIAN PENINSULA ──────────────────────────────────────────────── */
  [
    [36,30],[38,16],[42,12],[44,12],[48,14],
    [52,14],[56,14],[58,18],[60,22],[58,24],
    [56,26],[56,28],[52,30],[50,30],[46,30],
    [42,32],[38,32],[36,30],
  ],

  /* ── INDIA (distinctive triangle — clearly southward-pointing) ──────── */
  [
    [68,24],[70,22],[72,20],[72,18],[73,16],
    [74,14],[75,12],[76,10],[77,9],[78,8],
    [79,8],[80,8],                   /* southern tip Kanyakumari */
    [80,9],[80,12],[80,14],[80,16],
    [80,18],[82,20],[84,21],[86,22],
    [88,22],[90,24],[92,24],[94,26],
    [96,28],[97,28],
    /* northern border (Himalayas - stays roughly at lat 28-35) */
    [94,28],[88,28],[84,28],[80,30],
    [78,34],[76,34],[74,34],[72,30],
    [70,28],[68,26],[68,24],
  ],
  /* Sri Lanka */
  [[80,10],[81,10],[81,8],[80,8],[80,10]],

  /* ── SOUTH-EAST ASIA (incl. Indochina + Malay Peninsula) ───────────── */
  [
    [96,28],[100,24],[104,20],[108,20],
    [110,18],[112,20],[110,22],[108,22],
    [104,4],[102,4],[100,2],[100,5],
    [103,2],[102,0],[100,-4],[104,-8],
    [108,-8],[110,-8],[112,-8],[114,-6],
    [118,-8],[120,-8],[124,-8],[126,-8],
    [124,-6],[122,-4],[120,2],[116,4],
    [112,6],[108,10],[104,12],[100,14],
    [98,16],[96,22],[96,28],
  ],

  /* ── CHINA / EAST ASIA (main body, excl. India + SE Asia) ─────────── */
  [
    [74,38],[78,36],[82,32],[86,28],[90,28],
    [94,28],[96,28],[100,24],[104,22],[110,20],
    [114,22],[116,22],[118,24],[120,26],[122,30],
    [122,38],[120,40],[118,40],[116,42],
    [112,44],[108,48],[110,52],[106,56],
    [100,58],[96,60],[90,56],[84,52],
    [80,56],[76,44],[74,44],[74,38],
  ],
  /* Korean Peninsula */
  [
    [124,38],[126,36],[128,34],[130,35],
    [130,38],[128,40],[126,40],[124,38],
  ],
  /* Taiwan */
  [[120,26],[121,24],[121,22],[120,22],[120,24],[120,26]],

  /* ── JAPAN (Honshu) ─────────────────────────────────────────────────── */
  [
    [130,32],[132,34],[134,34],[136,36],[138,36],
    [140,38],[142,40],[142,42],[140,44],
    [138,42],[136,40],[134,36],[132,34],[130,32],
  ],
  /* Hokkaido */
  [[140,44],[142,44],[144,44],[144,42],[142,42],[140,44]],
  /* Kyushu/Shikoku rough */
  [[130,32],[132,34],[134,34],[132,32],[130,32]],

  /* ── SIBERIA / RUSSIA (simplified main body) ─────────────────────────── */
  [
    [30,72],[40,72],[60,74],[80,74],[100,74],
    [120,74],[140,72],[160,68],[168,64],
    [165,60],[155,58],[148,56],[144,48],
    [140,46],[136,46],[130,46],[126,44],
    [120,44],[114,42],[108,48],[106,54],
    [100,58],[96,60],[90,56],[84,52],
    [80,56],[74,58],[68,60],[62,60],
    [56,58],[50,56],[46,54],[44,52],
    [40,52],[36,50],[34,48],[30,50],
    [28,56],[30,60],[32,66],[30,72],
  ],

  /* ── AUSTRALIA ────────────────────────────────────────────────────── */
  [
    [114,-22],[116,-20],[118,-20],[122,-18],
    [126,-14],[130,-12],[132,-12],[136,-12],
    [138,-14],[142,-10],[144,-14],[148,-18],
    [150,-22],[152,-24],[152,-28],[151,-32],
    [151,-34],[148,-38],[145,-38],[142,-38],
    [138,-36],[134,-36],[130,-46],
    [122,-42],[116,-36],[114,-28],[114,-22],
  ],
  /* Tasmania */
  [[145,-42],[148,-42],[148,-44],[145,-44],[145,-42]],
  /* New Zealand South Island */
  [[172,-46],[174,-42],[172,-40],[168,-44],[170,-46],[172,-46]],
  /* New Zealand North Island */
  [[174,-38],[178,-38],[178,-40],[176,-40],[174,-38]],
];

/* ─────────────────────────────────────────────────────────────────────────────
   REGIONS — the 6 global intelligence-gathering nodes
   lon/lat placed at the recognised hub of each region.
   ──────────────────────────────────────────────────────────────────────────── */
const REGIONS = [
  { label: "NORTH AMERICA", lon: -97,  lat: 38 },   /* Kansas / US Midwest */
  { label: "EUROPE",        lon:   8,  lat: 51 },   /* Frankfurt corridor  */
  { label: "INDIA",         lon:  79,  lat: 22 },   /* Madhya Pradesh hub  */
  { label: "MIDDLE EAST",   lon:  47,  lat: 25 },   /* Gulf / Riyadh       */
  { label: "EAST ASIA",     lon: 116,  lat: 36 },   /* Beijing / Yellow Sea*/
  { label: "S.E. ASIA",     lon: 101,  lat: 14 },   /* Bangkok corridor    */
] as const;

const ACT_T = [0.28, 0.42, 0.56, 0.68, 0.80, 0.93] as const;

/* ═════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═════════════════════════════════════════════════════════════════════════════ */
export default function GlobalSyncPrelude() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (overlayRef.current) overlayRef.current.style.display = "none";
      return;
    }

    const overlay = overlayRef.current!;
    const cv      = canvasRef.current!;
    const ctx     = cv.getContext("2d")!;
    let   rafId   = 0;

    function resize() { cv.width = window.innerWidth; cv.height = window.innerHeight; }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    /* ── Animation state ──────────────────────────────────────────────── */
    const G = {
      mapO:    0,
      titleO:  0,
      syncO:   0,
      horizO:  0,
      horizW:  0,
      overlayO: 1,
      scanY:   0,   /* 0→1 fraction of map vertical span */
    };

    const R = REGIONS.map(r => ({
      ...r,
      dotO:   0.0,
      pulseO: 0.0,
      pulseR: 0.0,
      checkO: 0.0,
      sigO:   0.0,
      sigP:   0.0,
    }));

    /* ── Draw ─────────────────────────────────────────────────────────── */
    function draw(ts: number) {
      const W = cv.width, H = cv.height;
      const cx = W * 0.5;
      const hY = H * 0.67;
      const oa = G.overlayO;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = `rgba(6,5,4,${oa})`;
      ctx.fillRect(0, 0, W, H);

      /* ── Graticule ───────────────────────────────────────────────────── */
      if (G.mapO > 0.005) {
        const mo = G.mapO * oa;

        ctx.save();
        ctx.lineWidth = 0.35;

        /* Lon lines every 30° */
        for (let lon = -180; lon <= 180; lon += 30) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(201,168,83,${lon === 0 ? 0.06 * mo : 0.032 * mo})`;
          ctx.moveTo(px(lon, W), py(LAT_MAX, H));
          ctx.lineTo(px(lon, W), py(LAT_MIN, H));
          ctx.stroke();
        }
        /* Lat lines every 30° */
        for (let lat = -60; lat <= 72; lat += 30) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(201,168,83,${lat === 0 ? 0.08 * mo : 0.032 * mo})`;
          ctx.moveTo(px(-180, W), py(lat, H));
          ctx.lineTo(px(180,  W), py(lat, H));
          ctx.stroke();
        }
        ctx.restore();

        /* ── Continent fills & outlines ─────────────────────────────────── */
        POLYS.forEach(poly => {
          if (poly.length < 3) return;
          ctx.beginPath();
          poly.forEach(([lon, lat], i) => {
            i === 0
              ? ctx.moveTo(px(lon, W), py(lat, H))
              : ctx.lineTo(px(lon, W), py(lat, H));
          });
          ctx.closePath();
          ctx.fillStyle   = `rgba(40,30,12,${0.55 * mo})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(201,168,83,${0.22 * mo})`;
          ctx.lineWidth   = 0.7;
          ctx.stroke();
        });

        /* ── Moving scan line ────────────────────────────────────────────── */
        const sy = (MY0 + G.scanY * (MY1 - MY0)) * H;
        const sg = ctx.createLinearGradient(0, sy - 20, 0, sy + 10);
        sg.addColorStop(0,   "rgba(201,168,83,0)");
        sg.addColorStop(0.65,`rgba(201,168,83,${0.055 * mo})`);
        sg.addColorStop(1,   "rgba(201,168,83,0)");
        ctx.fillStyle = sg;
        ctx.fillRect(MX0 * W, sy - 20, (MX1 - MX0) * W, 30);
      }

      /* ── Network mesh ─────────────────────────────────────────────────── */
      for (let i = 0; i < R.length; i++) {
        for (let j = i + 1; j < R.length; j++) {
          const a = R[i], b = R[j];
          const alpha = Math.min(a.dotO, b.dotO) * 0.09 * oa;
          if (alpha < 0.005) continue;
          const ax = px(a.lon, W), ay = py(a.lat, H);
          const bx = px(b.lon, W), by = py(b.lat, H);
          const lg = ctx.createLinearGradient(ax, ay, bx, by);
          lg.addColorStop(0,   `rgba(201,168,83,${alpha})`);
          lg.addColorStop(0.5, `rgba(255,210,80,${alpha * 1.5})`);
          lg.addColorStop(1,   `rgba(201,168,83,${alpha})`);
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
          ctx.strokeStyle = lg; ctx.lineWidth = 0.5; ctx.stroke();
        }
      }

      /* ── Region nodes ──────────────────────────────────────────────────── */
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

        /* Ambient glow (breathing) */
        const breath = 0.72 + 0.28 * Math.sin(t * 2.4 + r.lon * 0.03);
        const grd = ctx.createRadialGradient(rx, ry, 0, rx, ry, 20);
        grd.addColorStop(0,   `rgba(255,220,80,${r.dotO * 0.70 * breath * oa})`);
        grd.addColorStop(0.4, `rgba(201,168,83,${r.dotO * 0.18 * oa})`);
        grd.addColorStop(1,   "rgba(201,168,83,0)");
        ctx.beginPath(); ctx.arc(rx, ry, 20, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();

        /* Core dot 3 px */
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
        /* pill bg */
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

        /* Signal trail to horizon */
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

      /* ── Horizon line (matches HorizonReveal exactly) ────────────────── */
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

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    /* ── GSAP timeline  — exactly 2.00 s ─────────────────────────────── */
    const tl = gsap.timeline({
      onComplete: () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", resize);
        overlay.style.display = "none";
      },
    });

    tl.to(G, { mapO: 1,   duration: 0.35, ease: "power1.out" }, 0);
    tl.to(G, { titleO: 1, duration: 0.25, ease: "power1.out" }, 0.06);
    tl.to(G, { scanY: 1,  duration: 1.10, ease: "none" },       0.10);

    R.forEach((r, i) => {
      const t0 = ACT_T[i];
      tl.to(r, { dotO: 1,  duration: 0.20, ease: "power1.out" }, t0);
      tl.to(r, { pulseO: 1, pulseR: 0, duration: 0.06 },         t0 + 0.02);
      tl.to(r, { pulseO: 0, pulseR: 1, duration: 0.35, ease: "power1.out" }, t0 + 0.06);
      tl.to(r, { checkO: 1, duration: 0.16, ease: "power1.out" }, t0 + 0.22);
    });

    R.forEach((r, i) => {
      const t0 = 0.62 + i * 0.048;
      tl.to(r, { sigO: 1, duration: 0.12 },                    t0);
      tl.to(r, { sigP: 1, duration: 0.62, ease: "power2.in" }, t0 + 0.04);
      tl.to(r, { sigO: 0, duration: 0.18, ease: "power1.in" }, t0 + 0.52);
    });

    tl.to(G, { horizO: 1, duration: 0.22, ease: "power2.out" }, 1.36);
    tl.to(G, { horizW: 1, duration: 0.40, ease: "power2.out" }, 1.38);
    tl.to(G, { syncO:  1, duration: 0.22, ease: "power1.out" }, 1.52);
    tl.to(G, { titleO: 0, syncO: 0, mapO: 0, duration: 0.18, ease: "power1.in" }, 1.76);
    tl.to(G, { overlayO: 0, duration: 0.22, ease: "power2.in" }, 1.78);
    tl.to({}, { duration: 0.02 }, 2.00);

    return () => {
      tl.kill();
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      style={{ position: "fixed", inset: 0, zIndex: 201, pointerEvents: "none" }}
      role="presentation"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
