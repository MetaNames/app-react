import { config } from "@/lib/config";
export function Footer() {
  const links = [
    { label: "Landing", href: config.landingUrl },
    { label: "Docs", href: "https://docs.metanames.app" },
    { label: "Telegram", href: "https://t.me/mpc_metanames" },
    { label: "Twitter", href: "https://x.com/metanames_" },
    { label: "GitHub", href: "https://github.com/metanames" },
  ];
  return (
    <footer className="border-t border-border/60 mt-auto py-6 relative z-10">
      <div className="container mx-auto px-4 flex flex-wrap gap-4 justify-center font-mono">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors tracking-wide"
          >
            {l.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
