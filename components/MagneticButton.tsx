"use client";
import React, { useRef, MouseEvent, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  strength?: number;
}

export default function MagneticButton({
  children, className = "", style, onClick, type = "button", disabled, strength = 0.35,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  function onMouseMove(e: MouseEvent<HTMLButtonElement>) {
    if (!ref.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    ref.current.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function onMouseLeave() {
    if (!ref.current) return;
    ref.current.style.transform = "translate(0px, 0px)";
    ref.current.style.transition = "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)";
  }

  function onMouseEnter() {
    if (!ref.current) return;
    ref.current.style.transition = "transform 0.1s ease";
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}
