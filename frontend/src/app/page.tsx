import { AnimatedBackground } from "@/components/landing/animated-background";
import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsSection } from "@/components/landing/stats-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { SupportedInputsSection } from "@/components/landing/supported-inputs-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col selection:bg-primary/30 selection:text-primary">
      <AnimatedBackground />
      <Navbar />
      
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SupportedInputsSection />
        <TestimonialsSection />
      </main>

      <Footer />
    </div>
  );
}
