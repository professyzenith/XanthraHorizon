"use client";
import { useEffect, useRef } from "react";

interface Node { x:number; y:number; vx:number; vy:number; r:number; pulse:number; pSpeed:number; }

export default function NetworkOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse     = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 540, H = 540;
    canvas.width = W; canvas.height = H;
    const cx = W/2, cy = H/2, RADIUS = 200, N = 32, CDIST = 140;

    const nodes: Node[] = Array.from({ length: N }, () => {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * RADIUS * 0.85;
      return { x: cx + Math.cos(a)*d, y: cy + Math.sin(a)*d,
        vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4,
        r: Math.random()*2.2+0.8, pulse: Math.random()*Math.PI*2,
        pSpeed: Math.random()*0.025+0.008 };
    });

    let t = 0, animId: number;

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      mouse.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top)  * scaleY,
      };
    }
    function onMouseLeave() { mouse.current = { x: -999, y: -999 }; }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      t += 0.007;

      // ── Outer glow sphere (amber) ──
      const sphereG = ctx!.createRadialGradient(cx, cy, 0, cx, cy, RADIUS+30);
      sphereG.addColorStop(0,   "rgba(201,168,83,0.07)");
      sphereG.addColorStop(0.6, "rgba(212,135,90,0.04)");
      sphereG.addColorStop(1,   "rgba(15,147,136,0.0)");
      ctx!.beginPath(); ctx!.arc(cx, cy, RADIUS+30, 0, Math.PI*2);
      ctx!.fillStyle = sphereG; ctx!.fill();

      // ── Concentric rings (amber) ──
      [RADIUS, RADIUS*0.68, RADIUS*0.38].forEach((r, i) => {
        ctx!.beginPath(); ctx!.arc(cx, cy, r, 0, Math.PI*2);
        ctx!.strokeStyle = `rgba(201,168,83,${0.07 - i*0.015})`;
        ctx!.lineWidth = 0.8; ctx!.stroke();
      });

      // ── Rotating orbital arcs ──
      for (let i = 0; i < 2; i++) {
        const angle = t*(0.35+i*0.2) + i*Math.PI;
        ctx!.beginPath();
        ctx!.arc(cx, cy, RADIUS*(0.55+i*0.3), angle, angle + Math.PI*1.1);
        const arcG = ctx!.createLinearGradient(
          cx + Math.cos(angle)*RADIUS*(0.55+i*0.3),
          cy + Math.sin(angle)*RADIUS*(0.55+i*0.3),
          cx + Math.cos(angle+Math.PI*1.1)*RADIUS*(0.55+i*0.3),
          cy + Math.sin(angle+Math.PI*1.1)*RADIUS*(0.55+i*0.3),
        );
        arcG.addColorStop(0,   "rgba(201,168,83,0)");
        arcG.addColorStop(0.5, `rgba(${i===0?"201,168,83":"15,147,136"},0.5)`);
        arcG.addColorStop(1,   "rgba(201,168,83,0)");
        ctx!.strokeStyle = arcG; ctx!.lineWidth = 1.2; ctx!.stroke();

        // Dot at arc tip
        const tipX = cx + Math.cos(angle)*RADIUS*(0.55+i*0.3);
        const tipY = cy + Math.sin(angle)*RADIUS*(0.55+i*0.3);
        ctx!.beginPath(); ctx!.arc(tipX, tipY, 3, 0, Math.PI*2);
        ctx!.fillStyle = i===0 ? "rgba(232,197,109,0.9)" : "rgba(15,147,136,0.9)"; ctx!.fill();
        const dg = ctx!.createRadialGradient(tipX, tipY, 0, tipX, tipY, 14);
        dg.addColorStop(0, i===0 ? "rgba(232,197,109,0.3)" : "rgba(15,147,136,0.3)");
        dg.addColorStop(1, "transparent");
        ctx!.beginPath(); ctx!.arc(tipX, tipY, 14, 0, Math.PI*2);
        ctx!.fillStyle = dg; ctx!.fill();
      }

      // ── Cursor-reactive repulsion ──
      const mx = mouse.current.x, my = mouse.current.y;

      nodes.forEach((n) => {
        const mdx = n.x - mx, mdy = n.y - my;
        const md  = Math.sqrt(mdx*mdx + mdy*mdy);
        if (md < 90 && md > 0) {
          const force = (90 - md) / 90 * 0.8;
          n.vx += (mdx/md) * force;
          n.vy += (mdy/md) * force;
        }
        const dx = n.x - cx, dy = n.y - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > RADIUS*0.92) {
          n.vx -= (dx/dist)*0.06;
          n.vy -= (dy/dist)*0.06;
        }
        n.vx += (cx - n.x) * 0.0003;
        n.vy += (cy - n.y) * 0.0003;
        n.vx *= 0.94; n.vy *= 0.94;
        n.x  += n.vx;  n.y  += n.vy;
        n.pulse += n.pSpeed;
      });

      // ── Connections (amber) ──
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i+1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d  = Math.sqrt(dx*dx+dy*dy);
          if (d < CDIST) {
            const alpha = (1 - d/CDIST) * 0.35;
            const lx = (nodes[i].x+nodes[j].x)/2, ly = (nodes[i].y+nodes[j].y)/2;
            const ld = Math.sqrt((lx-mx)**2+(ly-my)**2);
            const boost = ld < 100 ? (1-ld/100)*0.4 : 0;
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.strokeStyle = `rgba(201,165,80,${Math.min(alpha+boost,0.65)})`;
            ctx!.lineWidth = 0.7; ctx!.stroke();
          }
        }
      }

      // ── Nodes (amber) ──
      nodes.forEach((n) => {
        const a  = 0.45 + Math.sin(n.pulse)*0.35;
        const md = Math.sqrt((n.x-mx)**2+(n.y-my)**2);
        const glow = md < 80 ? (1-md/80)*3 : 1;
        ctx!.beginPath(); ctx!.arc(n.x, n.y, n.r*glow*0.6, 0, Math.PI*2);
        ctx!.fillStyle = `rgba(232,197,109,${Math.min(a*glow,0.9)})`; ctx!.fill();
        const ng = ctx!.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r*5*glow);
        ng.addColorStop(0, `rgba(201,168,83,${a*0.5*Math.min(glow,1.5)})`);
        ng.addColorStop(1, "transparent");
        ctx!.beginPath(); ctx!.arc(n.x,n.y,n.r*5*glow,0,Math.PI*2);
        ctx!.fillStyle = ng; ctx!.fill();
      });

      // ── Central orb (amber-gold core) ──
      const cg = ctx!.createRadialGradient(cx,cy,0,cx,cy,28);
      cg.addColorStop(0, "rgba(255,245,215,1)");
      cg.addColorStop(0.3,"rgba(232,197,109,0.9)");
      cg.addColorStop(0.7,"rgba(201,168,83,0.5)");
      cg.addColorStop(1, "transparent");
      ctx!.beginPath(); ctx!.arc(cx,cy,28,0,Math.PI*2);
      ctx!.fillStyle = cg; ctx!.fill();
      // warm white core
      ctx!.beginPath(); ctx!.arc(cx,cy,4,0,Math.PI*2);
      ctx!.fillStyle = "#fffbe8"; ctx!.fill();

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      canvas?.removeEventListener("mousemove", onMouseMove);
      canvas?.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas ref={canvasRef}
      className="opacity-95"
      style={{ width:540, height:540, maxWidth:"min(90vw,540px)", maxHeight:"min(90vw,540px)" }}
    />
  );
}
