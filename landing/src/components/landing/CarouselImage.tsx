import React from "react";

interface CarouselImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

/**
 * Basic image component for use in carousels with optimized loading.
 */
const CarouselImage: React.FC<CarouselImageProps> = ({
  src,
  alt,
  className = "",
  width,
  height,
  style,
}) => (
  <img
    src={src}
    alt={alt}
    className={className}
    width={width}
    height={height}
    loading="lazy"
    style={{
      ...style,
      backgroundColor: "transparent",
      background: "transparent",
      border: "none",
      outline: "none",
      boxShadow: "none",
      mixBlendMode: "normal",
      transform: "translate3d(0, 0, 0)",
      imageRendering: "crisp-edges",
      backfaceVisibility: "hidden",
      padding: 0,
      margin: 0,
      filter: "none",
      WebkitFilter: "none",
      WebkitMaskImage: "none",
    }}
    draggable={false}
    decoding="async"
    fetchPriority="low"
  />
);

export default CarouselImage;
