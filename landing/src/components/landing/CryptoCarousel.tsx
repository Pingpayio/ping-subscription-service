
import React, { useEffect, useState } from "react";
import { TokenInfo } from "@/types/token";
import { allTokens } from "@/data/tokenData";
import { containerStyle } from "./CryptoCarouselStyles";
import { CarouselStyles } from "./CryptoCarouselStyles";
import TokenItem from "./TokenItem";

const CryptoCarousel: React.FC = () => {
  // State to store randomized tokens
  const [tokens, setTokens] = useState<TokenInfo[]>([]);

  // Randomize tokens on component mount
  useEffect(() => {
    // Fisher-Yates shuffle algorithm
    const shuffleTokens = (array: TokenInfo[]): TokenInfo[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    setTokens(shuffleTokens(allTokens));
  }, []);

  return (
    <>
      <CarouselStyles />
    
      <div 
        className="w-full max-w-[1000px] px-8 md:px-4 mx-auto overflow-hidden" 
        style={{
          ...containerStyle,
          backgroundColor: 'transparent',
          background: 'transparent'
        }}
      >
        <div 
          className="relative overflow-hidden" 
          style={{
            ...containerStyle,
            backgroundColor: 'transparent',
            background: 'transparent'
          }}
        >
          <div 
            className="flex whitespace-nowrap" 
            style={{
              ...containerStyle,
              backgroundColor: 'transparent',
              background: 'transparent'
            }}
          >
            {/* First set of tokens */}
            <div 
              className="flex continuous-scroll" 
              style={{
                ...containerStyle,
                backgroundColor: 'transparent',
                background: 'transparent'
              }}
            >
              {tokens.map((token) => (
                <TokenItem key={`first-${token.id}`} token={token} prefix="first" />
              ))}
            </div>

            {/* Second set of tokens - creates the continuous effect */}
            <div 
              className="flex continuous-scroll" 
              style={{
                ...containerStyle,
                backgroundColor: 'transparent',
                background: 'transparent'
              }}
            >
              {tokens.map((token) => (
                <TokenItem key={`second-${token.id}`} token={token} prefix="second" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CryptoCarousel;
