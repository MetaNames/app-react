import { DomainSearch } from "@/components/domain-search";
import { RecentDomainsTicker } from "@/components/recent-domains-ticker";
import { DomainStats } from "@/components/domain-stats";
import { HowItWorks } from "@/components/how-it-works";

export default function HomePage() {
  return (
    <div className="spotlight-beam flex flex-col items-center justify-center flex-1 gap-10 py-16 w-full">
      <div className="relative z-10 text-center flex flex-col gap-3 max-w-2xl mx-auto px-4 animate-fade-up">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-balance">
          Own your name on the Partisia Blockchain
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          One identity for everything you do on-chain
        </p>
      </div>
      <div className="relative z-10 w-full max-w-xl px-4">
        <DomainSearch />
      </div>
      <div className="relative z-10 w-full">
        <RecentDomainsTicker />
      </div>
      <div className="relative z-10">
        <DomainStats />
      </div>
      <div className="relative z-10 mt-4">
        <HowItWorks />
      </div>
    </div>
  );
}
