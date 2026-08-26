import { DomainSearch } from "@/components/domain-search";
import { RecentDomainsTicker } from "@/components/recent-domains-ticker";
import { DomainStats } from "@/components/domain-stats";
import { HowItWorks } from "@/components/how-it-works";

export default function HomePage() {
  return (
    <div className="spotlight-beam flex flex-col items-center flex-1 gap-8 py-16 sm:py-20 w-full">
      <div className="relative z-10 text-center flex flex-col items-center gap-4 max-w-2xl mx-auto px-4 animate-fade-up">
        <span className="glass-panel rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.18em] uppercase text-muted-foreground">
          Partisia Blockchain
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-balance leading-[1.05]">
          Own your name on the{" "}
          <span className="text-primary-glow text-glow">Partisia</span>{" "}
          Blockchain
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground text-balance">
          One identity for everything you do on-chain
        </p>
      </div>
      <div className="relative z-10 w-full max-w-xl px-4">
        <DomainSearch />
      </div>
      {/*
        Ticker and stats are client-fetched and render nothing until their
        request resolves. Reserving their height here keeps the hero from
        jumping when they arrive, without giving either component a
        placeholder of its own.
      */}
      <div className="relative z-10 w-full min-h-9 flex items-start justify-center">
        <RecentDomainsTicker />
      </div>
      <div className="relative z-10 min-h-14 flex items-start">
        <DomainStats />
      </div>
      <div className="relative z-10 mt-6 w-full">
        <HowItWorks />
      </div>
    </div>
  );
}
