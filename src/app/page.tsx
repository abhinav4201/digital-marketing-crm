import AboutSection from "./components/sections/AboutSection";
import CTASection from "./components/sections/CTASection";
import HeroSection from "./components/sections/HeroSection";
// import PortfolioSection from "./components/sections/PortfolioSection";
import ServicesSection from "./components/sections/ServicesSection";
import TeamSection from "./components/sections/TeamSection";
import TestimonialSection from "./components/sections/TestimonialSection";
import { shouldShowDynamicCTA } from "./utils/timeBasedVisibility";

export default function Home() {
  const showCTA = shouldShowDynamicCTA();

  return (
    <div>
      <HeroSection />
      <div id='services'>
        <ServicesSection />
      </div>
      <div id='about'>
        <AboutSection />
      </div>
      <div id='testimonial'>
        <TestimonialSection />
      </div>
      {/* <div id='portfolio'>
        <PortfolioSection />
      </div> */}
      <div id='team'>
        <TeamSection />
      </div>
      {showCTA && <CTASection />}
    </div>
  );
}
