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

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  // Force scrolled state to true on mobile devices
  const isNavScrolled = isMobile ? true : scrolled;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  /**
   * Scrolls to a section, and optionally aligns the
   * bottom of the navbar with the top of the section.
   * @param id string - section id
   * @param alignNavbarBottom boolean - if true, bottom of navbar aligns with top of section
   */
  const scrollToSection = (id: string, alignNavbarBottom: boolean = false) => {
    setMobileMenuOpen(false); // Close mobile menu after clicking
    const element = document.getElementById(id);
    const navbar = document.querySelector("nav");
    const navbarHeight = navbar ? navbar.offsetHeight : 54;

    if (element) {
      const sectionTop = element.getBoundingClientRect().top + window.scrollY;
      if (alignNavbarBottom) {
        // Scroll so that bottom of navbar coincides with top of section
        window.scrollTo({
          top: sectionTop - navbarHeight,
          behavior: "smooth",
        });
      } else {
        // Default: classic smooth scroll but adjust to avoid navbar overlap
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          window.scrollBy({
            top: -navbarHeight,
            behavior: "instant" as ScrollBehavior,
          });
        }, 400);
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
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
              <button
                onClick={scrollToTop}
                className="cursor-pointer"
                aria-label="Scroll to top"
              >
                <img
                  src="/lovable-uploads/1e51f881-cf85-4f9c-929a-501fd222233c.png"
                  alt="Ping Logo"
                  className="h-6"
                />
              </button>
            </div>

            <div className="hidden md:flex items-center gap-8 text-white">
              <button
                onClick={() => scrollToSection("discover-section", true)}
                className="navbar-button hover:text-[#AB9FF2] transition-all duration-300"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("use-cases", true)}
                className="navbar-button hover:text-[#AB9FF2] transition-all duration-300"
              >
                Use Cases
              </button>
              <button className="navbar-button hover:text-[#AB9FF2] transition-all duration-300">
                Docs
              </button>
              <button className="navbar-button hover:text-[#AB9FF2] transition-all duration-300">
                Community
              </button>
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
                onClick={() => scrollToSection("discover-section", true)}
                className="flex items-center justify-between border-b border-white/10 pb-4 cursor-pointer hover:text-[#AB9FF2] transition-colors duration-300"
              >
                <span className="text-base font-medium">Features</span>
                <ChevronDown size={18} />
              </div>
              <div
                onClick={() => scrollToSection("use-cases", true)}
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
