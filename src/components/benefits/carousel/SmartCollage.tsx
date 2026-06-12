import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

export interface ImageData {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export type SlideType = "single" | "double" | "triple" | "quad" | "overlay";

interface SmartCollageProps {
  images: ImageData[];
  type: SlideType;
  containerHeight?: number;
  gap?: number;
  onImageClick?: (imageIndex: number) => void;
}

const getAspectRatio = (img: ImageData) => img.width / img.height;

const imageVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
};

const ImageBox = ({ 
  img, 
  index, 
  width, 
  height,
  onClick,
}: { 
  img: ImageData; 
  index: number; 
  width: number; 
  height: number;
  onClick?: () => void;
}) => (
  <motion.div
    custom={index}
    variants={imageVariants}
    initial="hidden"
    animate="visible"
    className="relative flex items-center justify-center rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:brightness-110 transition-all"
    style={{ width, height }}
    onClick={onClick}
  >
    <img
      src={img.src}
      alt={img.alt}
      className="w-full h-full object-contain"
      loading="lazy"
    />
  </motion.div>
);

// Single: maximize the image within container
const layoutSingle = (images: ImageData[], W: number, H: number) => {
  const ar = getAspectRatio(images[0]);
  let w = W, h = W / ar;
  if (h > H) { h = H; w = H * ar; }
  return [{ img: images[0], w, h, x: (W - w) / 2, y: (H - h) / 2 }];
};

// Double: side by side at same height, fill width
const layoutDouble = (images: ImageData[], W: number, H: number, gap: number) => {
  const ar1 = getAspectRatio(images[0]);
  const ar2 = getAspectRatio(images[1]);
  
  // At height h: w1 = h*ar1, w2 = h*ar2, total = h*(ar1+ar2) + gap = W
  let h = (W - gap) / (ar1 + ar2);
  if (h > H) h = H;
  
  const w1 = h * ar1;
  const w2 = h * ar2;
  const totalW = w1 + gap + w2;
  const startX = (W - totalW) / 2;
  const startY = (H - h) / 2;
  
  return [
    { img: images[0], w: w1, h, x: startX, y: startY },
    { img: images[1], w: w2, h, x: startX + w1 + gap, y: startY },
  ];
};

// Triple: large left, two stacked right
const layoutTriple = (images: ImageData[], W: number, H: number, gap: number) => {
  const ar1 = getAspectRatio(images[0]);
  const ar2 = getAspectRatio(images[1]);
  const ar3 = getAspectRatio(images[2]);
  
  // Left image at full height
  const leftH = H;
  const leftW = leftH * ar1;
  
  // Right images: each gets half height minus gap
  const rightH = (H - gap) / 2;
  const rightW2 = rightH * ar2;
  const rightW3 = rightH * ar3;
  
  // Total width needed
  const rightColW = Math.max(rightW2, rightW3);
  const totalW = leftW + gap + rightColW;
  
  // Scale if needed
  let scale = 1;
  if (totalW > W) scale = W / totalW;
  
  const finalLeftW = leftW * scale;
  const finalLeftH = leftH * scale;
  const finalRightH = rightH * scale;
  const finalGap = gap * scale;
  
  const startX = (W - (finalLeftW + finalGap + rightColW * scale)) / 2;
  const startY = (H - finalLeftH) / 2;
  
  return [
    { img: images[0], w: finalLeftW, h: finalLeftH, x: startX, y: startY },
    { img: images[1], w: rightW2 * scale, h: finalRightH, x: startX + finalLeftW + finalGap, y: startY },
    { img: images[2], w: rightW3 * scale, h: finalRightH, x: startX + finalLeftW + finalGap, y: startY + finalRightH + finalGap },
  ];
};

