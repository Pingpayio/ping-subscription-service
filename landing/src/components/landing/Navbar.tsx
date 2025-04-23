
import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X, ChevronDown } from "lucide-react";

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  // Force scrolled state to true on mobile devices
  const isNavScrolled = isMobile ? true : scrolled;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Improved smooth scroll function with padding adjustment
  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false); // Close mobile menu after clicking
    const element = document.getElementById(id);
    if (element) {
      // Calculate the navbar height dynamically
      const navbar = document.querySelector('nav');
      const navbarHeight = navbar ? navbar.offsetHeight : 54; // Default to 54px if nav element not found
      
      // Add additional offset to ensure no overlap (depends on section padding)
      const additionalOffset = 20; // Added to ensure there's visible space between navbar and section content
      
      window.scrollTo({
        top: element.offsetTop - navbarHeight - additionalOffset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <nav 
        className={`fixed z-50 w-full transition-all duration-700 ease-in-out ${
          isNavScrolled 
            ? "top-0 bg-[#100713]" 
            : "top-[20px] md:top-[38px] bg-transparent flex justify-center"
        }`}
      >
        <div 
          className={`flex items-center h-[54px] ${
            isNavScrolled 
              ? "w-full transition-all duration-1000 ease-in-out" 
              : "w-full max-w-[1080px] rounded-full transition-all duration-700 ease-in-out"
          } bg-[#100713] px-4 md:px-8`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <img
                src="/lovable-uploads/1e51f881-cf85-4f9c-929a-501fd222233c.png" 
                alt="Ping Logo"
                className="h-6" 
              />
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-white">
              <button 
                onClick={() => scrollToSection('asset-management')} 
                className="navbar-button hover:text-[#AB9FF2] transition-all duration-300"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('use-cases')} 
                className="navbar-button hover:text-[#AB9FF2] transition-all duration-300"
              >
                Use Cases
              </button>
              <button className="navbar-button hover:text-[#AB9FF2] transition-all duration-300">Docs</button>
              <button className="navbar-button hover:text-[#AB9FF2] transition-all duration-300">Community</button>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="bg-[#AB9FF2] text-[#3D315E] text-center px-4 py-1.5 text-sm md:text-base md:px-5 md:py-2 rounded-full hover:opacity-90 transition-opacity">
                Coming Soon
              </button>
              
              {isMobile && (
                <button 
                  onClick={toggleMobileMenu}
                  className="ml-2 text-white p-1.5 rounded-md hover:bg-[#1a1a1a]/40"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#100713] pt-[54px] flex flex-col animate-in slide-in-from-right duration-300">
          <div className="flex flex-col p-6 h-full">
            <div className="flex flex-col space-y-6 text-white text-lg mt-4">
              <div 
                onClick={() => scrollToSection('asset-management')} 
                className="flex items-center justify-between border-b border-white/10 pb-4 cursor-pointer hover:text-[#AB9FF2] transition-colors duration-300"
              >
                <span className="text-base font-medium">Features</span>
                <ChevronDown size={18} />
              </div>
              <div 
                onClick={() => scrollToSection('use-cases')} 
                className="flex items-center justify-between border-b border-white/10 pb-4 cursor-pointer hover:text-[#AB9FF2] transition-colors duration-300"
              >
                <span className="text-base font-medium">Use Cases</span>
                <ChevronDown size={18} />
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 hover:text-[#AB9FF2] transition-colors duration-300">
                <span className="text-base font-medium">Docs</span>
                <ChevronDown size={18} />
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 hover:text-[#AB9FF2] transition-colors duration-300">
                <span className="text-base font-medium">Community</span>
                <ChevronDown size={18} />
              </div>
            </div>
            
            <div className="mt-auto mb-8">
              <button className="w-full bg-[#AB9FF2] text-[#3D315E] font-medium text-center py-3 rounded-lg">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
