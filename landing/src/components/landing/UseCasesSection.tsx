
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import UseCasesCarousel from "./UseCasesCarousel";
import ComingSoonButton from "./ComingSoonButton";
import SectionHeader from "./SectionHeader";

const UseCasesSection: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <section 
      id="use-cases"
      className="w-full flex flex-col items-center pt-12 md:pt-28 pb-12 md:pb-20 px-4 md:px-10 relative z-10 overflow-hidden"
      style={{
        minHeight: isMobile ? "auto" : "900px",
        backgroundColor: "#100713"
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
        
        {/* "Coming Soon" button */}
        <div className="flex justify-center mt-8 md:mt-16">
          <ComingSoonButton />
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
