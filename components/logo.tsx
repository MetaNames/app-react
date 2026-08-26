import Link from "next/link";

export function LogoMark({
  size = 26,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={(size * 250) / 430}
      height={size}
      viewBox="275 35 250 430"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M400,46.88c-65.52,0-118.63,53.11-118.63,118.63v72.81c25.72,0,46.58-20.85,46.58-46.58v-29.28c0-39.48,32-71.48,71.48-71.48h1.14c39.48,0,71.48,32,71.48,71.48v7.85c0,11.55-4.3,22.7-12.06,31.25l-92.93,102.46c-17.28,19.05-15.85,48.51,3.21,65.79l120.6-132.55c17.86-19.63,27.76-45.22,27.76-71.77C518.63,99.99,465.52,46.88,400,46.88z"
      />
      <path
        fill="currentColor"
        d="M400,452.99c65.52,0,118.63-53.11,118.63-118.63v-72.81c-25.72,0-46.58,20.85-46.58,46.58v29.28c0,39.48-32,71.48-71.48,71.48h-1.14c-39.48,0-71.48-32-71.48-71.48v-7.85c0-11.55,4.3-22.7,12.06-31.25l92.93-102.46c17.28-19.05,15.85-48.51-3.21-65.79L309.14,262.6c-17.86,19.63-27.76,45.22-27.76,71.77C281.37,399.88,334.48,452.99,400,452.99z"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight text-foreground"
    >
      <LogoMark
        size={30}
        className="text-primary drop-shadow-[0_0_10px_var(--glow)]"
      />
      metanames
    </Link>
  );
}
