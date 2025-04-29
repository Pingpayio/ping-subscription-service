import React, { useState, useEffect, useRef } from "react";
import ComingSoonButton from "./ComingSoonButton";
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
const TYPING_SPEED = 70; // ms per character
const DELETING_SPEED = 100;
const PAUSE_AFTER_TYPED = 900;
const PAUSE_AFTER_DELETED = 350;
const Hero: React.FC = () => {
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">(
    "typing",
  );
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  useEffect(() => {
    const currentWord = words[wordIndex];
    if (phase === "typing") {
      if (charIndex < currentWord.length) {
        timeoutRef.current = window.setTimeout(() => {
          setDisplayText(currentWord.slice(0, charIndex + 1));
          setCharIndex((i) => i + 1);
        }, TYPING_SPEED);
      } else {
        timeoutRef.current = window.setTimeout(() => {
          setPhase("pausing");
        }, PAUSE_AFTER_TYPED);
      }
    } else if (phase === "deleting") {
      if (charIndex > 0) {
        timeoutRef.current = window.setTimeout(() => {
          setDisplayText(currentWord.slice(0, charIndex - 1));
          setCharIndex((i) => i - 1);
        }, DELETING_SPEED);
      } else {
        timeoutRef.current = window.setTimeout(() => {
          setWordIndex((i) => (i + 1) % words.length);
          setPhase("typing");
        }, PAUSE_AFTER_DELETED);
      }
    } else if (phase === "pausing") {
      timeoutRef.current = window.setTimeout(() => {
        setPhase("deleting");
      }, 150);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [charIndex, phase, wordIndex]);
  useEffect(() => {
    if (phase === "typing") setCharIndex(0);
  }, [wordIndex]);
  return (
    <header className="flex flex-col items-center p-4 md:p-6 rounded-2xl">
      <h1 className="text-[#000000] text-3xl md:text-[48px] font-bold leading-tight md:leading-[60px] text-center mt-16 md:mt-[140px] max-w-full text-shadow-sm">
        The Payment Layer
        <br className="md:block" />
        for the Future of
        {/* On mobile, animated text always on new line. On md+, keep inline with a space. */}
        <span className="block md:inline" />
        <span className="block md:inline"></span>
        <span
          className="
            block
            md:inline
            mt-2
            md:mt-0
            mb-0
            px-0
            md:pl-2
            transition-all
            min-h-[1.4em] md:min-h-0
            "
        >
          <span className="relative">
            <span
              className="inline-flex items-center whitespace-nowrap text-[#AB9FF2]"
              style={{
                maxWidth: "100vw",
              }}
            >
              {displayText}
              <span
                key={displayText.length + "-" + wordIndex + "-" + phase}
                className="ml-0.5 w-[2px] h-[1em] bg-black inline-block align-middle animate-blink"
                aria-hidden="true"
              />
            </span>
          </span>
        </span>
      </h1>
      <p className="text-[#000000] text-base md:text-2xl font-normal text-center mt-4 max-w-full px-4 md:leading-9">
        Send &amp; Receive Instant Borderless Payments
      </p>
      <div className="flex flex-col items-center gap-4 mt-6 md:mt-8 justify-center w-full max-w-[340px] md:flex-row md:max-w-full">
        <ComingSoonButton />
      </div>
      <div className="mt-8 md:mt-[60px] px-4 w-full mb-0">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/bbaf03e746c54fdab851e2e8fa65b939/28094319b78a85233278e4f17a4e3e2b46bcc4fe?placeholderIfAbsent=true"
          alt="HyperLend Platform"
          className="aspect-[1.68] object-contain w-[765px] mx-auto h-auto max-h-[calc(100vh*0.45)] md:max-h-[calc(100vh*0.5)]"
          style={{
            marginBottom: "-25px",
          }}
        />
      </div>
      <style>
        {`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s steps(1) infinite;
        }
        `}
      </style>
    </header>
  );
};
export default Hero;
