import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";

interface LightboxProps {
  image: { src: string; alt: string };
  onNext: (e: React.MouseEvent | KeyboardEvent) => void;
  onPrev: (e: React.MouseEvent | KeyboardEvent) => void;
  onClose: () => void;
}

export default function Lightbox({ image, onNext, onPrev, onClose }: LightboxProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoaded(false);
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, [image.src]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext(e);
      if (e.key === "ArrowLeft") onPrev(e);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrev, onClose]);

  return (
    <motion.div
      key="lightbox-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
      )}

      <motion.img
        key={image.src}
        ref={imgRef}
        src={image.src}
        alt={image.alt}
        // FIX: Removed 'drop-shadow-2xl' below
        className={`w-full h-full object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
      />

      <button onClick={onClose} className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-white border border-border shadow-sm text-sm text-foreground rounded-full font-medium transition-all z-50">
        <ArrowLeft size={14} className="text-primary" /> Back
      </button>

      <button onClick={onPrev} className="absolute top-1/2 -translate-y-1/2 left-4 p-2 rounded-full bg-white/90 shadow-md border border-gray-100 text-primary hover:scale-105 transition-all z-50">
        <ChevronLeft size={24} />
      </button>

      <button onClick={onNext} className="absolute top-1/2 -translate-y-1/2 right-4 p-2 rounded-full bg-white/90 shadow-md border border-gray-100 text-primary hover:scale-105 transition-all z-50">
        <ChevronRight size={24} />
      </button>
    </motion.div>
  );
}