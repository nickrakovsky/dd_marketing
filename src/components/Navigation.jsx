import { Button } from "./ui/button";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import datadocksLogo from "../assets/datadocks-logo.svg";
import datadocksLogoWhite from "../assets/datadocks-logo-white.svg";

const Navigation = ({ isOrange = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownTimeoutRef = useRef(null);

  // import.meta.env.BASE_URL has a trailing slash in Astro by default
  const cleanBase = typeof import.meta !== 'undefined' && import.meta.env.BASE_URL 
    ? import.meta.env.BASE_URL.replace(/\/$/, "") 
    : "";

  const dropdownItems = [
    { label: "Increase Capacity", href: `${cleanBase}/benefits/increase-capacity` },
    { label: "See Everything", href: `${cleanBase}/benefits/see-everything` },
    { label: "Delight Carriers", href: `${cleanBase}/benefits/delight-carriers` },
    { label: "Digitize Operations", href: `${cleanBase}/benefits/digitize-operations` },
  ];

  const MAIN_SITE = "https://www.datadocks.com";

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className={`relative z-50 transition-colors duration-300 ${
      isOrange ? "bg-[#fd4f00]" : "bg-[#FFF8E9] dark:bg-gray-900"
    }`}>
      <div className="container mx-auto px-0 md:px-8 pt-4 md:pt-12 pb-4 md:pb-6">
        <div className="flex items-center justify-between flex-wrap min-h-[4rem] gap-2 sm:gap-4 px-4 md:px-0 py-2 md:py-0 w-full">

          <div className="flex items-center flex-shrink min-w-0">
            <a href={MAIN_SITE} className="flex-shrink min-w-0">
              <img 
                src={datadocksLogo.src} 
                alt="DataDocks Logo" 
                className={`h-[clamp(1.5rem,10vw,2.5rem)] sm:h-12 w-auto max-w-[65vw] object-contain ${
                  isOrange ? "hidden" : "block dark:hidden"
                }`} 
              />
              <img 
                src={datadocksLogoWhite.src} 
                alt="DataDocks Logo" 
                className={`h-[clamp(1.5rem,10vw,2.5rem)] sm:h-12 w-auto max-w-[65vw] object-contain ${
                  isOrange ? "block" : "hidden dark:block"
                }`} 
              />
            </a>
          </div>

          <div className="hidden lg:flex items-center lg:space-x-6 xl:space-x-8 flex-1 justify-end">

            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button className={`flex items-center gap-1 transition-colors font-recoleta text-base xl:text-lg ${
                isOrange 
                  ? "text-white hover:text-white/80" 
                  : "text-foreground dark:text-gray-200 hover:text-foreground/70 dark:hover:text-gray-400"
              }`}>
                How DataDocks Helps
                <ChevronDown className="w-4 h-4" />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-0 pt-2 w-56 z-50">
                  <div className="bg-[#EFE2D2] dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg overflow-hidden py-2 transition-colors duration-300">
                    {dropdownItems.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-1.5 text-foreground dark:text-gray-200 hover:pl-6 hover:translate-x-1 hover:text-[#665238] dark:hover:text-[#ff7635] transition-all duration-300 font-recoleta text-base"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a
              href={`${MAIN_SITE}/#features`}
              className={`transition-colors font-recoleta text-base xl:text-lg ${
                isOrange 
                  ? "text-white hover:text-white/80" 
                  : "text-foreground dark:text-gray-200 hover:text-foreground/70 dark:hover:text-gray-400"
              }`}
            >
              Features
            </a>

            <a
              href={`${cleanBase}/posts`}
              className={`transition-colors font-recoleta text-base xl:text-lg ${
                isOrange 
                  ? "text-white hover:text-white/80" 
                  : "text-foreground dark:text-gray-200 hover:text-foreground/70 dark:hover:text-gray-400"
              }`}
            >
              Research
            </a>

            <a
              href={`${MAIN_SITE}/integrations`}
              className={`transition-colors font-recoleta text-base xl:text-lg ${
                isOrange 
                  ? "text-white hover:text-white/80" 
                  : "text-foreground dark:text-gray-200 hover:text-foreground/70 dark:hover:text-gray-400"
              }`}
            >
              Integrations
            </a>

            <a
              href="https://booking.datadocks.com/sessions/new"
              className={`transition-colors font-recoleta text-base xl:text-lg ${
                isOrange 
                  ? "text-white hover:text-white/80" 
                  : "text-foreground dark:text-gray-200 hover:text-foreground/70 dark:hover:text-gray-400"
              }`}
            >
              Login
            </a>

            <Button
              asChild
              variant="default"
              className={`px-6 font-recoleta rounded-none text-base xl:text-lg border-b-4 transition-all shadow-none ${
                isOrange 
                  ? "bg-white text-[#fd4f00] hover:bg-black hover:text-white border-transparent hover:border-b-white" 
                  : "bg-[#FF5722] hover:bg-black text-white border-transparent hover:border-b-[#FF5722]"
              }`}
            >
              <a href="https://calendly.com/nick-rakovsky/datadocks-demo" target="_blank" rel="noopener noreferrer">
                Schedule a Demo
              </a>
            </Button>
          </div>

          <button
            className={`lg:hidden shrink-0 p-2 transition-colors duration-300 ${
              isOrange ? "text-white" : "text-foreground dark:text-gray-200"
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className={`lg:hidden absolute top-full left-0 right-0 border-t z-50 shadow-xl transition-colors duration-300 ${
            isOrange 
              ? "bg-[#fd4f00] border-white/20" 
              : "bg-[#FFF8E9] dark:bg-gray-900 border-border dark:border-gray-700"
          }`}>
            <div className="flex flex-col space-y-0">
              <div className="flex flex-col">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center justify-between px-4 py-3 font-recoleta border-b transition-colors duration-300 ${
                    isOrange 
                      ? "text-white border-white/20" 
                      : "text-foreground dark:text-gray-200 border-[#e3d5c4a6] dark:border-gray-700"
                  }`}
                >
                  How DataDocks Helps
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>
                {isDropdownOpen && (
                  <div className="bg-[#EFE2D2] dark:bg-gray-800 flex flex-col transition-colors duration-300">
                    {dropdownItems.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className={`px-8 py-3 font-recoleta border-b last:border-0 transition-colors duration-300 ${
                          isOrange 
                            ? "text-white/90 border-white/10 hover:text-white" 
                            : "text-foreground dark:text-gray-200 border-[#e3d5c4a6] dark:border-gray-700 hover:text-[#665238] dark:hover:text-[#ff7635]"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <a
                href={`${MAIN_SITE}/#features`}
                className={`px-4 py-3 font-recoleta border-b transition-colors duration-300 ${
                  isOrange 
                    ? "text-white border-white/20" 
                    : "text-foreground dark:text-gray-200 border-[#e3d5c4a6] dark:border-gray-700"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>

              <a
                href={`${cleanBase}/posts`}
                className={`px-4 py-3 font-recoleta border-b transition-colors duration-300 ${
                  isOrange 
                    ? "text-white border-white/20" 
                    : "text-foreground dark:text-gray-200 border-[#e3d5c4a6] dark:border-gray-700"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Research
              </a>

              <a
                href={`${MAIN_SITE}/integrations`}
                className={`px-4 py-3 font-recoleta border-b transition-colors duration-300 ${
                  isOrange 
                    ? "text-white border-white/20" 
                    : "text-foreground dark:text-gray-200 border-[#e3d5c4a6] dark:border-gray-700"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Integrations
              </a>

              <a
                href="https://booking.datadocks.com/sessions/new"
                className={`px-4 py-3 font-recoleta border-b transition-colors duration-300 ${
                  isOrange 
                    ? "text-white border-white/20" 
                    : "text-foreground dark:text-gray-200 border-[#e3d5c4a6] dark:border-gray-700"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </a>

              <div className="p-0">
                <Button
                  asChild
                  variant="default"
                  className={`w-full rounded-none border-b-4 transition-all shadow-none font-recoleta py-8 ${
                    isOrange 
                      ? "bg-white text-[#fd4f00] hover:bg-black hover:text-white border-transparent hover:border-b-white" 
                      : "bg-[#FF5722] hover:bg-black text-white border-transparent hover:border-b-[#FF5722]"
                  }`}
                >
                  <a href="https://calendly.com/nick-rakovsky/datadocks-demo" target="_blank" rel="noopener noreferrer">
                    Schedule a Demo
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;