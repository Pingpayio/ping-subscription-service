
import React from 'react';

// CSS-in-JS styles for the carousel, provided to the page as a <style> tag.
export const CarouselStyles: React.FC = () => (
  <style>
    {`
      @media (max-width: 768px) {
        .carousel-item,
        .carousel-item img {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        .token-mask,
        .token-image {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
      }

      /* Enhanced global carousel styling with GPU acceleration */
      .carousel-item,
      .carousel-item img,
      .carousel-slide img,
      .carousel-slide,
      .carousel-slide > div,
      .token-mask,
      .token-image {
        background-color: transparent !important;
        background: transparent !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        -webkit-box-shadow: none !important;
        image-rendering: -webkit-optimize-contrast;
        transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      .carousel-item,
      .carousel-item img {
        display: flex !important;
        min-height: 180px !important;
      }

      img {
        background-color: transparent !important;
        mix-blend-mode: normal !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        image-rendering: -webkit-optimize-contrast;
        transform: translateZ(0);
        backface-visibility: hidden;
      }

      .token-mask {
        width: 180px;
        height: 180px;
        border-radius: 50%;
        overflow: hidden;
        display: flex !important;
        align-items: center;
        justify-content: center;
        background-color: transparent !important;
        position: relative;
        visibility: visible !important;
        opacity: 1 !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
      }

      /* Remove the inner mask that may be causing the faint line */
      .token-mask::after,
      .token-mask::before {
        display: none !important;
        content: none !important;
      }

      /* Ensure all token images have consistent size */
      .token-image {
        width: 75% !important;
        height: 75% !important;
        max-width: 75% !important;
        max-height: 75% !important;
        object-fit: contain !important;
        position: absolute !important;
        left: 50% !important;
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
        visibility: visible !important;
        opacity: 1 !important;
        display: block !important;
        background-color: transparent !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        mix-blend-mode: normal !important;
      }
    `}
  </style>
);

// Style objects for use in inline React styles elsewhere
export const containerStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  boxShadow: 'none',
  borderRadius: '0',
  display: 'flex',
  visibility: 'visible',
  opacity: 1,
  padding: 0,
  margin: 0,
};

export const imageContainerStyle: React.CSSProperties = {
  ...containerStyle,
  padding: '0',
  margin: '0',
  background: 'transparent',
  backgroundColor: 'transparent',
  isolation: 'isolate',
  position: 'relative',
  width: '180px',
  height: '180px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  borderRadius: '50%',
  visibility: 'visible',
  opacity: 1,
  border: 'none',
  outline: 'none',
  boxShadow: 'none',
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
};

export const imageStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  boxShadow: 'none',
  width: '75%',
  height: '75%',
  objectFit: 'contain',
  display: 'block',
  mixBlendMode: 'normal' as const, // Ensures TS compatibility
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%) translateZ(0)',
  visibility: 'visible',
  opacity: 1,
  padding: 0,
  margin: 0,
  imageRendering: '-webkit-optimize-contrast',
  backfaceVisibility: 'hidden',
};
