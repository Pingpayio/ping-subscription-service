import React, { useState, useEffect } from "react";
import { Timer } from "lucide-react";

const Hero: React.FC = () => {
  const [displayText, setDisplayText] = useState("Commerce");
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);
  
  // Array of words (keeping only the text, removing color assignments)
  const words = [
    "Commerce",
    "AI Agents",
    "Subscriptions",
    "Enterprise",
    "Savings",
    "Bill Splitting",
    "Ticketing",
    "Invoicing",
    "Freelancing",
    "Services",
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      // Current complete word
      const currentWord = words[index];
      
      // If deleting
      if (isDeleting) {
        setDisplayText(currentWord.substring(0, displayText.length - 1));
        setTypingSpeed(80); // Faster when deleting
        
        // If completely deleted, start typing next word
        if (displayText.length === 0) {
          setIsDeleting(false);
          setIndex((prev) => (prev + 1) % words.length);
          setTypingSpeed(150);
        }
      } 
      // If typing
      else {
        setDisplayText(currentWord.substring(0, displayText.length + 1));
        setTypingSpeed(150); // Normal typing speed
        
        // If completed typing the word, pause then start deleting
        if (displayText === currentWord) {
          setTypingSpeed(2000); // Pause before starting to delete
          setIsDeleting(true);
        }
      }
    }, typingSpeed);
    
    return () => clearTimeout(timer);
  }, [displayText, index, isDeleting, typingSpeed, words]);

  return (
    <header className="flex flex-col items-center p-4 md:p-6 rounded-2xl">
      <h1 className="text-[#000000] text-3xl md:text-[48px] font-bold leading-tight md:leading-[60px] text-center mt-16 md:mt-[140px] max-w-full text-shadow-sm">
        The Payment Layer
        <br className="md:block" />
        for the Future of{" "}
        <span className="relative">
          <span 
            className="inline-block min-w-[80px] md:min-w-[180px] text-[#AB9FF2]"
          >
            {displayText}
          </span>
          <span className="absolute -right-[4px] top-0 h-full w-[2px] bg-black animate-blink"></span>
        </span>
      </h1>
      <p className="text-[#000000] text-base md:text-2xl font-normal text-center mt-4 max-w-full px-4 md:leading-9">
        Make & Receive Instant Borderless Payments
      </p>
      <button className="bg-[#AB9FF2] border h-[56px] w-[219px] flex items-center justify-center gap-2 text-[#3D315E] font-medium text-center mt-6 md:mt-8 px-4 py-2 rounded-[30px] border-[#AB9FF2] border-solid cursor-pointer whitespace-nowrap hover:bg-[#9B87F5] hover:scale-105 transition-all duration-300">
        <span className="text-sm md:text-base">Coming Soon</span>
        <Timer size={16} className="md:size-18" />
      </button>
      <div className="mt-8 md:mt-[60px] px-4 w-full mb-0">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/bbaf03e746c54fdab851e2e8fa65b939/28094319b78a85233278e4f17a4e3e2b46bcc4fe?placeholderIfAbsent=true"
          alt="HyperLend Platform"
          className="aspect-[1.68] object-contain w-[765px] mx-auto h-auto max-h-[calc(100vh*0.45)] md:max-h-[calc(100vh*0.5)]"
          style={{ marginBottom: "-25px" }}
        />
      </div>
    </header>
  );
};

export default Hero;
