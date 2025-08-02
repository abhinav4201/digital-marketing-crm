import AboutSection from "./components/sections/AboutSection";
import CTASection from "./components/sections/CTASection";
import HeroSection from "./components/sections/HeroSection";
// import PortfolioSection from "./components/sections/PortfolioSection";
import ServicesSection from "./components/sections/ServicesSection";
import TeamSection from "./components/sections/TeamSection";
import TestimonialSection from "./components/sections/TestimonialSection";

export default function Home() {
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
      <CTASection />
    </div>
  );
}
