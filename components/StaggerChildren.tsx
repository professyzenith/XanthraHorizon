"use client";
import { useEffect, useRef, ReactNode, Children } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  staggerMs?: number;
  baseDelay?: number;
}

export default function StaggerChildren({
  children, className = "", staggerMs = 80, baseDelay = 0,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const kids = Array.from(el.children) as HTMLElement[];
    kids.forEach((child, i) => {
      child.style.opacity = "0";
      child.style.transform = "translateY(28px)";
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          kids.forEach((child, i) => {
            const delay = baseDelay + i * staggerMs;
            setTimeout(() => {
              child.style.transition =
                "opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1)";
              child.style.opacity = "1";
              child.style.transform = "translateY(0px)";
            }, delay);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [baseDelay, staggerMs]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
