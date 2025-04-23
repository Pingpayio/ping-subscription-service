
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import CarouselImage from "./CarouselImage";

export interface UseCaseCardProps {
  title: string;
  description: string;
  imageSrc: string;
  bgColor?: string; 
  textColor?: string;
}

const UseCaseCard: React.FC<UseCaseCardProps> = ({
  title,
  description,
  imageSrc,
  textColor = "text-[#3D315E]"
}) => {
  // Use a consistent gradient background for all cards
  const bgColor = "bg-gradient-to-br from-[#e5deff] to-[#f3eaff]";
  return (
    <Card className={`h-full border-0 shadow-none ${bgColor} overflow-hidden rounded-3xl`}>
      <CardContent className="py-5 px-4 flex flex-col items-center text-center h-full">
        <div className="rounded-2xl w-full aspect-square mb-4 flex items-center justify-center bg-transparent relative min-h-[160px]">
          <CarouselImage
            src={imageSrc}
            alt={title}
            className="w-[95%] h-[95%] object-contain relative z-10"
            width={160}
            height={160}
            style={{
              visibility: "visible",
              opacity: 1,
              display: "block"
            }}
          />
        </div>
        <h3 className={`text-xl font-semibold ${textColor} mb-1 whitespace-normal break-words`}>{title}</h3>
        <p className="text-[#4A4A4A] text-sm whitespace-normal break-words max-h-[4.5em] line-clamp-3">{description}</p>
      </CardContent>
    </Card>
  );
};

export default UseCaseCard;
