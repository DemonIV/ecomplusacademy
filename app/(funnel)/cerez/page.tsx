import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { COOKIES } from "@/content/legal";

export const metadata: Metadata = { title: COOKIES.title };

export default function CookiePage() {
  return <LegalPage doc={COOKIES} />;
}
