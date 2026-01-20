import { Button } from "./ui/button";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import datadocksLogo from "../assets/datadocks-logo.svg";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownTimeoutRef = useRef(null);

  const cleanBase = "";

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
    <nav className="relative z-50 bg-[#FFF8E9]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between h-16 gap-4">
          
          <div className="flex items-center flex-shrink-0">
            <a href={MAIN_SITE}>
                <img src={datadocksLogo.src} alt="DataDocks Logo" className="h-10 sm:h-12 w-auto" />
            </a>
          </div>

          <div className="hidden lg:flex items-center lg:space-x-6 xl:space-x-8 flex-1 justify-end">
            
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button className="flex items-center gap-1 text-foreground hover:text-foreground/70 transition-colors font-recoleta text-base xl:text-lg">
                How DataDocks Helps
                <ChevronDown className="w-4 h-4" />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-0 pt-2 w-56 z-50">
                  <div className="bg-[#EFE2D2] border border-border rounded-lg overflow-hidden">
                    {dropdownItems.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-3 text-foreground hover:pl-6 hover:text-[#FFF8E9] transition-all font-recoleta text-base"
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
              className="text-foreground hover:text-foreground/70 transition-colors font-recoleta text-base xl:text-lg"
            >
              Features
            </a>

            <a
              href={`${MAIN_SITE}/#research`}
              className="text-foreground hover:text-foreground/70 transition-colors font-recoleta text-base xl:text-lg"
            >
              Research
            </a>

            <a
              href={`${MAIN_SITE}/#integrations`}
              className="text-foreground hover:text-foreground/70 transition-colors font-recoleta text-base xl:text-lg"
            >
              Integrations
            </a>

            <a
              href="https://booking.datadocks.com/sessions/new" 
              className="text-foreground hover:text-foreground/70 transition-colors font-recoleta text-base xl:text-lg"
            >
              Login
            </a>

            <Button
              asChild
              variant="default"
              className="bg-[#FF5722] hover:bg-black text-white px-6 font-recoleta rounded-none text-base xl:text-lg border-b-4 border-transparent hover:border-b-[#FF5722] transition-all shadow-none"
            >
              <a href="https://calendly.com/nick-rakovsky/datadocks-demo" target="_blank" rel="noopener noreferrer">
                Schedule a Demo
              </a>
            </Button>
          </div>

          <button
            className="lg:hidden text-foreground p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border bg-[#FFF8E9]">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between text-foreground px-2 py-2"
                >
                  How DataDocks Helps
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isDropdownOpen && (
                  <div className="pl-4 flex flex-col space-y-2">
                    {dropdownItems.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="text-foreground hover:pl-2 hover:text-[#FFF8E9] py-2 transition-all font-recoleta"
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
                className="text-foreground px-2 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>

              <a
                href={`${MAIN_SITE}/#research`}
                className="text-foreground px-2 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Research
              </a>

              <a
                href={`${MAIN_SITE}/#integrations`}
                className="text-foreground px-2 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Integrations
              </a>

              <a
                href="https://booking.datadocks.com/sessions/new"
                className="text-foreground px-2 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </a>

              <Button
                asChild
                variant="default"
                className="bg-[#FF5722] hover:bg-black text-white w-full mt-2 rounded-none border-b-4 border-transparent hover:border-b-[#FF5722] transition-all shadow-none"
              >
                <a href="https://calendly.com/nick-rakovsky/datadocks-demo" target="_blank" rel="noopener noreferrer">
                  Schedule a Demo
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;