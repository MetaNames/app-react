"use client";

import { useEffect, useRef, useState } from "react";

interface Stats {
  domainCount: number;
  ownerCount: number;
}

function useCountUp(target: number | null, duration = 900): number {
  const [value, setValue] = useState(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window.matchMedia === "function") {
      reducedMotion.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
    }
  }, []);

  useEffect(() => {
    if (target == null) return;
    if (reducedMotion.current) {
      const instant = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(instant);
    }
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

const formatCount = (n: number) => n.toLocaleString("en-US");

export function DomainStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/domains/stats")
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("bad status")),
      )
      .then((data: Stats) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const domains = useCountUp(stats?.domainCount ?? null);
  const owners = useCountUp(stats?.ownerCount ?? null);

  if (!stats || (stats.domainCount === 0 && stats.ownerCount === 0))
    return null;

  return (
    <dl
      className="glass-panel flex items-stretch rounded-2xl px-2 animate-fade-up"
      aria-label="Network statistics"
    >
      {/*
        `dt` precedes `dd` in the DOM to stay valid description-list markup;
        `flex-col-reverse` puts the figure above its label visually.
      */}
      <div className="flex flex-col-reverse items-center px-8 py-4">
        <dt className="text-[10px] tracking-[0.2em] text-muted-foreground">
          DOMAINS
        </dt>
        <dd className="text-2xl font-extrabold text-primary-glow tabular-nums">
          {formatCount(domains)}
        </dd>
      </div>
      <div className="w-px my-4 bg-border/60" aria-hidden="true" />
      <div className="flex flex-col-reverse items-center px-8 py-4">
        <dt className="text-[10px] tracking-[0.2em] text-muted-foreground">
          OWNERS
        </dt>
        <dd className="text-2xl font-extrabold text-primary-glow tabular-nums">
          {formatCount(owners)}
        </dd>
      </div>
    </dl>
  );
}
