import { DomainSearch } from '@/components/domain-search';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-12 py-16">
      <div className="text-center flex flex-col gap-4">
        <h1 className="text-5xl font-bold">Your identity on Partisia Blockchain</h1>
        <p className="text-xl text-muted-foreground max-w-lg">
          Register a <span className="font-semibold text-primary">.mpc</span> domain name and take control of your Web3 identity.
        </p>
      </div>
      <DomainSearch />
    </div>
  );
}
