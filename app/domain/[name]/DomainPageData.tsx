import { getDomainData } from "@/lib/data/domain";
import type { Domain } from "@/lib/types";

interface DomainPageDataProps {
  name: string;
  children: (domain: Domain | null) => React.ReactNode;
}

export async function DomainPageData({ name, children }: DomainPageDataProps) {
  const domain = await getDomainData(name);
  return <>{children(domain)}</>;
}
