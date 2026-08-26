import { Search, Link2, Coins } from "lucide-react";

const steps = [
  {
    Icon: Search,
    title: "Search",
    body: "Find your perfect .mpc name",
  },
  {
    Icon: Coins,
    title: "Register",
    body: "Pay in your favorite token, minted on-chain",
  },
  {
    Icon: Link2,
    title: "Link",
    body: "Add social profiles, avatars & records",
  },
];

export function HowItWorks() {
  return (
    <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto w-full px-4">
      {steps.map(({ Icon, title, body }, index) => (
        <li
          key={title}
          className="glass-panel rounded-2xl p-5 flex flex-col gap-3 transition-colors hover:border-primary/40"
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-glow"
              aria-hidden="true"
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-bold text-sm">{title}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {body}
          </p>
        </li>
      ))}
    </ol>
  );
}
