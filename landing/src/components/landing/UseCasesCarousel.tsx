
import React, { useEffect, useState } from "react";
import UseCaseCard, { UseCaseCardProps } from "./UseCaseCard";

const UseCasesCarousel: React.FC = () => {
  // State to store randomized use cases
  const [useCases, setUseCases] = useState<UseCaseCardProps[]>([]);

  // All use cases with consistent background color
  const allUseCases: UseCaseCardProps[] = [
    {
      title: "AI-commerce",
      description: "Enable payments for AI services and content. Seamless transactions for next-gen digital offerings.",
      imageSrc: "/lovable-uploads/051f5c43-8963-4df7-b8e0-00f5da2d23b5.png", // AI-commerce image
    },
    {
      title: "Enterprise",
      description: "Streamlined cross-border B2B payments. Reduce fees and gain full transaction transparency.",
      imageSrc: "/lovable-uploads/bbd8fd07-bc11-4018-b211-42785e570fb4.png", // Enterprise image
    },
    {
      title: "Digital Services",
      description: "Secure payment solutions for freelancers. Reach clients globally with instant settlements.",
      imageSrc: "/lovable-uploads/723d566c-634a-449e-acdd-467d35704424.png", // Digital Services image
    },
    {
      title: "Subscriptions",
      description: "Enable recurring crypto payments. Support multiple chains for subscription-based offerings.",
      imageSrc: "/lovable-uploads/adecacb6-2b8d-42b8-83b7-e96ffd927ecc.png", // Subscriptions image
    },
    {
      title: "IRL Payments",
      description: "Quick point-of-sale crypto payments. Bring blockchain to physical retail environments.",
      imageSrc: "/lovable-uploads/bf2c7584-3ae7-4197-a814-36fed986bd64.png", // IRL Payments image
    },
    {
      title: "Bill Splitting",
      description: "Create and manage group expenses. Split bills efficiently with integrated payment tracking.",
      imageSrc: "/lovable-uploads/9fc4b611-658a-4925-b1fa-31640038cc6e.png", // Bill Splitting image
    },
    {
      title: "E-Commerce",
      description: "Accept crypto payments for digital and physical products. Quick settlement from any blockchain network.",
      imageSrc: "/lovable-uploads/dc224d9f-ab71-4d25-bbdf-2a8d39dfb720.png", // E-commerce image
    },
    {
      title: "Event Ticketing",
      description: "Sell event tickets with instant crypto payments. Optional NFT tickets for enhanced security and collectibility.",
      imageSrc: "/lovable-uploads/63efbc89-1e9e-442d-a1ae-c65a3fbc6846.png", // Event Ticketing image
    },
    {
      title: "Invoicing",
      description: "Generate and send professional crypto invoices. Automated payment tracking and reconciliation.",
      imageSrc: "/lovable-uploads/f3ae69a7-9b8c-44d4-a32d-76c482fe4f70.png", // Invoicing image
    },
    {
      title: "Savings Pots",
      description: "Create dedicated crypto savings funds. Set goals and track progress with automated allocations.",
      imageSrc: "/lovable-uploads/0943ab13-2c96-4b77-8de0-cb1b123d7c5d.png", // Savings Pots image
    },
    {
      title: "In-app Purchases",
      description: "Integrate seamless in-app crypto payments. Enhance user experience with quick transaction flows.",
      imageSrc: "/lovable-uploads/c1a66de4-1adf-438b-a944-54d5fc1c0a16.png", // In-app Purchases image
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
