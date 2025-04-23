
import React from 'react';
import { TokenInfo } from '@/types/token';
import { imageContainerStyle, imageStyle, containerStyle } from './CryptoCarouselStyles';
import CarouselImage from './CarouselImage';

interface TokenItemProps {
  token: TokenInfo;
  prefix: string;
}

const TokenItem: React.FC<TokenItemProps> = ({ token, prefix }) => {
  return (
    <div
      key={`${prefix}-${token.id}`}
      className="shrink-0 pl-4 inline-flex flex-col items-center carousel-item carousel-slide"
      style={{ 
        minWidth: "140px", 
        ...containerStyle,
        backgroundColor: 'transparent',
        background: 'transparent',
        boxShadow: 'none',
        border: 'none',
        outline: 'none',
        padding: 0,
        transform: 'translate3d(0, 0, 0)',
      }}
    >
      <div
        className="flex flex-col items-center p-4 transition-all duration-300 hover:scale-105 carousel-item carousel-slide"
        style={{
          ...containerStyle,
          backgroundColor: 'transparent',
          background: 'transparent',
          boxShadow: 'none',
          border: 'none',
          outline: 'none',
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        <div
          className="token-mask relative carousel-slide"
          style={{
            ...imageContainerStyle,
            visibility: "visible",
            opacity: 1,
            display: "flex",
            backgroundColor: 'transparent',
            background: 'transparent',
            boxShadow: 'none',
            border: 'none',
            outline: 'none',
            transform: 'translate3d(0, 0, 0)',
          }}
        >
          <CarouselImage
            src={token.imagePath}
            alt={token.id}
            className="token-image relative z-10"
            style={{
              ...imageStyle,
              visibility: "visible",
              opacity: 1,
              backgroundColor: 'transparent',
              background: 'transparent',
              boxShadow: 'none',
              border: 'none',
              outline: 'none',
              transform: 'translate3d(0, 0, 0)',
              imageRendering: 'crisp-edges',
              WebkitMaskImage: 'none',
            }}
            width={120}
            height={120}
          />
        </div>
      </div>
    </div>
  );
};

export default TokenItem;
