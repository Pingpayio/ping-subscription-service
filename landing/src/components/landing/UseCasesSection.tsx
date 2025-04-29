import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import UseCasesCarousel from "./UseCasesCarousel";
import ComingSoonButton from "./ComingSoonButton";
import SectionHeader from "./SectionHeader";
import Footer from "./Footer";

const UseCasesSection: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <section
      id="use-cases"
      className="w-full flex flex-col items-center pt-12 md:pt-28 pb-0 md:pb-0 px-4 md:px-10 relative z-10 overflow-hidden"
      style={{
        minHeight: isMobile ? "auto" : "900px",
        backgroundColor: "#100713",
      }}
    >
      <div className="max-w-[1080px] mx-auto w-full h-full flex flex-col">
        <div className="text-center mb-12 md:mb-20">
          <SectionHeader
            title="Payments for All Use Cases"
            description=""
            maxWidth="full"
          />
        </div>

        <UseCasesCarousel />

        <div className="w-full flex flex-col items-center mt-8 md:mt-16 mb-4 md:mb-12">
          <SectionHeader
            title="Get Paid. Everywhere. Instantly."
            description="Send and Receive Payments from Any Chain, One Ping at a Time"
            centered={true}
            maxWidth="full"
          />
        </div>

        <div className="flex justify-center mt-6 md:mt-8 mb-16">
          <ComingSoonButton />
        </div>
      </div>
      {/* Footer: sticks to bottom of this section */}
      <Footer />
    </section>
  );
};

export default UseCasesSection;
