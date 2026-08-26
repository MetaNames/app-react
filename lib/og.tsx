import { toSvg } from "jdenticon";

/**
 * Open Graph cards for domain routes.
 *
 * A .mpc name is mostly shared as a bare link, so the unfurled card is often
 * the first thing anyone sees of a domain. Rendering the same identicon the
 * app uses, plus the name and its availability, makes a pasted link
 * self-describing instead of showing the generic site card.
 *
 * Satori (behind `next/og`) supports only a flexbox subset of CSS and no
 * Tailwind, so these colours are the design tokens from `globals.css`
 * transcribed to hex. Keep them in sync by hand — a token change that is not
 * mirrored here shows up only in the unfurled card.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BACKGROUND = "#07070c"; // --background: hsl(240 22% 3%)
const FOREGROUND = "#eeeef4"; // --foreground: hsl(240 20% 94%)
const MUTED = "#8b8b9e"; // --muted-foreground: hsl(240 11% 60%)
const PRIMARY = "#6c4bf7"; // --primary: hsl(249 91% 63%)
const PRIMARY_GLOW = "#9c7bff"; // --primary-glow: hsl(249 100% 74%)
const AVAILABLE = "#3ddc97";

/**
 * The identicon is generated as SVG and inlined as a data URI: Satori can
 * rasterise an `img`, but it cannot run the client-side `update()` the app
 * uses in the browser.
 */
function identiconDataUri(value: string, size: number): string {
  const svg = toSvg(value, size);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export interface OgCardProps {
  name: string;
  /** Small line above the name, e.g. "Registered domain". */
  eyebrow: string;
  /** Right-hand pill, e.g. "Available". Omitted when there is nothing to say. */
  badge?: { label: string; tone: "available" | "neutral" };
  /** Supporting line below the name. */
  detail?: string;
}

export function OgCard({ name, eyebrow, badge, detail }: OgCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: BACKGROUND,
        // Stands in for the app's `.spotlight-beam`, which relies on CSS
        // Satori does not implement.
        backgroundImage: `radial-gradient(circle at 50% 0%, ${PRIMARY}44 0%, ${BACKGROUND} 55%)`,
        padding: 72,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            background: PRIMARY_GLOW,
          }}
        />
        <div
          style={{
            color: MUTED,
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          MetaNames
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
        {/* next/image is a browser-runtime component; Satori rasterises plain
            HTML, so a raw <img> with an inline data URI is the only option
            here — and there is no network fetch to optimise anyway. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={identiconDataUri(name, 200)}
          width={200}
          height={200}
          alt=""
          style={{
            borderRadius: 32,
            border: `4px solid ${PRIMARY}66`,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div style={{ color: MUTED, fontSize: 28 }}>{eyebrow}</div>
          <div
            style={{
              color: FOREGROUND,
              // Long names would otherwise overflow the card; Satori has no
              // text-overflow, so the size steps down instead.
              fontSize: name.length > 24 ? 60 : name.length > 16 ? 76 : 96,
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            {name}
          </div>
          {detail && <div style={{ color: MUTED, fontSize: 26 }}>{detail}</div>}
        </div>
        {badge && (
          <div
            style={{
              display: "flex",
              padding: "14px 28px",
              borderRadius: 999,
              fontSize: 26,
              fontWeight: 700,
              color: badge.tone === "available" ? AVAILABLE : FOREGROUND,
              background:
                badge.tone === "available" ? `${AVAILABLE}22` : "#ffffff14",
              border: `2px solid ${
                badge.tone === "available" ? `${AVAILABLE}55` : "#ffffff22"
              }`,
            }}
          >
            {badge.label}
          </div>
        )}
      </div>

      <div style={{ color: MUTED, fontSize: 24 }}>
        Domain names on Partisia Blockchain
      </div>
    </div>
  );
}
