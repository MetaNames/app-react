'use client';
import { config } from '@/lib/config';
export function Footer() {
  const links = [
    { label: 'Landing', href: config.landingUrl },
    { label: 'Docs', href: 'https://docs.metanames.app' },
    { label: 'Telegram', href: 'https://t.me/mpc_metanames' },
    { label: 'Twitter', href: 'https://x.com/metanames_' },
    { label: 'GitHub', href: 'https://github.com/metanames' },
  ];
  return (
    <footer className="border-t border-border mt-auto py-6">
      <div className="container mx-auto px-4 flex flex-wrap gap-4 justify-center">
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
        ))}
      </div>
    </footer>
  );
}
