"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { playConfettiBurst } from "@/components/request/report-celebration";

const arrivals = new Set<string>();
const recent: { key: string; at: number } = { key: "", at: 0 };

function stripCelebrate(router: { replace: (href: string, opts: { scroll: boolean }) => void }) {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("celebrate")) return;
  url.searchParams.delete("celebrate");
  const next = `${url.pathname}${url.search}${url.hash}`;
  // Update the address bar now so a refresh does not replay. Sync Next after
  // the burst; an immediate router.replace was tearing the canvas down.
  History.prototype.replaceState.call(window.history, window.history.state, "", next);
  window.setTimeout(() => {
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) {
      return;
    }
    router.replace(next, { scroll: false });
  }, 3000);
}

/**
 * One burst per View Board landing, and one burst each time a card enters
 * Paid. ?celebrate= is removed so a refresh does not replay either one.
 * The canvas ignores clicks, so the arrows stay usable.
 */
export function BoardConfetti({
  active,
  kind,
}: {
  active: boolean;
  kind: "arrival" | "paid" | null;
}) {
  const router = useRouter();
  const played = React.useRef<string | null>(null);

  React.useEffect(() => {
    const path = window.location.pathname;
    return () => {
      window.setTimeout(() => {
        if (window.location.pathname !== path) arrivals.delete(path);
      }, 0);
    };
  }, []);

  React.useEffect(() => {
    if (!active || !kind) {
      played.current = null;
      return;
    }

    const path = window.location.pathname;
    const signature = `${kind}:${path}:${window.location.search}`;
    if (played.current === signature) return;

    const now = Date.now();
    const repeat = recent.key === signature && now - recent.at < 400;
    if (kind === "arrival" && arrivals.has(path)) {
      stripCelebrate(router);
      played.current = signature;
      return;
    }
    if (repeat) return;

    recent.key = signature;
    recent.at = now;
    played.current = signature;
    if (kind === "arrival") arrivals.add(path);
    playConfettiBurst();
    stripCelebrate(router);
  }, [active, kind, router]);

  return null;
}
