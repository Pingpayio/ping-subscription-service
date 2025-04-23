
import React from "react";
import SupplyBorrowTabs from "./SupplyBorrowTabs";
import CryptoCarousel from "./CryptoCarousel";
import SectionHeader from "./SectionHeader";

const DiscoverSection: React.FC = () => {
  return (
    <section 
      id="discover-section"
      className="w-full flex flex-col items-center pt-12 md:pt-28 pb-12 md:pb-20 px-4 md:px-10 relative z-10" 
      style={{
        minHeight: "auto",
        maxHeight: "840px",
        backgroundColor: "#100713"
      }}
    >
      <div className="flex mb-6 md:mb-12 w-full max-w-[777px] flex-col items-center">
        <SectionHeader 
          title="Multi-currency Payment Support" 
          description="Settling cross-chain intents in seconds."
          centered={true}
          maxWidth="full"
        />
        
        {/* Cryptocurrency Carousel */}
        <div className="w-full my-6 md:my-12">
          <CryptoCarousel />
        </div>
        
        <SupplyBorrowTabs />
      </div>
    </section>
  );
};

export default DiscoverSection;