// Quad: 2 large diagonal + 2 small diagonal (corner-based layout)
const layoutQuad = (images: ImageData[], W: number, H: number, gap: number) => {
  // Sort by aspect ratio to identify which images work better large vs small
  const indexed = images.map((img, i) => ({ img, i, ar: getAspectRatio(img) }));
  const sorted = [...indexed].sort((a, b) => b.ar - a.ar);
  
  // Two widest images go large (diagonal), two narrowest go small (other diagonal)
  const large1 = sorted[0]; // top-left
  const large2 = sorted[1]; // bottom-right
  const small1 = sorted[2]; // top-right
  const small2 = sorted[3]; // bottom-left
  
  // Grid: 2 rows, 2 columns
  // Large images get ~65% of their dimension, small get ~35%
  const largeRatio = 0.62;
  const smallRatio = 1 - largeRatio;
  
  const topH = (H - gap) * largeRatio;
  const bottomH = (H - gap) * smallRatio;
  const leftW = (W - gap) * largeRatio;
  const rightW = (W - gap) * smallRatio;
  
  // Fit each image to its cell
  const fitToCell = (img: ImageData, cellW: number, cellH: number) => {
    const ar = getAspectRatio(img);
    let w = cellW;
    let h = w / ar;
    if (h > cellH) {
      h = cellH;
      w = h * ar;
    }
    return { w, h };
  };
  
  const dim1 = fitToCell(large1.img, leftW, topH);      // top-left (large)
  const dim2 = fitToCell(small1.img, rightW, topH);     // top-right (small)
  const dim3 = fitToCell(small2.img, leftW, bottomH);   // bottom-left (small)
  const dim4 = fitToCell(large2.img, rightW, bottomH);  // bottom-right (large)
  
  // Position from corners, centered within cells
  const results = [
    { img: large1.img, w: dim1.w, h: dim1.h, x: (leftW - dim1.w) / 2, y: (topH - dim1.h) / 2, origIndex: large1.i },
    { img: small1.img, w: dim2.w, h: dim2.h, x: leftW + gap + (rightW - dim2.w) / 2, y: (topH - dim2.h) / 2, origIndex: small1.i },
    { img: small2.img, w: dim3.w, h: dim3.h, x: (leftW - dim3.w) / 2, y: topH + gap + (bottomH - dim3.h) / 2, origIndex: small2.i },
    { img: large2.img, w: dim4.w, h: dim4.h, x: leftW + gap + (rightW - dim4.w) / 2, y: topH + gap + (bottomH - dim4.h) / 2, origIndex: large2.i },
  ];
  
  // Sort back by original index for click handling
  return results.sort((a, b) => a.origIndex - b.origIndex).map(({ img, w, h, x, y }) => ({ img, w, h, x, y }));
};

// Overlay: wide background with small tall image overlaid
const layoutOverlay = (images: ImageData[], W: number, H: number) => {
  const ar1 = getAspectRatio(images[0]);
  const ar2 = getAspectRatio(images[1]);
  
  let wideW = W, wideH = W / ar1;
  if (wideH > H) { wideH = H; wideW = H * ar1; }
  
  const overlayH = H * 0.45;
  const overlayW = overlayH * ar2;
  
  return [
    { img: images[0], w: wideW, h: wideH, x: (W - wideW) / 2, y: (H - wideH) / 2, isWide: true },
    { img: images[1], w: overlayW, h: overlayH, x: W - overlayW - 24, y: H - overlayH, isOverlay: true },
  ];
};

export const SmartCollage = ({ 
  images, 
  type, 
  containerHeight = 450, 
  gap = 12,
  onImageClick,
}: SmartCollageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const W = containerWidth;
  const H = containerHeight;

  const getLayout = () => {
    if (W === 0) return [];
    
    switch (type) {
      case "single": return layoutSingle(images, W, H);
      case "double": return layoutDouble(images, W, H, gap);
      case "triple": return layoutTriple(images, W, H, gap);
      case "quad": return layoutQuad(images, W, H, gap);
      case "overlay": return layoutOverlay(images, W, H);
      default: return [];
    }
  };

  const layout = getLayout();

  return (
    <div 
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden bg-gallery-surface relative"
      style={{ height: containerHeight }}
    >
      {layout.map((item, index) => {
        const isOverlay = 'isOverlay' in item && item.isOverlay;
        
        return (
          <motion.div
            key={index}
            custom={index}
            variants={imageVariants}
            initial="hidden"
            animate="visible"
            className={`absolute flex items-center justify-center rounded-lg overflow-hidden cursor-pointer hover:brightness-110 transition-all ${isOverlay ? 'shadow-2xl z-10' : ''}`}
            style={{ 
              left: item.x, 
              top: item.y, 
              width: item.w, 
              height: item.h,
            }}
            onClick={() => onImageClick?.(index)}
          >
            <img
              src={item.img.src}
              alt={item.img.alt}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </motion.div>
        );
      })}
    </div>
  );
};
