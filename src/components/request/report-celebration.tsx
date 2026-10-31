"use client";

import * as React from "react";

const COLORS = ["#0d9488", "#f59e0b", "#f43f5e", "#0ea5e9", "#a3e635"];
const PIECES = 140;
const DURATION_MS = 2800;

/**
 * One falling burst. Canvas is pointer-events-none so controls stay usable.
 * Skips entirely when the user prefers reduced motion. Returns a stop
 * function; callers that must finish the burst should ignore it.
 */
export function playConfettiBurst(): () => void {
  if (typeof window === "undefined") return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "pointer-events-none fixed inset-0 z-[60] h-full w-full";
  document.body.appendChild(canvas);
  const context = canvas.getContext("2d");
  if (!context) {
    canvas.remove();
    return () => {};
  }
  const draw = context;

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
  let stopped = false;
  let elapsed = 0;
  let last = performance.now();
  function stop() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    canvas.remove();
  }
  function tick(now: number) {
    if (stopped) return;
    const gap = now - last;
    last = now;
    // Ignore long pauses (a hidden tab, or a stalled frame) so the burst
    // still plays when the page is visible again.
    if (gap > 0 && gap < 80) elapsed += gap;
    if (elapsed > DURATION_MS) {
      stop();
      return;
    }
    draw.clearRect(0, 0, width, height);
    for (const piece of pieces) {
      piece.y += piece.vy;
      piece.sway += piece.swaySpeed;
      piece.rotation += piece.spin;
      piece.x += Math.sin(piece.sway) * 1.2;
      draw.save();
      draw.translate(piece.x, piece.y);
      draw.rotate(piece.rotation);
      draw.fillStyle = piece.color;
      draw.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      draw.restore();
    }
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return stop;
}

/**
 * One-shot confetti burst for a freshly analysed check-in. Canvas-only, no
 * dependencies; renders nothing when inactive or under reduced-motion.
 */
export function ReportCelebration({ active }: { active: boolean }) {
  React.useEffect(() => {
    if (!active) return;
    try {
      sessionStorage.removeItem("vf-checkin-submitted");
    } catch {
      // Ignore — flag simply won't persist.
    }
    return playConfettiBurst();
  }, [active]);

  return null;
}
