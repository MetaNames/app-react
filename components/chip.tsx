'use client';
import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
interface ChipProps {
  label: string;
  value?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'available' | 'registered';
  className?: string;
}
export function Chip({ label, value, href, onClick, variant = 'default', className }: ChipProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (value) { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  };
  const variantClass = {
    default: 'bg-muted text-muted-foreground',
    available: 'bg-[hsl(var(--chip-available-bg))] text-[hsl(var(--chip-available-fg))]',
    registered: 'bg-[hsl(var(--chip-registered-bg))] text-[hsl(var(--chip-registered-fg))]',
  }[variant];
  const content = (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity', variantClass, className)}>
      <span className="text-xs opacity-70">{label}</span>
      {value && <span className="font-semibold">{value}</span>}
      {href ? <ExternalLink className="h-3 w-3 opacity-60" /> : value ? (copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3 opacity-60" />) : null}
    </span>
  );
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
  if (onClick) return <button onClick={onClick}>{content}</button>;
  return <button onClick={handleCopy}>{content}</button>;
}
