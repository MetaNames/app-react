import { DomainSearch } from "@/components/domain-search";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8">
      <div className="text-center flex flex-col gap-4 max-w-2xl mx-auto px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          Your identity on Partisia Blockchain
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Register a <span className="font-semibold text-primary">.mpc</span>{" "}
          domain name and take control of your Web3 identity.
        </p>
      </div>
      <div className="w-full max-w-xl px-4">
        <DomainSearch />
      </div>
    </div>
  );
}
