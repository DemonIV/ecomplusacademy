import Image from "next/image";
import fullLogo from "@/components/brand/assets/logo.png";
import markImage from "@/components/brand/assets/mark.png";
import wordmarkImage from "@/components/brand/assets/wordmark.png";
import { BRAND } from "@/content/brand";

/**
 * Ecom Plus Academy logo, cut out of the client's artwork by
 * `scripts/brand-assets.mjs`. PNGs are served as-is (no re-encoding of the
 * metallic gradients).
 *
 * - `horizontal` (header, panel): mark + "ECOM PLUS"; the tiny "ACADEMY"
 *   line is real text so it stays crisp at header size. Every size is in em
 *   of one font-size, so the lockup scales as a whole: 26px tall on small
 *   phones (logo and the header button share a 360px line), 30px from
 *   380px, 34px from `sm`; under 360px only the mark is left.
 * - `stacked` (footer, sign-in): the original composition.
 */
export function Logo({
  variant = "horizontal",
  className = "",
  eager = false,
}: {
  variant?: "horizontal" | "stacked";
  className?: string;
  /** Above-the-fold use: skip lazy loading. */
  eager?: boolean;
}) {
  const loading = eager ? "eager" : "lazy";

  if (variant === "stacked") {
    return (
      <Image
        src={fullLogo}
        alt={BRAND.name}
        unoptimized
        loading={loading}
        className={`block h-auto select-none ${className || "w-44"}`}
        draggable={false}
      />
    );
  }

  // Breakpoints in rem so they sort with `sm` (40rem).
  return (
    <span
      role="img"
      aria-label={BRAND.name}
      className={`inline-flex items-center gap-[0.3em] text-[26px] select-none min-[23.75rem]:text-[30px] sm:text-[34px] ${className}`}
    >
      <Image src={markImage} alt="" unoptimized loading={loading} className="h-[1em] w-auto" draggable={false} />
      <span className="grid w-[4.53em] gap-[0.15em] max-[22.5rem]:hidden">
        <Image src={wordmarkImage} alt="" unoptimized loading={loading} className="h-auto w-full" draggable={false} />
        <span className="flex items-center gap-[0.8em] text-[length:max(0.25em,7px)] leading-none font-semibold text-silver">
          <span className="h-px flex-1 bg-gold/70" />
          <span className="-mr-[0.5em] tracking-[0.5em]">ACADEMY</span>
          <span className="h-px flex-1 bg-gold/70" />
        </span>
      </span>
    </span>
  );
}
