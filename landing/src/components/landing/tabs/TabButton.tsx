
import React from "react";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  activeClass?: string;
  inactiveClass?: string;
}

const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  children,
  className = "",
  activeClass = "text-[#AB9FF2]",
  inactiveClass = "text-[#2A2A37]"
}) => {
  return (
    <button
      onClick={onClick}
      className={`leading-loose cursor-pointer transition-colors text-base md:text-lg font-semibold whitespace-nowrap ${active ? activeClass : inactiveClass} ${className}`}
    >
      {children}
    </button>
  );
};

export default TabButton;
