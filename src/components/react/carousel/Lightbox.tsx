import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";

interface LightboxProps {
  // Support both array (Carousel) and single (Gallery) usage if needed, 
  // but primarily matching ImageCarousel's array expectation.
  images: { src: string; alt: string }[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ images, currentIndex, isOpen, onClose, onNavigate }: LightboxProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const currentImage = images?.[currentIndex];

  useEffect(() => {
    setIsLoaded(false);
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((currentIndex + 1) % images.length);
      if (e.key === "ArrowLeft") onNavigate((currentIndex - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

  if (!isOpen || !currentImage) return null;

  return (
    <motion.div
      key="lightbox-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      // REVERTED STYLE: Absolute (contained), No Black Background, Centered
      className="absolute inset-0 z-50 flex items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
      )}

      <motion.img
        key={currentImage.src}
        ref={imgRef}
        src={currentImage.src}
        alt={currentImage.alt}
        // REVERTED STYLE: w-full h-full object-contain (matches your original design)
        className={`w-full h-full object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
      />

      {/* REVERTED CONTROLS: Original styling restored */}
      <button onClick={onClose} className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-white border border-border shadow-sm text-sm text-foreground rounded-full font-medium transition-all z-50">
        <ArrowLeft size={14} className="text-primary" /> Back
      </button>

      <button onClick={(e) => { e.stopPropagation(); onNavigate((currentIndex - 1 + images.length) % images.length); }} className="absolute top-1/2 -translate-y-1/2 left-4 p-2 rounded-full bg-white/90 shadow-md border border-gray-100 text-primary hover:scale-105 transition-all z-50">
        <ChevronLeft size={24} />
      </button>

      <button onClick={(e) => { e.stopPropagation(); onNavigate((currentIndex + 1) % images.length); }} className="absolute top-1/2 -translate-y-1/2 right-4 p-2 rounded-full bg-white/90 shadow-md border border-gray-100 text-primary hover:scale-105 transition-all z-50">
        <ChevronRight size={24} />
      </button>
    </motion.div>
  );
}