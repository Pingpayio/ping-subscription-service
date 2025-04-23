import React, { useEffect, useState } from "react";
import UseCaseCard, { UseCaseCardProps } from "./UseCaseCard";

const UseCasesCarousel: React.FC = () => {
  // State to store randomized use cases
  const [useCases, setUseCases] = useState<UseCaseCardProps[]>([]);

  // All use cases with consistent background color
  const allUseCases: UseCaseCardProps[] = [
    {
      title: "E-Commerce",
      description: "Accept crypto payments on your online store from any chain, settled instantly.",
      imageSrc: "/lovable-uploads/dc224d9f-ab71-4d25-bbdf-2a8d39dfb720.png",
    },
    {
      title: "IRL Payments",
      description: "Enable fast, wallet-to-wallet crypto payments for in-person purchases anywhere.",
      imageSrc: "/lovable-uploads/bf2c7584-3ae7-4197-a814-36fed986bd64.png",
    },
    {
      title: "Savings Pots",
      description: "Create automated recurring payments to organise and grow your crypto savings.",
      imageSrc: "/lovable-uploads/0943ab13-2c96-4b77-8de0-cb1b123d7c5d.png",
    },
    {
      title: "Digital Services",
      description: "Sell digital goods or services and get paid directly in crypto instantly.",
      imageSrc: "/lovable-uploads/723d566c-634a-449e-acdd-467d35704424.png",
    },
    {
      title: "Bill Splitting",
      description: "Split bills with friends and settle up instantly with crypto, no math needed.",
      imageSrc: "/lovable-uploads/9fc4b611-658a-4925-b1fa-31640038cc6e.png",
    },
    {
      title: "In-app Purchases",
      description: "Let users buy in-game items, features, or credits using any token or wallet.",
      imageSrc: "/lovable-uploads/c1a66de4-1adf-438b-a944-54d5fc1c0a16.png",
    },
    {
      title: "Subscriptions",
      description: "Automate recurring crypto payments for SaaS, creators, or memberships.",
      imageSrc: "/lovable-uploads/adecacb6-2b8d-42b8-83b7-e96ffd927ecc.png",
    },
    {
      title: "Enterprise",
      description: "Custom payment flows and dashboards for teams leveraging crypto.",
      imageSrc: "/lovable-uploads/bbd8fd07-bc11-4018-b211-42785e570fb4.png",
    },
    {
      title: "Event Ticketing",
      description: "Sell, mint, and scan event tickets with crypto through NFT tickets.",
      imageSrc: "/lovable-uploads/63efbc89-1e9e-442d-a1ae-c65a3fbc6846.png",
    },
    {
      title: "AI-commerce",
      description: "Enabling secure agent-to-agent payment flows, to get agents paid.",
      imageSrc: "/lovable-uploads/051f5c43-8963-4df7-b8e0-00f5da2d23b5.png",
    },
    {
      title: "Invoicing",
      description: "Send branded crypto invoices with due dates, itemisation, and checkout.",
      imageSrc: "/lovable-uploads/f3ae69a7-9b8c-44d4-a32d-76c482fe4f70.png",
    }
  ];

  // Randomize use cases on component mount
  useEffect(() => {
    // Fisher-Yates shuffle algorithm
    const shuffleUseCases = (array: UseCaseCardProps[]): UseCaseCardProps[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    setUseCases(shuffleUseCases(allUseCases));
  }, []);

  // Function to ensure all use case cards have the same height
  useEffect(() => {
    const adjustCardHeights = () => {
      // Reset heights first
      const cards = document.querySelectorAll('.use-case-card');
      cards.forEach((card) => {
        (card as HTMLElement).style.height = 'auto';
      });
      
      // Group cards by their container (first/second set)
      const firstSet = document.querySelectorAll('[data-set="first"] .use-case-card');
      const secondSet = document.querySelectorAll('[data-set="second"] .use-case-card');
      
      // Find max height in each set
      let maxHeightFirst = 0;
      firstSet.forEach((card) => {
        maxHeightFirst = Math.max(maxHeightFirst, (card as HTMLElement).offsetHeight);
      });
      
      let maxHeightSecond = 0;
      secondSet.forEach((card) => {
        maxHeightSecond = Math.max(maxHeightSecond, (card as HTMLElement).offsetHeight);
      });
      
      // Use the overall max height for all cards
      const maxHeight = Math.max(maxHeightFirst, maxHeightSecond);
      
      if (maxHeight > 0) {
        cards.forEach((card) => {
          (card as HTMLElement).style.height = `${maxHeight}px`;
        });
      }
    };
    
    // Run the adjustment after cards render
    setTimeout(adjustCardHeights, 100);
    window.addEventListener('resize', adjustCardHeights);
    
    return () => {
      window.removeEventListener('resize', adjustCardHeights);
    };
  }, [useCases]);

  return (
    <div className="px-4 md:px-10 w-full max-w-[1000px] mx-auto overflow-hidden flex-grow flex items-center">
      <div className="relative overflow-hidden w-full">
        <div className="flex whitespace-nowrap">
          {/* First set of use cases */}
          <div className="flex continuous-scroll" data-set="first">
            {useCases.map((useCase, index) => (
              <div 
                key={`first-${index}`} 
                className="shrink-0 pl-4 inline-flex flex-col items-center"
                style={{ minWidth: "240px", maxWidth: "240px" }}
              >
                <div className="h-full use-case-card">
                  <UseCaseCard
                    title={useCase.title}
                    description={useCase.description}
                    imageSrc={useCase.imageSrc}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Second set of use cases - creates the continuous effect */}
          <div className="flex continuous-scroll" data-set="second">
            {useCases.map((useCase, index) => (
              <div 
                key={`second-${index}`} 
                className="shrink-0 pl-4 inline-flex flex-col items-center"
                style={{ minWidth: "240px", maxWidth: "240px" }}
              >
                <div className="h-full use-case-card">
                  <UseCaseCard
                    title={useCase.title}
                    description={useCase.description}
                    imageSrc={useCase.imageSrc}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UseCasesCarousel;
