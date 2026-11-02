import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { PRIVACY } from "@/content/legal";

export const metadata: Metadata = { title: PRIVACY.title };

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}
