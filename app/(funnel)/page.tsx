import { Apply } from "@/components/sections/apply";
import { Closing } from "@/components/sections/closing";
import { Faq } from "@/components/sections/faq";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Mentor } from "@/components/sections/mentor";
import { Promises } from "@/components/sections/promises";
import { Story } from "@/components/sections/story";
import { StickyCta } from "@/components/ui/sticky-cta";
import { COPY } from "@/content/copy";

/** Offer → proof (head mentor, numbers, seats) → promises → process → the founder's why → form. */
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Mentor />
        <Promises />
        <HowItWorks />
        <Story />
        <Apply />
        <Faq />
        <Closing />
      </main>
      <Footer />
      <StickyCta label={COPY.stickyCta} />
    </>
  );
}
