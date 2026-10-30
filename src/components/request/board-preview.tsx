"use client";

import * as React from "react";

const IDLE_MS = 15_000;

export function BoardPreview() {
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let timer = 0;
    let towardsEnd = true;
    let animating = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const overflows = () => el.scrollWidth > el.clientWidth + 1;

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(step, IDLE_MS);
    };

    const cancelMove = () => {
      if (!animating) return;
      animating = false;
      const left = el.scrollLeft;
      el.scrollTo({ left, behavior: "auto" });
    };

    const step = () => {
      if (overflows()) {
        const max = Math.max(0, el.scrollWidth - el.clientWidth);
        const left = towardsEnd ? max : 0;
        towardsEnd = !towardsEnd;
        animating = true;
        el.scrollTo({
          left,
          behavior: motion.matches ? "auto" : "smooth",
        });
      }
      schedule();
    };

    const pause = () => {
      cancelMove();
      schedule();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.buttons > 0) pause();
    };

    const onScroll = () => {
      if (animating) return;
      pause();
    };

    const onScrollEnd = () => {
      animating = false;
    };

    schedule();
    el.addEventListener("pointerdown", pause);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("wheel", pause, { passive: true });
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", onScrollEnd);

    return () => {
      window.clearTimeout(timer);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("wheel", pause);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", onScrollEnd);
    };
  }, []);

  return (
    <figure className="mt-8 max-w-full">
      <div
        ref={scrollerRef}
        className="max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/board-preview.png"
          alt="Property board with 2 requested, 2 in progress, 2 completed, and 2 paid. Completed cards include Pay now."
          width={1200}
          height={768}
          className="h-auto w-[1200px] max-w-none lg:w-full"
        />
      </div>
    </figure>
  );
}
