import React, { useEffect, useRef } from "react";
import {
  LinkIcon,
  Code2,
  Repeat,
  CreditCard,
  Wallet,
  MessagesSquare,
  RefreshCw,
  ArrowUpDown,
  ShoppingCart,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AssetManagementSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: <LinkIcon className="h-10 w-10 text-[#AB9FF2]" />,
      title: "Ping Links",
      description:
        "Launch a hosted checkout page for payments from a Ping Link, in a few clicks. Receive crypto payments online or in person from all chains; curated for your use cases.",
    },
    {
      icon: <ShoppingCart className="h-10 w-10 text-[#AB9FF2]" />,
      title: "Checkout & Product Widgets",
      description:
        "Embed crypto payments for any use case, into any app or website with Ping's user-friendly, checkout and product widgets with minimal code required.",
    },
    {
      icon: <Repeat className="h-10 w-10 text-[#AB9FF2]" />,
      title: "Automated Subscriptions",
      description:
        "Offer automated subscriptions/recurring payments without requiring users to pre-fund accounts or approve unlimited spending. Our agent will handle payments automatically.",
    },
    {
      icon: <Code2 className="h-10 w-10 text-[#AB9FF2]" />,
      title: "Intuitive APIs & SDKs",
      description:
        "We package our payment solutions into easy to use APIs and SDKs. Focus on your payment use cases, rather than the complexities of the infrastructure.",
    },
    {
      icon: <Wallet className="h-10 w-10 text-[#AB9FF2]" />,
      title: "Ping Account",
      description:
        "Removing the complexities of crypto payments through chain signatures and NEARs account model. Sign up with email and accept payments to your account.",
    },
    {
      icon: <CreditCard className="h-10 w-10 text-[#AB9FF2]" />,
      title: "Pay With Card",
      description:
        "Accept traditional payments from non-crypto users with Ping. Receive the crypto you want to receive, while they pay with fiat. Powered by NEAR Intents.",
      comingSoon: true,
    },
    {
      icon: <ArrowUpDown className="h-10 w-10 text-[#AB9FF2]" />,
      title: "Ping Onramp",
      description:
        "Seamlessly Onramp fiat into any NEAR Intents supported currency such as USDC, Bitcoin, Near, Solana, Ethereum, XRP, Doge, Bera, Zcash, Gnosis and Blackdragon.",
      comingSoon: true,
    },
    {
      icon: <MessagesSquare className="h-10 w-10 text-[#AB9FF2]" />,
      title: "AI Assistant",
      description:
        "The personal payment assistant to seamlessly make and manage all of your crypto payments across web2 and web3; from Amazon to Uber to Crypto trading.",
      comingSoon: true,
    },
  ];

  useEffect(() => {
    // Create an intersection observer to detect when feature cards come into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Find the icon element in the card
            const iconElement = entry.target.querySelector(".feature-icon");
            if (iconElement) {
              // Add animation classes to the icon
              iconElement.classList.add("icon-animate");
            }
            // Stop observing once animation is applied
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null, // Use viewport as root
        rootMargin: "0px",
        threshold: 0.2, // Trigger when 20% of the element is visible
      },
    );

    // Observe all feature cards
    const featureCards = document.querySelectorAll(".feature-card");
    featureCards.forEach((card) => {
      observer.observe(card);
    });

    // Clean up observer on component unmount
    return () => {
      featureCards.forEach((card) => {
        observer.unobserve(card);
      });
    };
  }, []);

  // Function to find the card with the most content and adjust heights accordingly
  useEffect(() => {
    const adjustCardHeights = () => {
      // Reset heights first to get natural heights
      const featureCards = document.querySelectorAll(".feature-card");
      featureCards.forEach((card) => {
        (card as HTMLElement).style.height = "auto";
      });

      // Get the tallest card height
      let maxHeight = 0;
      featureCards.forEach((card) => {
        const height = (card as HTMLElement).offsetHeight;
        maxHeight = Math.max(maxHeight, height);
      });

      // Set all cards to the height of the tallest card
      if (maxHeight > 0) {
        featureCards.forEach((card) => {
          (card as HTMLElement).style.height = `${maxHeight}px`;
        });
      }
    };

    // Adjust heights initially and on window resize
    adjustCardHeights();
    window.addEventListener("resize", adjustCardHeights);

    // Clean up
    return () => {
      window.removeEventListener("resize", adjustCardHeights);
    };
  }, []);

  return (
    <section
      id="asset-management"
      className="w-full py-16 md:py-24 px-4 relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(45deg, 
                  #AB9FF2 0%, #C4B5FD 25%, #DDD6FE 50%, #EDE9FE 75%, #F5F2FF 100%)`,
        backgroundSize: "400% 400%",
        animation: "flowing-gradient 15s ease infinite",
      }}
      ref={sectionRef}
    >
      <div className="max-w-[1080px] mx-auto relative z-10">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-[#000000]">
            The Easiest Tools for Crypto Payments
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card bg-white/20 backdrop-blur-sm rounded-lg p-6 md:p-8 hover:bg-white/30 transition-all duration-300 border border-white/30 flex flex-col"
            >
              <div className="flex items-start gap-5 h-full">
                <div className="feature-icon flex-shrink-0">
                  {React.cloneElement(feature.icon as React.ReactElement, {
                    className: `h-10 w-10 text-[#AB9FF2] transition-all duration-700 ease-out`,
                  })}
                </div>
                <div className="flex-1 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-semibold text-[#000000]">
                      {feature.title}
                    </h3>
                    {feature.comingSoon && (
                      <Badge
                        variant="outline"
                        className="bg-[#AB9FF2]/20 text-[#4A3A6A] border-[#AB9FF2]/50 flex items-center gap-1 px-2 py-0.5 text-xs font-medium animate-pulse"
                      >
                        <Clock className="h-3 w-3" />
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <p className="text-[#4A4A4A] text-sm leading-relaxed flex-grow">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AssetManagementSection;
