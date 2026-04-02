'use client';
import Link from 'next/link';
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="hsl(var(--primary))"/>
        <text x="5" y="20" fontSize="16" fontWeight="bold" fill="white">M</text>
      </svg>
      MetaNames
    </Link>
  );
}
