import { Apply } from "@/components/sections/apply";
import { Capacity } from "@/components/sections/capacity";
import { Faq } from "@/components/sections/faq";
import { Footer } from "@/components/sections/footer";
import { Founder } from "@/components/sections/founder";
import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { Program } from "@/components/sections/program";
import { Results } from "@/components/sections/results";
import { Testimonials } from "@/components/sections/testimonials";
import { StickyCta } from "@/components/ui/sticky-cta";
import { COPY } from "@/content/copy";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Testimonials />
        <Founder />
        <Results />
        <Program />
        <Capacity />
        <Apply />
        <Faq />
      </main>
      <Footer />
      <StickyCta label={COPY.stickyCta} />
    </>
  );
}
