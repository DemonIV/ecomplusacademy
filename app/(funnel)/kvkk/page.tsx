import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { KVKK } from "@/content/legal";

export const metadata: Metadata = { title: KVKK.title };

export default function KvkkPage() {
  return <LegalPage doc={KVKK} />;
}
