"use client";

import * as React from "react";

const COLORS = ["#0d9488", "#f59e0b", "#f43f5e", "#0ea5e9", "#a3e635"];
const PIECES = 140;
const DURATION_MS = 2800;

/**
 * One-shot confetti burst for a freshly analysed check-in. Canvas-only, no
 * dependencies; renders nothing when inactive or under reduced-motion.
 */
export function ReportCelebration({ active }: { active: boolean }) {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!active) return;
    try {
      sessionStorage.removeItem("vf-checkin-submitted");
    } catch {
      // Ignore — flag simply won't persist.
    }
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);
    const pieces = Array.from({ length: PIECES }, () => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.25,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vy: 2.2 + Math.random() * 2.8,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.02 + Math.random() * 0.05,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    }));

    let frame = 0;
    const start = performance.now();
    function tick(now: number) {
      if (!canvas || !context) return;
      if (now - start > DURATION_MS) {
        context.clearRect(0, 0, width, height);
        return;
      }
      context.clearRect(0, 0, width, height);
      for (const piece of pieces) {
        piece.y += piece.vy;
        piece.sway += piece.swaySpeed;
        piece.rotation += piece.spin;
        piece.x += Math.sin(piece.sway) * 1.2;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.rotation);
        context.fillStyle = piece.color;
        context.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
        context.restore();
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      context.clearRect(0, 0, width, height);
    };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
}
