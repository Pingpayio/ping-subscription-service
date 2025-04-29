import React from "react";
import { motion } from "framer-motion";

interface TabIndicatorProps {
  activeTab: string;
  tabCount: number;
  indicatorClass?: string;
  backgroundClass?: string;
}

const TabIndicator: React.FC<TabIndicatorProps> = ({
  activeTab,
  tabCount,
  indicatorClass = "bg-[#AB9FF2]",
  backgroundClass = "bg-[#2A2A37]",
}) => {
  const position =
    activeTab === "supply" ? "0%" : `${(100 / tabCount) * (tabCount - 1)}%`;
  const width = `${100 / tabCount}%`;

  return (
    <div className={`${backgroundClass} mt-3.5 w-full h-0.5 relative`}>
      <motion.div
        className={`${indicatorClass} absolute h-full`}
        initial={{ width, left: position }}
        animate={{ width, left: position }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </div>
  );
};

export default TabIndicator;
