
import React from "react";

interface SectionHeaderProps {
  title: string;
  description: string;
  titleColor?: string; // Optional title color override
  descriptionColor?: string; // Optional description color override
  centered?: boolean; // Whether the header should be centered
  maxWidth?: string; // Optional max width for title and description
  className?: string; // Additional custom classes
  titleClassName?: string; // Custom classes for title
  descriptionClassName?: string; // Custom classes for description
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  description, 
  titleColor = "#AB9FF2", 
  descriptionColor = "#AB9FF2",
  centered = true,
  maxWidth = "full",
  className = "",
  titleClassName = "",
  descriptionClassName = ""
}) => {
  return (
    <div className={`flex flex-col ${centered ? 'items-center' : 'items-start'} ${className}`}>
      <h2 
        className={`text-2xl md:text-4xl font-bold leading-relaxed ${centered ? 'text-center' : 'text-left'} max-w-${maxWidth} mt-0 ${titleClassName}`}
        style={{ color: titleColor }}
      >
        {title}
      </h2>
      <p 
        className={`text-base md:text-xl font-normal leading-normal md:leading-none ${centered ? 'text-center' : 'text-left'} mt-2 max-w-${maxWidth} px-4 ${descriptionClassName}`}
        style={{ color: descriptionColor }}
      >
        {description}
      </p>
    </div>
  );
};

export default SectionHeader;
