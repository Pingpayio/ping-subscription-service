
import React, { useState } from "react";
import TabIndicator from "./tabs/TabIndicator";
import TabContent from "./tabs/TabContent";
import TabButton from "./tabs/TabButton";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";

type TabType = "supply" | "borrow";

const SupplyBorrowTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("supply");

  return (
    <div className="bg-[#100713] flex w-full max-w-[665px] flex-col items-stretch mt-8 md:mt-[66px] py-[5px] rounded-lg px-4 md:px-0">
      <div className="relative w-full">
        {/* Tab buttons container */}
        <div className="flex w-full">
          {/* Left tab - Receiving Payments */}
          <div className="w-1/2 text-center">
            <TabButton
              active={activeTab === "supply"}
              onClick={() => setActiveTab("supply")}
            >
              Receiving Payments
            </TabButton>
          </div>
          
          {/* Right tab - Making Payments */}
          <div className="w-1/2 text-center">
            <TabButton
              active={activeTab === "borrow"}
              onClick={() => setActiveTab("borrow")}
            >
              Making Payments
            </TabButton>
          </div>
        </div>
        
        {/* Indicator bar */}
        <TabIndicator 
          activeTab={activeTab} 
          tabCount={2} 
        />
      </div>

      <div className="w-full flex mt-[25px]">
        <TabContent 
          activeTab={activeTab} 
          tab="supply" 
          position="left"
        >
          Always receive your preferred asset. Accept universal crypto payments with zero custody, instant peer-to-peer payments, and drastically lower fees.
        </TabContent>
        
        <TabContent 
          activeTab={activeTab} 
          tab="borrow" 
          position="right"
        >
          Pay Your Way. Removing the complexity and friction of different currencies, blockchains or wallets. Global payments made simple with the power of Ping.
        </TabContent>
      </div>
    </div>
  );
};

export default SupplyBorrowTabs;
