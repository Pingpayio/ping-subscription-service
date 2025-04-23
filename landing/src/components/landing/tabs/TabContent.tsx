
import React from "react";

interface TabContentProps {
  activeTab: string;
  tab: string;
  position: "left" | "right";
  children: React.ReactNode;
  className?: string;
}

const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  tab,
  position,
  children,
  className = ""
}) => {
  if (activeTab !== tab) return null;

  const alignmentClass = position === "left" 
    ? "text-left w-full md:w-1/2 pl-0" 
    : "text-right w-full md:w-1/2 ml-auto pr-0";

  return (
    <div className={`text-[#AB9FF2] text-sm md:text-base font-medium leading-6 ${alignmentClass} whitespace-normal ${className}`}>
      {children}
    </div>
  );
};

export default TabContent;
