
import React from "react";
import { Timer } from "lucide-react";

const ComingSoonButton: React.FC = () => {
  return (
    <button
      className="bg-[#AB9FF2] border h-auto min-h-[52px] max-h-[64px] w-full max-w-[260px] flex items-center justify-center gap-2 text-[#3D315E] font-medium text-center px-5 py-3 rounded-[30px] border-[#AB9FF2] border-solid cursor-pointer whitespace-pre-line break-words hover:bg-[#9B87F5] hover:scale-105 transition-all duration-300 shadow-md md:text-base text-sm"
      style={{
        wordBreak: "break-word",
        lineHeight: "1.2",
      }}
    >
      <span className="block md:text-base text-sm leading-snug whitespace-pre-line">
        Join Waitlist
      </span>
      <Timer size={18} className="md:size-18 flex-shrink-0" />
    </button>
  );
};

export default ComingSoonButton;
