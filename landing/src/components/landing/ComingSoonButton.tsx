
import React from "react";
import { Timer } from "lucide-react";

const ComingSoonButton: React.FC = () => {
  return (
    <button className="bg-[#AB9FF2] border h-[56px] w-[219px] flex items-center justify-center gap-2 text-[#3D315E] font-medium text-center px-4 py-2 rounded-[30px] border-[#AB9FF2] border-solid cursor-pointer whitespace-nowrap hover:bg-[#9B87F5] hover:scale-105 transition-all duration-300">
      <span className="text-sm md:text-base">Coming Soon</span>
      <Timer size={16} className="md:size-18" />
    </button>
  );
};

export default ComingSoonButton;
