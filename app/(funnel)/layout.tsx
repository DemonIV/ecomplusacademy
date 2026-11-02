import { Suspense } from "react";
import { AttributionCapture } from "@/components/tracking/attribution-capture";
import { ConsentBanner } from "@/components/tracking/consent-banner";
import { MetaPixel } from "@/components/tracking/meta-pixel";
import { Clarity } from "@/components/tracking/clarity";
import { SmoothScroll } from "@/components/ui/smooth-scroll";

/**
 * Public funnel pages: tracking (after consent), smooth scroll, banner.
 * The private manage links (/randevu/*) and /admin live outside this
 * group, so their URLs never reach Meta.
 */
export default function FunnelLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <SmoothScroll />
      <AttributionCapture />
      <Suspense fallback={null}>
        <MetaPixel />
      </Suspense>
      <Clarity />
      <ConsentBanner />
    </>
  );
}
