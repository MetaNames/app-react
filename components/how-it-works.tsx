const steps = [
  { icon: "🔍", title: "Search", body: "Find your perfect .mpc name" },
  {
    icon: "⛓️",
    title: "Register",
    body: "Pay in your favorite token, minted on-chain",
  },
  { icon: "🔗", title: "Link", body: "Add social profiles, avatars & records" },
];

export function HowItWorks() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto w-full px-4">
      {steps.map((s) => (
        <div key={s.title} className="glass-panel rounded-2xl p-5 text-center">
          <div className="text-2xl mb-2" aria-hidden="true">
            {s.icon}
          </div>
          <div className="font-bold text-sm mb-1">{s.title}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">
            {s.body}
          </div>
        </div>
      ))}
    </div>
  );
}
