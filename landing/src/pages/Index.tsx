import React, { useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import FeatureSection from "@/components/landing/DiscoverSection";
import AnalyticsSection from "@/components/landing/AssetManagementSection";
import ApplicationsSection from "@/components/landing/UseCasesSection";
import { useIsMobile } from "@/hooks/use-mobile";

const HomePage: React.FC = () => {
  const isMobile = useIsMobile();
  const [gradientOption] = useState<number>(2); // Default to option 2
  const [scrollPosition, setScrollPosition] = useState(0);

  // Track scroll position for potential parallax or scroll-based effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Define gradient options
  const gradientOptions = {
    // Option 1: Smooth radial pulsing gradient
    1: {
      background: `radial-gradient(circle at 50% 50%, 
                  #C4B5FD 0%, #DDD6FE 30%, #EDE9FE 60%, #F5F2FF 90%)`,
      backgroundSize: "200% 200%",
      animation: "pulse-gradient 8s ease infinite",
    },

    // Option 2: Flowing color waves
    2: {
      background: `linear-gradient(45deg, 
                  #AB9FF2 0%, #C4B5FD 25%, #DDD6FE 50%, #EDE9FE 75%, #F5F2FF 100%)`,
      backgroundSize: "400% 400%",
      animation: "flowing-gradient 15s ease infinite",
    },

    // Option 3: Ambient color shift
    3: {
      background: `radial-gradient(circle at 50% 50%, 
                  #9B87F5 0%, #AB9FF2 30%, #C4B5FD 60%, #DDD6FE 90%)`,
      backgroundSize: "200% 200%",
      animation: "ambient-shift 20s ease-in-out infinite",
    },
  };

  // Select the current gradient option
  const gradientStyle =
    gradientOptions[gradientOption as keyof typeof gradientOptions];

  return (
    <div className="overflow-hidden">
      <Navbar />
      <main className="flex w-full flex-col items-center pt-[70px] md:pt-[100px] max-w-full min-h-screen relative">
        {/* Hero gradient background */}
        <div
          className="absolute top-0 left-0 w-full h-full z-0"
          style={gradientStyle}
        ></div>

        <div className="max-w-[1080px] w-full flex flex-col items-center px-4 md:px-6 relative z-10">
          <Hero />
        </div>

        {/* Sections with specific background colors */}
        <FeatureSection />
        <AnalyticsSection />
        <ApplicationsSection />
      </main>
    </div>
  );
};

export default HomePage;
