import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PropertyImage } from '../../types';
import { ChevronLeft, ChevronRight, X, Building2 } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';

interface PropertyImageGalleryProps {
  images: PropertyImage[];
  title: string;
  propertyType?: string;
  propertyId?: string;
  amenities?: string[];
}

export const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  images,
  title,
  propertyType,
  propertyId,
  amenities = [],
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // 1. Gather any Base64 images from amenities
  const amenityImages: PropertyImage[] = (amenities || [])
    .filter((a) => (a.startsWith('[IMG_PRIMARY:') || a.startsWith('[IMG_EXTRA:')) && a.endsWith(']'))
    .map((a, idx) => ({
      id: `amenity_img_${idx}`,
      propertyId: propertyId || '',
      imageUrl: a.replace(/^\[IMG_[A-Z]+:/, '').slice(0, -1),
      publicId: `b64_${idx}`,
      isPrimary: a.startsWith('[IMG_PRIMARY:'),
      displayOrder: idx,
      createdAt: new Date().toISOString(),
    }));

  // Uploaded image records are the canonical gallery. Amenity markers are a
  // legacy fallback, and can contain a backup copy of those same uploads.
  const uploadedImages = (images || []).filter(
    (img) => img.imageUrl && !img.imageUrl.includes('indian-properties')
  );
  const validImages = uploadedImages.length > 0 ? uploadedImages : amenityImages;

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLightboxOpen(false);
      if (event.key === 'ArrowLeft' && validImages.length > 1) {
        setSelectedIndex((current) => (current === 0 ? validImages.length - 1 : current - 1));
      }
      if (event.key === 'ArrowRight' && validImages.length > 1) {
        setSelectedIndex((current) => (current === validImages.length - 1 ? 0 : current + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, validImages.length]);

  if (validImages.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden bg-gradient-to-br from-[#FAF7F0] to-[#EFE8D8] border border-[#E8DFC8] flex flex-col items-center justify-center text-gray-400 p-6 text-center">
        <Building2 className="w-12 h-12 text-[#C5A059]/40 mb-2" />
        <span className="text-sm font-bold text-[#8C7647]">Verified Listing</span>
        <span className="text-xs text-gray-400 mt-1">{title}</span>
      </div>
    );
  }

  const activeUrl = getImageUrl(validImages[selectedIndex]?.imageUrl);

  return (
    <div className="space-y-4">
      {/* Main Large Image */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden bg-gray-950 shadow-lg group flex items-center justify-center">
        {/* Ambient Blur Backdrop */}
        {activeUrl && (
          <img
            src={activeUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none select-none"
          />
        )}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          aria-label={`View photo ${selectedIndex + 1} full screen`}
          className="relative z-10 w-full h-full flex items-center justify-center cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <img
            src={activeUrl}
            alt={`${title} - Photo ${selectedIndex + 1}`}
            className="w-full h-full object-contain p-2 max-h-[560px] transition-all duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </button>

        {/* Counter Badge */}
        <div className="absolute bottom-4 right-4 z-20 px-3 py-1 bg-black/70 backdrop-blur-md text-white text-xs font-semibold rounded-full">
          {selectedIndex + 1} / {validImages.length}
        </div>

        {/* Navigation Arrows */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-900 flex items-center justify-center shadow-md transition opacity-90 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-900 flex items-center justify-center shadow-md transition opacity-90 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails strip */}
      {validImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {validImages.map((img, idx) => {
            const thumbUrl = getImageUrl(img.imageUrl);
            return (
              <button
                key={img.id || idx}
                onClick={() => setSelectedIndex(idx)}
                className={`relative flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden border-2 transition ${
                  selectedIndex === idx
                    ? 'border-orange-600 scale-95 shadow-md'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <div className="relative w-full h-full bg-gray-950 flex items-center justify-center">
                  <img
                    src={thumbUrl}
                    alt=""
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isLightboxOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photo viewer`}
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close full-screen image"
            className="absolute right-4 top-4 z-20 rounded-full bg-white/15 p-3 text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative flex h-full w-full max-w-7xl items-center justify-center" onClick={(event) => event.stopPropagation()}>
            {validImages.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous image"
                className="absolute left-1 sm:left-4 z-20 rounded-full bg-white/15 p-3 text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            )}

            <img
              src={activeUrl}
              alt={`${title} - Photo ${selectedIndex + 1}`}
              className="max-h-[calc(100vh-7rem)] max-w-full select-none object-contain"
              draggable={false}
            />

            {validImages.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next image"
                className="absolute right-1 sm:right-4 z-20 rounded-full bg-white/15 p-3 text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            )}
          </div>

          <div className="absolute bottom-4 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white">
            {selectedIndex + 1} / {validImages.length}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
