"use client";

interface ConnectionRequiredProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  address: string | undefined;
}

export function ConnectionRequired({
  children,
  fallback,
  address,
}: ConnectionRequiredProps) {
  if (!address)
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <p className="text-muted-foreground text-lg">
          Connect your wallet to continue
        </p>
      </div>
    );
  return <>{children}</>;
}
