"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/* ─────────────────────────────────────────────────────────────────────────────
   Constants & helpers
   ──────────────────────────────────────────────────────────────────────────── */
const AMBER = "#c9a853";
const TEAL  = "#0f9388";
const VOID  = "#060504";

/* Per-character gradient across "HORIZON" (cream → amber → teal) */
const H_COLS = ["#f5f0e4","#eedfa0","#e0c868","#c9a853","#94a055","#4ba078","#0f9388"] as const;

const clamp = (v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
const hex   = (v:number)=>clamp(Math.round(v),0,255).toString(16).padStart(2,"0");

/* ── 3-D sphere projection (no Three.js needed) ───────────────────────────── */
function sph(latR:number,lonR:number,rotY:number,cx:number,cy:number,r:number){
  const l = lonR+rotY;
  const x =  Math.cos(latR)*Math.sin(l);
  const y = -Math.sin(latR);
  const z =  Math.cos(latR)*Math.cos(l);
  const d = 2.8;                          // perspective depth
  const s = d/(d+z);
  return { px:cx+x*r*s, py:cy+y*r*s, z, s, vis:z>-0.10 };
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface City  { lat:number;lon:number;color:string;size:number;opacity:number; }
interface Arc   { fi:number;ti:number;progress:number; }
interface Ray   { angle:number;len:number;w:number;spd:number;ph:number; }
interface Ptcl  { x:number;y:number;vx:number;vy:number;life:number;size:number;color:string;on:boolean; }

/* ─── Real-world city nodes (lat°, lon°, color) ─────────────────────────── */
const CITY_DEG:[number,number,string][] = [
  [ 37.8,-122.4, AMBER], // San Francisco
  [ 51.5,  -0.1, AMBER], // London
  [ 35.7, 139.7, AMBER], // Tokyo
  [ 19.1,  72.9, TEAL ], // Mumbai
  [ 55.8,  37.6, TEAL ], // Moscow
  [ 40.7, -74.0, AMBER], // New York
  [  1.4, 103.8, TEAL ], // Singapore
  [ 48.9,   2.3, AMBER], // Paris
  [ 31.2, 121.5, TEAL ], // Shanghai
  [ 64.1, -21.9, AMBER], // Reykjavik
  [ 60.2,  24.9, TEAL ], // Helsinki
  [ 59.3,  18.1, AMBER], // Stockholm
  [ 39.9, 116.4, TEAL ], // Beijing
  [ 25.2,  55.3, AMBER], // Dubai
  [ 34.0,-118.2, TEAL ], // Los Angeles
  [ 41.0,  29.0, AMBER], // Istanbul
];

/* ─────────────────────────────────────────────────────────────────────────── */
export default function HorizonReveal() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const tlRef      = useRef<gsap.core.Timeline|null>(null);

  useEffect(()=>{
    /* ── Accessibility ────────────────────────────────────────────────── */
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      document.documentElement.classList.add("horizon-revealed");
      if(overlayRef.current) overlayRef.current.style.display="none";
      return;
    }

    const overlay = overlayRef.current!;
    const cv      = canvasRef.current!;
    const ctx     = cv.getContext("2d")!;
    let rafId     = 0;
    const prevOvf = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function resize(){ cv.width=window.innerWidth; cv.height=window.innerHeight; }
    resize();
    window.addEventListener("resize",resize,{passive:true});

    /* ── Scene objects ────────────────────────────────────────────────── */
    const cities:City[] = CITY_DEG.map(([lat,lon,c])=>({
      lat:lat*Math.PI/180, lon:lon*Math.PI/180,
      color:c, size:2.0+Math.random()*2.2, opacity:0,
    }));

    const arcs:Arc[] = [];
    for(let i=0;i<cities.length;i++){
      for(let j=i+1;j<cities.length;j++){
        const dlat=cities[i].lat-cities[j].lat;
        const dlon=cities[i].lon-cities[j].lon;
        if(Math.hypot(dlat,dlon)<2.0 && arcs.length<22)
          arcs.push({fi:i,ti:j,progress:0});
      }
    }

    /* Pre-seeded god rays (angle in radians above horizon) */
    const rays:Ray[] = Array.from({length:18},(_,i)=>({
      angle: Math.PI*0.06 + (i/18)*Math.PI*0.88,
      len:   0.45+Math.random()*0.45,
      w:     1.0+Math.random()*3.2,
      spd:   0.18+Math.random()*0.38,
      ph:    Math.random()*Math.PI*2,
    }));

    /* Particle pool */
    const PMAX=360;
    const pts:Ptcl[] = Array.from({length:PMAX},()=>
      ({x:0,y:0,vx:0,vy:0,life:0,size:0,color:AMBER,on:false}));
    let ptAcc=0;

    /* Star field */
    const stars = Array.from({length:160},()=>({
      x:Math.random(), y:Math.random()*0.58,
      r:0.15+Math.random()*0.8,
      a:0.04+Math.random()*0.14,
      ts:0.3+Math.random()*0.7,
      tp:Math.random()*Math.PI*2,
    }));

    /* ── GSAP-driven state object ─────────────────────────────────────── */
    const S={
      /* atmosphere */
      atmO:0, atmR:0.28,
      /* globe */
      gVis:0, gRFrac:0, gRotY:0, gGlow:0,
      /* god rays */
      rayO:0,
      /* aurora */
      aurO:0,
      /* scan line */
      scanYF:0.67, scanO:0,
      /* particle fountain */
      ptOn:0, ptO:0,
      /* canvas master opacity */
      cFade:1.0,
    };

    /* ── Draw loop ────────────────────────────────────────────────────── */
    let lt=0;
    function draw(ts:number){
      const dt=clamp((ts-lt)/1000,0,0.05); lt=ts;
      const W=cv.width, H=cv.height;
      const cx=W*0.5, hY=H*0.67;
      const ma=S.cFade;
      const now=ts/1000;

      ctx.clearRect(0,0,W,H);

      /* ─ Stars (twinkling) ──────────────────────────────────────────── */
      stars.forEach(s=>{
        const tw=0.6+0.4*Math.sin(now*s.ts+s.tp);
        ctx.beginPath();
        ctx.arc(s.x*W,s.y*H,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(240,236,227,${s.a*S.atmO*tw*ma})`;
        ctx.fill();
      });

      /* ─ Multi-layer atmosphere ─────────────────────────────────────── */
      if(S.atmO>0){
        const ao=S.atmO*ma;
        const r1=H*S.atmR*0.48, r2=H*S.atmR*1.08;

        /* Deep golden sunrise core */
        const g1=ctx.createRadialGradient(cx,hY,0,cx,hY,r1);
        g1.addColorStop(0,   `rgba(228,168,48,${0.38*ao})`);
        g1.addColorStop(0.28,`rgba(168,108,28,${0.20*ao})`);
        g1.addColorStop(0.68,`rgba(60,30,8,${0.08*ao})`);
        g1.addColorStop(1,   "rgba(6,5,4,0)");
        ctx.fillStyle=g1; ctx.fillRect(0,0,W,H);

        /* Cold space-blue haze */
        const g2=ctx.createRadialGradient(cx,hY,r1*0.35,cx,hY,r2);
        g2.addColorStop(0,  `rgba(16,36,76,${0.14*ao})`);
        g2.addColorStop(0.5,`rgba(8,18,48,${0.07*ao})`);
        g2.addColorStop(1,  "rgba(6,5,4,0)");
        ctx.fillStyle=g2; ctx.fillRect(0,0,W,H);

        /* Warm limb band right at horizon */
        const lg=ctx.createLinearGradient(0,hY-H*0.12,0,hY+H*0.05);
        lg.addColorStop(0,   "rgba(201,168,83,0)");
        lg.addColorStop(0.35,`rgba(201,168,83,${0.25*ao})`);
        lg.addColorStop(0.60,`rgba(248,208,88,${0.40*ao})`);
        lg.addColorStop(0.82,`rgba(201,168,83,${0.16*ao})`);
        lg.addColorStop(1,   "rgba(6,5,4,0)");
        ctx.fillStyle=lg; ctx.fillRect(0,0,W,H);

        /* Subtle teal counter-glow upper-left */
        const gt=ctx.createRadialGradient(W*0.1,H*0.1,0,W*0.1,H*0.1,H*0.7);
        gt.addColorStop(0,  `rgba(15,147,136,${0.06*ao})`);
        gt.addColorStop(1,  "rgba(6,5,4,0)");
        ctx.fillStyle=gt; ctx.fillRect(0,0,W,H);
      }

      /* ─ God rays (volumetric light beams from horizon) ─────────────── */
      if(S.rayO>0){
        ctx.save();
        ctx.globalCompositeOperation="screen";
        rays.forEach(ray=>{
          const pulse=0.5+0.5*Math.sin(now*ray.spd+ray.ph);
          const oa=(0.008+pulse*0.022)*S.rayO*ma;
          const ex=cx+Math.cos(ray.angle)*W*ray.len;
          const ey=hY-Math.sin(ray.angle)*H*ray.len*0.82;
          const gr=ctx.createLinearGradient(cx,hY,ex,ey);
          gr.addColorStop(0,  `rgba(230,178,65,${oa*11})`);
          gr.addColorStop(0.18,`rgba(230,178,65,${oa*4})`);
          gr.addColorStop(0.6, `rgba(230,178,65,${oa*1})`);
          gr.addColorStop(1,  "rgba(230,178,65,0)");
          ctx.beginPath();
          ctx.moveTo(cx,hY); ctx.lineTo(ex,ey);
          ctx.strokeStyle=gr; ctx.lineWidth=ray.w;
          ctx.stroke();
        });
        ctx.restore();
      }

      /* ─ Aurora ribbons ─────────────────────────────────────────────── */
      if(S.aurO>0){
        const ao=S.aurO*ma;
        [
          {y:0.16,a:0.058,f:1.2,p:0.0, c1:`rgba(201,168,83,${0.08*ao})`,c2:`rgba(15,147,136,${0.10*ao})`},
          {y:0.24,a:0.072,f:0.9,p:1.4, c1:`rgba(15,147,136,${0.08*ao})`,c2:`rgba(201,168,83,${0.07*ao})`},
          {y:0.34,a:0.044,f:1.6,p:2.8, c1:`rgba(201,168,83,${0.06*ao})`,c2:`rgba(15,147,136,${0.09*ao})`},
          {y:0.44,a:0.032,f:2.1,p:0.7, c1:`rgba(15,147,136,${0.04*ao})`,c2:`rgba(201,168,83,${0.05*ao})`},
        ].forEach(rb=>{
          const y0=H*rb.y;
          const p1=y0+Math.sin(now*rb.f+rb.p)*H*rb.a;
          const p2=y0+Math.sin(now*rb.f+rb.p+Math.PI)*H*rb.a;
          const rg=ctx.createLinearGradient(0,y0,W,y0);
          rg.addColorStop(0,  "rgba(0,0,0,0)");
          rg.addColorStop(0.2, rb.c1);
          rg.addColorStop(0.5, rb.c2);
          rg.addColorStop(0.8, rb.c1);
          rg.addColorStop(1,  "rgba(0,0,0,0)");
          ctx.save();
          ctx.globalAlpha=0.9;
          ctx.beginPath();
          ctx.moveTo(0,y0);
          ctx.bezierCurveTo(W*0.33,p1,W*0.67,p2,W,y0);
          ctx.strokeStyle=rg; ctx.lineWidth=50;
          ctx.stroke();
          ctx.restore();
        });
      }

      /* ─ Earth globe (3-D projected wireframe + arc + fill) ─────────── */
      if(S.gVis>0){
        const gv  =S.gVis*ma;
        const gr  =Math.min(W,H)*S.gRFrac;
        const rotY=S.gRotY;

        /* Horizon ellipse fill (Earth surface, hides bottom of globe) */
        const rx=W*0.63, ry2=H*0.165;
        const gap=(1-clamp(S.gVis*1.8,0,1))*0.44;
        const a0=Math.PI*(1+gap), a1=Math.PI*(2-gap);

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx,hY,rx,ry2,0,a0,a1);
        ctx.lineTo(cx+rx+120,H+80); ctx.lineTo(cx-rx-120,H+80);
        ctx.closePath(); ctx.fillStyle=VOID; ctx.fill();
        ctx.restore();

        /* Horizon glow halos */
        const la=clamp(S.gVis*2.8,0,1)*ma;
        [[26,0.04],[14,0.09],[5,0.16]].forEach(([lw,oa])=>{
          ctx.save(); ctx.beginPath();
          ctx.ellipse(cx,hY,rx,ry2,0,a0,a1);
          ctx.strokeStyle=`rgba(201,168,83,${(oa as number)*la})`;
          ctx.lineWidth=lw as number; ctx.stroke(); ctx.restore();
        });

        /* Core horizon line with centre-brightest gradient */
        const ag=ctx.createLinearGradient(cx-rx,hY,cx+rx,hY);
        ag.addColorStop(0,   "rgba(201,168,83,0)");
        ag.addColorStop(0.10,`rgba(201,168,83,${0.55*la})`);
        ag.addColorStop(0.50,`rgba(252,212,88,${1.00*la})`);
        ag.addColorStop(0.90,`rgba(201,168,83,${0.55*la})`);
        ag.addColorStop(1,   "rgba(201,168,83,0)");
        ctx.save(); ctx.beginPath();
        ctx.ellipse(cx,hY,rx,ry2,0,a0,a1);
        ctx.strokeStyle=ag; ctx.lineWidth=1.4; ctx.stroke(); ctx.restore();

        /* 3-D wireframe sphere */
        if(gr>24){
          /* Latitude rings every 20° */
          for(let ld=-80;ld<=80;ld+=20){
            const lat=ld*Math.PI/180;
            ctx.beginPath(); let first=true;
            for(let ld2=0;ld2<=364;ld2+=3){
              const p=sph(lat,ld2*Math.PI/180,rotY,cx,hY,gr);
              if(!p.vis){first=true;continue;}
              if(first){ctx.moveTo(p.px,p.py);first=false;}
              else ctx.lineTo(p.px,p.py);
            }
            const la2=(1-Math.abs(ld/90)*0.45)*0.14*gv;
            ctx.strokeStyle=`rgba(201,168,83,${la2})`;
            ctx.lineWidth=0.5; ctx.stroke();
          }
          /* Longitude meridians every 30° */
          for(let ld=0;ld<360;ld+=30){
            const lon=ld*Math.PI/180;
            ctx.beginPath(); let first=true;
            for(let ld2=-88;ld2<=88;ld2+=3){
              const p=sph(ld2*Math.PI/180,lon,rotY,cx,hY,gr);
              if(!p.vis){first=true;continue;}
              if(first){ctx.moveTo(p.px,p.py);first=false;}
              else ctx.lineTo(p.px,p.py);
            }
            ctx.strokeStyle=`rgba(201,168,83,${0.10*gv})`;
            ctx.lineWidth=0.5; ctx.stroke();
          }

          /* Sphere rim glow */
          if(S.gGlow>0){
            const rmg=ctx.createRadialGradient(cx,hY,gr*0.62,cx,hY,gr*1.08);
            rmg.addColorStop(0,   "rgba(201,168,83,0)");
            rmg.addColorStop(0.72,"rgba(201,168,83,0)");
            rmg.addColorStop(0.88,`rgba(201,168,83,${0.18*S.gGlow*ma})`);
            rmg.addColorStop(1,   `rgba(201,168,83,${0.06*S.gGlow*ma})`);
            ctx.beginPath(); ctx.arc(cx,hY,gr*1.08,0,Math.PI*2);
            ctx.fillStyle=rmg; ctx.fill();

            /* Sub-surface fill — slight dim glow inside sphere */
            const sfg=ctx.createRadialGradient(cx,hY,0,cx,hY,gr*0.9);
            sfg.addColorStop(0,  `rgba(30,18,6,${0.30*S.gGlow*ma})`);
            sfg.addColorStop(0.6,`rgba(20,12,4,${0.15*S.gGlow*ma})`);
            sfg.addColorStop(1,  "rgba(6,5,4,0)");
            ctx.beginPath(); ctx.arc(cx,hY,gr*0.9,0,Math.PI*2);
            ctx.fillStyle=sfg; ctx.fill();
          }
        }
      }

      /* ─ City nodes & great-circle arcs ────────────────────────────── */
      if(S.gVis>0 && Math.min(cv.width,cv.height)*S.gRFrac>24){
        const gr=Math.min(cv.width,cv.height)*S.gRFrac;
        const rotY=S.gRotY;

        cities.forEach(c=>{
          if(c.opacity<0.01) return;
          const p=sph(c.lat,c.lon,rotY,cx,hY,gr);
          if(!p.vis) return;
          const a=c.opacity*S.gVis*ma;
          const ph=((now*0.52+c.size*0.38)%1);

          /* Outer ping ring */
          if(ph<0.52){
            const pr=ph/0.52;
            ctx.beginPath();
            ctx.arc(p.px,p.py,(c.size+pr*16)*p.s,0,Math.PI*2);
            ctx.strokeStyle=`${c.color}${hex((1-pr)*0.38*a*255)}`;
            ctx.lineWidth=0.55; ctx.stroke();
          }
          /* Secondary slower ping */
          const ph2=((now*0.28+c.size*0.6)%1);
          if(ph2<0.65){
            const pr=ph2/0.65;
            ctx.beginPath();
            ctx.arc(p.px,p.py,(c.size+pr*28)*p.s,0,Math.PI*2);
            ctx.strokeStyle=`${c.color}${hex((1-pr)*0.18*a*255)}`;
            ctx.lineWidth=0.4; ctx.stroke();
          }

          /* Glow halo */
          const gw=ctx.createRadialGradient(p.px,p.py,0,p.px,p.py,c.size*4*p.s);
          gw.addColorStop(0,`${c.color}${hex(a*60)}`);
          gw.addColorStop(1,`${c.color}00`);
          ctx.beginPath(); ctx.arc(p.px,p.py,c.size*4*p.s,0,Math.PI*2);
          ctx.fillStyle=gw; ctx.fill();

          /* Core dot */
          ctx.beginPath(); ctx.arc(p.px,p.py,c.size*p.s,0,Math.PI*2);
          ctx.fillStyle=`${c.color}${hex(a*235)}`; ctx.fill();
        });

        /* Great-circle arcs between connected cities */
        arcs.forEach(arc=>{
          if(arc.progress<0.01) return;
          const fc=cities[arc.fi], tc=cities[arc.ti];
          if(fc.opacity<0.06||tc.opacity<0.06) return;
          const aAlpha=Math.min(fc.opacity,tc.opacity)*S.gVis*0.40*ma;
          const steps=32;
          ctx.beginPath(); let started=false;
          for(let k=0;k<=Math.round(steps*arc.progress);k++){
            const t=k/steps;
            const p=sph(
              fc.lat+(tc.lat-fc.lat)*t,
              fc.lon+(tc.lon-fc.lon)*t,
              rotY,cx,hY,gr
            );
            if(!p.vis){started=false;continue;}
            if(!started){ctx.moveTo(p.px,p.py);started=true;}
            else ctx.lineTo(p.px,p.py);
          }
          ctx.strokeStyle=`${AMBER}${hex(aAlpha*255)}`;
          ctx.lineWidth=0.8; ctx.stroke();
        });
      }

      /* ─ Scanning line ───────────────────────────────────────────────── */
      if(S.scanO>0){
        const sy=H*S.scanYF;
        const sg=ctx.createLinearGradient(0,sy,W,sy);
        sg.addColorStop(0,  "rgba(201,168,83,0)");
        sg.addColorStop(0.5,`rgba(201,168,83,${0.80*S.scanO*ma})`);
        sg.addColorStop(1,  "rgba(201,168,83,0)");
        ctx.fillStyle=sg; ctx.fillRect(0,sy-2.5,W,5);

        /* Wake glow below scan line */
        const wakeH=H*0.67-sy;
        if(wakeH>0){
          const wg=ctx.createLinearGradient(0,sy,0,sy+wakeH);
          wg.addColorStop(0,`rgba(201,168,83,${0.09*S.scanO*ma})`);
          wg.addColorStop(1,"rgba(201,168,83,0)");
          ctx.fillStyle=wg; ctx.fillRect(0,sy,W,wakeH);
        }
      }

      /* ─ Particle fountain ──────────────────────────────────────────── */
      if(S.ptO>0){
        if(S.ptOn>0.5){
          ptAcc+=dt;
          while(ptAcc>=0.009){
            ptAcc-=0.009;
            const d=pts.find(p=>!p.on);
            if(d){
              d.x=cx+(Math.random()-0.5)*360;
              d.y=hY+Math.random()*12;
              d.vx=(Math.random()-0.5)*1.6;
              d.vy=-(1.4+Math.random()*4.2);
              d.life=1; d.size=0.4+Math.random()*1.8;
              d.color=Math.random()>0.42?AMBER:TEAL;
              d.on=true;
            }
          }
        }
        pts.forEach(p=>{
          if(!p.on) return;
          p.life-=dt/(0.9+Math.random()*0.7);
          if(p.life<=0){p.on=false;return;}
          p.x+=p.vx; p.y+=p.vy;
          p.vy+=0.04; p.vx*=0.991;
          const a=Math.pow(p.life,0.5)*S.ptO*ma;
          ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
          ctx.fillStyle=`${p.color}${hex(a*210)}`; ctx.fill();
        });
      }

      rafId=requestAnimationFrame(draw);
    }
    rafId=requestAnimationFrame(ts=>{lt=ts;rafId=requestAnimationFrame(draw);});

    /* ── Finish ───────────────────────────────────────────────────────── */
    function finish(){
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize",resize);
      document.body.style.overflow=prevOvf;
      document.documentElement.classList.add("horizon-revealed");
      gsap.to(overlay,{
        opacity:0, duration:0.9, ease:"power2.inOut",
        onComplete:()=>{ overlay.style.display="none"; },
      });
    }

    /* ── GSAP master timeline ─────────────────────────────────────────── */
    const tl=gsap.timeline({onComplete:finish});
    tlRef.current=tl;

    /* ── Phase 0: Void seeds (0 → 0.7s) ─────────────────────────────── */
    tl.to(S,{atmO:0.30, duration:0.8, ease:"power1.inOut"},0);
    tl.to(S,{atmR:0.42, duration:1.1, ease:"power1.out"  },0);

    /* ── Phase 1: Scanner sweep (0.15 → 1.0s) ────────────────────────── */
    tl.to(S,{scanO:1, duration:0.08},0.15);
    tl.to(S,{scanYF:0.0, duration:0.72, ease:"power2.inOut"},0.20);
    tl.to(S,{scanO:0, duration:0.42, ease:"power1.out"},0.78);

    /* ── Phase 2: Globe materialises (0.55 → 2.1s) ──────────────────── */
    tl.to(S,{gVis:1, duration:1.3, ease:"power2.out"},0.55);
    tl.to(S,{gRFrac:0.42, duration:1.7, ease:"power3.out"},0.55);
    tl.to(S,{gRotY:Math.PI*0.22, duration:7, ease:"none"},0);   // continuous slow spin
    tl.to(S,{atmO:1, duration:1.5, ease:"power1.inOut"},0.85);
    tl.to(S,{atmR:1, duration:2.4, ease:"power1.out"  },0.85);
    tl.to(S,{gGlow:1, duration:1.0, ease:"power2.out" },1.7);

    /* ── Phase 3: God rays + aurora (1.0 → 2.6s) ────────────────────── */
    tl.to(S,{rayO:1, duration:1.2, ease:"power2.out"},1.0);
    tl.to(S,{aurO:1, duration:1.2, ease:"power2.out"},1.3);

    /* ── Phase 4: Particle fountain (1.4 → 3.6s) ────────────────────── */
    tl.to(S,{ptOn:1, ptO:1, duration:0.25},1.4);
    tl.to(S,{ptOn:0, duration:0.1},3.4);
    tl.to(S,{ptO:0, duration:1.0, ease:"power2.in"},3.4);

    /* ── Phase 5: City nodes (1.7 → 3.1s) ───────────────────────────── */
    cities.forEach((c,i)=>{
      tl.to(c,{opacity:0.50+Math.random()*0.50, duration:0.42, ease:"power2.out"},1.7+i*0.075);
    });
    arcs.forEach((a,i)=>{
      tl.to(a,{progress:1, duration:0.80, ease:"power1.inOut"},2.0+i*0.038);
    });

    /* ── Phase 6: Brand text — per-character reveal (3.0 → 4.5s) ────── */
    const xEls = Array.from(overlay.querySelectorAll<HTMLElement>(".xh-char--x"));
    const hEls = Array.from(overlay.querySelectorAll<HTMLElement>(".xh-char--h"));

    /* Set 3-D perspective origin at bottom so letters tip toward viewer */
    gsap.set(overlay.querySelector(".xh-brand"),{perspective:650,perspectiveOrigin:"50% 100%"});

    /* Canvas dims gracefully so text pops */
    tl.to(S,{cFade:0.42, duration:1.1, ease:"power1.inOut"},2.8);

    /* "XANTHRA" — each letter rises, sharpens, un-tilts */
    tl.fromTo(xEls,
      {yPercent:130, opacity:0, filter:"blur(14px)", rotationX:32, z:-40},
      {yPercent:0,   opacity:1, filter:"blur(0px)",  rotationX:0,  z:0,
       stagger:{amount:0.50, ease:"power2.inOut"},
       duration:0.95, ease:"power4.out"},
      3.0
    );

    /* "HORIZON" — 400ms offset stagger */
    tl.fromTo(hEls,
      {yPercent:130, opacity:0, filter:"blur(14px)", rotationX:32, z:-40},
      {yPercent:0,   opacity:1, filter:"blur(0px)",  rotationX:0,  z:0,
       stagger:{amount:0.44, ease:"power2.inOut"},
       duration:0.90, ease:"power4.out"},
      3.45
    );

    /* Tagline + decorative line */
    tl.fromTo(
      overlay.querySelector(".xh-tagline"),
      {opacity:0, y:14},
      {opacity:1, y:0, duration:0.75, ease:"power2.out"},
      4.05
    );
    tl.fromTo(
      overlay.querySelector(".xh-deco-line"),
      {scaleX:0},
      {scaleX:1, duration:0.9, ease:"power3.inOut"},
      4.0
    );

    /* Metrics row */
    tl.fromTo(
      overlay.querySelector(".xh-metrics"),
      {opacity:0, y:10},
      {opacity:1, y:0, duration:0.6, ease:"power2.out"},
      4.3
    );

    /* Skip hint */
    tl.fromTo(
      overlay.querySelector(".xh-skip"),
      {opacity:0},
      {opacity:1, duration:0.5},
      4.5
    );

    /* Hold → complete at ~5.3s */
    tl.to({},{duration:0.75},4.55);

    /* ── Skip handler ─────────────────────────────────────────────────── */
    function skip(){
      tlRef.current?.kill(); tlRef.current=null; finish();
    }
    const onKey=(e:KeyboardEvent)=>{
      if(e.key==="Escape"||e.key===" "||e.key==="Enter"){e.preventDefault();skip();}
    };
    window.addEventListener("keydown",onKey);
    let armed=false;
    const arm=setTimeout(()=>{armed=true;overlay.addEventListener("click",skip);},1000);

    return ()=>{
      tlRef.current?.kill();
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize",resize);
      window.removeEventListener("keydown",onKey);
      clearTimeout(arm);
      if(armed) overlay.removeEventListener("click",skip);
      document.body.style.overflow=prevOvf;
    };
  },[]);

  /* ── JSX ─────────────────────────────────────────────────────────────── */
  const metrics=[
    {val:"600+",label:"Sources"},
    {val:"7",   label:"Stories"},
    {val:"∞",   label:"Free"},
  ];

  return (
    <div ref={overlayRef} className="xh-overlay" role="presentation" aria-hidden="true">
      {/* Canvas layer — all visual effects render here */}
      <canvas ref={canvasRef} className="xh-canvas"/>

      {/* Brand block — centred, above the horizon */}
      <div className="xh-brand">

        {/* "XANTHRA" — per-character overflow-clipped reveal */}
        <div className="xh-word-wrap">
          {"XANTHRA".split("").map((ch,i)=>(
            <span key={i} className="xh-char xh-char--x">{ch}</span>
          ))}
        </div>

        {/* "HORIZON" — per-character with colour gradient */}
        <div className="xh-word-wrap xh-word-wrap--h">
          {H_COLS.map((col,i)=>(
            <span key={i} className="xh-char xh-char--h" style={{color:col}}>
              {"HORIZON"[i]}
            </span>
          ))}
        </div>

        {/* Decorative rule that draws in under the words */}
        <div className="xh-deco-line" style={{transformOrigin:"left center",transform:"scaleX(0)"}}/>

        {/* Tagline */}
        <p className="xh-tagline" style={{opacity:0}}>
          Know What Matters Next.
        </p>

        {/* Live metrics */}
        <div className="xh-metrics" style={{opacity:0}}>
          {metrics.map(m=>(
            <div key={m.label} className="xh-metric">
              <span className="xh-metric-val">{m.val}</span>
              <span className="xh-metric-label">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skip hint — bottom-right */}
      <p className="xh-skip" style={{opacity:0}}>Press any key to skip</p>
    </div>
  );
}
