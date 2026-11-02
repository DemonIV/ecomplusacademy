import { Apply } from "@/components/sections/apply";
import { Closing } from "@/components/sections/closing";
import { Coach } from "@/components/sections/coach";
import { Faq } from "@/components/sections/faq";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Promises } from "@/components/sections/promises";
import { Story } from "@/components/sections/story";
import { StickyCta } from "@/components/ui/sticky-cta";
import { COPY } from "@/content/copy";

/** Order from the client's brief: promise → proof (story) → process → coach & seats → form. */
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Promises />
        <Story />
        <HowItWorks />
        <Coach />
        <Apply />
        <Faq />
        <Closing />
      </main>
      <Footer />
      <StickyCta label={COPY.stickyCta} />
    </>
  );
}
