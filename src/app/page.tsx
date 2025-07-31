import HeroSection from "./components/sections/HeroSection";
import ServicesSection from "./components/sections/ServicesSection";
import PortfolioSection from "./components/sections/PortfolioSection";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <div id='services'>
        <ServicesSection />
      </div>
      <div id='portfolio'>
        <PortfolioSection />
      </div>
    </div>
  );
}
