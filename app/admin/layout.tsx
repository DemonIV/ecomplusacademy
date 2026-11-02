import type { Metadata } from "next";

/**
 * Admin panel: every page reads the session cookie, so the whole segment
 * renders per request and is allowed to block (no static shell). Each page
 * repeats `instant = false`: a layout's opt-out does not cover navigations
 * between the pages below it.
 */
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="text-[0.95rem]">{children}</div>;
}
