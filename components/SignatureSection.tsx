"use client";
import { useEffect, useRef, useState } from "react";

const WORDS = [
  "Something just happened in AI.",
  "The world just moved.",
  "Xanthra Horizon told you first.",
  "You were informed before they were.",
  "Know What Matters Next.",
];

const NOISE_WORDS = [
  "600+ sources. Every story. One inbox.",
  "Stay informed. Miss nothing. Always.",
  "Xanthra Horizon. Know what matters next.",
  "Intelligence delivered while you sleep.",
];

export default function SignatureSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [wordIdx, setWordIdx] = useState(0);
  const [noiseIdx, setNoiseIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [charIdx, setCharIdx] = useState(0);
  const [phase, setPhase] = useState<"typing"|"hold"|"erasing">("typing");

  // Typewriter effect
  useEffect(() => {
    const word = WORDS[wordIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (charIdx < word.length) {
        timeout = setTimeout(() => setCharIdx((c) => c + 1), 42);
      } else {
        timeout = setTimeout(() => setPhase("hold"), 1800);
      }
    } else if (phase === "hold") {
      timeout = setTimeout(() => setPhase("erasing"), 400);
    } else {
      if (charIdx > 0) {
        timeout = setTimeout(() => setCharIdx((c) => c - 1), 22);
      } else {
        setWordIdx((w) => (w + 1) % WORDS.length);
        setPhase("typing");
      }
    }
    return () => clearTimeout(timeout);
  }, [charIdx, phase, wordIdx]);

  // Noise words cycling
  useEffect(() => {
    const id = setInterval(() => setNoiseIdx((n) => (n + 1) % NOISE_WORDS.length), 2800);
    return () => clearInterval(id);
  }, []);

  // Visibility
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Canvas: horizontal waveform EQ bars
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    const BARS = 80;
    const barW = W / BARS;
    let t = 0, animId: number;

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      t += 0.03;
      for (let i = 0; i < BARS; i++) {
        const x = i * barW + barW / 2;
        const h = (
          Math.sin(t + i * 0.18) * 0.3 +
          Math.sin(t * 1.7 + i * 0.09) * 0.25 +
          Math.sin(t * 0.5 + i * 0.4) * 0.2 +
          0.25
        ) * H * 0.85;

        const alpha = 0.22 + Math.sin(t + i * 0.2) * 0.15;
        const g = ctx!.createLinearGradient(x, H/2 - h/2, x, H/2 + h/2);
        g.addColorStop(0,   `rgba(201,168,83,0)`);
        g.addColorStop(0.3, `rgba(201,168,83,${alpha})`);
        g.addColorStop(0.5, `rgba(232,197,109,${alpha * 1.4})`);
        g.addColorStop(0.7, `rgba(212,135,90,${alpha})`);
        g.addColorStop(1,   `rgba(15,147,136,0)`);

        ctx!.fillStyle = g;
        ctx!.fillRect(x - barW*0.3, H/2 - h/2, barW*0.6, h);
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  const currentWord = WORDS[wordIdx].slice(0, charIdx);

  return (
    <section ref={containerRef} className="relative overflow-hidden py-32 sm:py-48">
      {/* Full-bleed amber + teal gradient */}
      <div className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(201,168,83,0.14) 0%, rgba(15,147,136,0.05) 60%, transparent 80%)",
          opacity: visible ? 1 : 0,
          transition: "opacity 1.4s ease",
        }}
      />

      {/* Waveform canvas */}
      <canvas ref={canvasRef} className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-48 opacity-60" />

      {/* Horizontal line (amber to teal) */}
      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(201,168,83,0.4) 30%, rgba(15,147,136,0.4) 70%, transparent 100%)" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 text-center">
        {/* Over-line */}
        <div className="font-mono text-[11px] tracking-[0.2em] text-[#52527a] uppercase mb-12"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.3s" }}>
          {NOISE_WORDS[noiseIdx]}
        </div>

        {/* Main typewriter headline */}
        <div className="min-h-[120px] sm:min-h-[160px] flex items-center justify-center mb-8">
          <h2 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-[-0.04em] leading-none"
            style={{
              color: "#f0ece3",
              opacity: visible ? 1 : 0,
              transition: "opacity 0.8s ease 0.5s",
              textShadow: "0 0 80px rgba(201,168,83,0.25)",
            }}
          >
            {currentWord}
            <span className="type-cursor" />
          </h2>
        </div>

        {/* Sub copy */}
        <p className="text-lg sm:text-xl text-[#6b6b8a] max-w-xl mx-auto font-light leading-relaxed"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.7s" }}>
          While you were living your life, Xanthra Horizon was watching the entire AI world.
          <br />Every development ranked, explained, and waiting in your inbox.
        </p>
      </div>
    </section>
  );
}
