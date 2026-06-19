"use client";
import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; color: string;
}

const COLORS = [
  "rgba(201,168,83,",
  "rgba(212,135,90,",
  "rgba(15,147,136,",
  "rgba(232,197,109,",
];

export default function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function spawn(): Particle {
      return {
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 20,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.6 + 0.2),
        size: Math.random() * 1.8 + 0.4,
        alpha: 0,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    }

    // seed initial particles scattered across screen
    for (let i = 0; i < 55; i++) {
      const p = spawn();
      p.y = Math.random() * window.innerHeight;
      p.alpha = Math.random() * 0.5;
      particles.push(p);
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Occasionally spawn new
      if (Math.random() < 0.18) particles.push(spawn());

      particles = particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // fade in then out
        if (p.y < window.innerHeight * 0.8) {
          p.alpha = Math.min(p.alpha + 0.006, 0.55);
        }
        if (p.y < window.innerHeight * 0.2) {
          p.alpha -= 0.008;
        }

        if (p.alpha <= 0 || p.y < -20) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ")";
        ctx.fill();

        // soft glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        g.addColorStop(0, p.color + (p.alpha * 0.3) + ")");
        g.addColorStop(1, p.color + "0)");
        ctx.fillStyle = g;
        ctx.fill();

        return true;
      });

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
