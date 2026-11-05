import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Maximize2, Sofa, Building2, Store, MessageCircle } from 'lucide-react';
import { Property } from '../../types';
import { useFavourites } from '../../hooks/useFavourites';
import { useLanguage } from '../../context/LanguageContext';
import { getWhatsAppShareUrl } from '../../utils/shareUtils';
import { getPropertyCategory, getCategoryBadgeInfo } from '../../utils/categoryUtils';
import { getImageUrl, getPropertyPrimaryImage } from '../../utils/imageUrl';

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const { isFavourite, toggleFavourite, isPending } = useFavourites();
  const { lang, t } = useLanguage();
  const favorited = isFavourite(property.id);
  const [imgFailed, setImgFailed] = useState(false);

  // Check if listing was posted in Tamil
  const isTamil =
    property.amenities?.some((a) => a.includes('[LANG:TA]') || a.includes('தமிழ்')) ||
    /[\u0B80-\u0BFF]/.test(property.title || '') ||
    /[\u0B80-\u0BFF]/.test(property.description || '');

  // Format currency
  const formattedRent = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(property.rent);

  const formattedDeposit = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(property.deposit);

  // Primary image — resolves from localStorage, database amenities base64, or server images
  const primaryImg = getPropertyPrimaryImage(property);

  const furnishingLabel: Record<string, string> = {
    FURNISHED: t('card.furnished'),
    SEMI_FURNISHED: t('card.semiFurnished'),
    UNFURNISHED: t('card.unfurnished'),
  };

  return (
    <div className="group bg-white rounded-2xl border border-[#EBE3D0] hover:border-[#C5A059] shadow-xs hover:shadow-xl hover:shadow-[#D4AF37]/12 transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Image container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#FAF7F0] to-[#EFE8D8] flex items-center justify-center">
        {primaryImg && !imgFailed ? (
          <>
            {/* Ambient blurred backdrop so the container is richly filled without awkward borders */}
            <img
              src={primaryImg}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover blur-md opacity-25 scale-110 pointer-events-none select-none"
              onError={() => setImgFailed(true)}
            />
            {/* Uncropped, proportional foreground image */}
            <img
              src={primaryImg}
              alt={property.title}
              loading="lazy"
              decoding="async"
              className="relative z-1 w-full h-full object-contain group-hover:scale-102 transition-transform duration-500 p-0.5"
              onError={() => setImgFailed(true)}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 p-4 text-center">
            <Building2 className="w-10 h-10 text-[#C5A059]/40 mb-1" />
            <span className="text-xs font-semibold text-[#8C7647]">Verified Listing</span>
            <span className="text-[10px] text-gray-400">{property.locality}, Chennai</span>
          </div>
        )}

        {/* Badges container */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          {/* Direct Owner Connect Tag */}
          <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md text-[#9A7818] border border-[#E8DFC8] text-[11px] font-bold rounded-lg shadow-xs">
            {lang === 'ta' ? 'நேரடி தொடர்பு' : 'Direct Owner'}
          </span>

          {(() => {
            const category = getPropertyCategory(property);
            const badge = getCategoryBadgeInfo(category, lang);
            const BadgeIcon = badge.Icon;
            return (
              <div className={`flex items-center gap-1 px-2.5 py-1 ${badge.badgeBg} ${badge.badgeText} border ${badge.badgeBorder} backdrop-blur-md text-[11px] font-semibold rounded-lg shadow-xs`}>
                <BadgeIcon className="w-3 h-3 text-[#D4AF37]" />
                <span>{badge.label}</span>
              </div>
            );
          })()}

          {isTamil && (
            <span className="px-2 py-1 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white text-[10px] font-bold rounded-lg shadow-xs">
              தமிழ்
            </span>
          )}
        </div>

        {/* Favourite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavourite(property.id);
          }}
          disabled={isPending}
          aria-label="Save Property"
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
            favorited
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-white/90 text-gray-700 hover:bg-white hover:text-red-500 shadow-xs'
          }`}
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
        </button>

        {/* Rent Highlight Ribbon */}
        <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-white/95 backdrop-blur-md border border-[#E8DFC8] rounded-xl shadow-md">
          <div className="text-base font-bold text-[#1E2329] leading-none">{formattedRent}</div>
          <span className="text-[10px] font-semibold text-[#9A7818]">{t('card.perMonth')}</span>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Locality */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1">
            <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
            <span className="truncate">{property.locality}, Chennai</span>
          </div>

          {/* Title */}
          <Link to={`/property/${property.id}`}>
            <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1 group-hover:text-[#B08B40] transition">
              {property.title}
            </h3>
          </Link>
        </div>

        {/* 3-Column Spec Box */}
        <div className="bg-[#FCFAF5] rounded-xl p-2.5 border border-[#EFE8D8] grid grid-cols-3 divide-x divide-[#EFE8D8] text-center text-xs">
          <div className="px-1">
            <span className="text-[10px] text-gray-400 block font-medium uppercase tracking-wider">{t('card.deposit')}</span>
            <span className="font-bold text-gray-800 truncate block mt-0.5">{formattedDeposit}</span>
          </div>

          <div className="px-1">
            {(() => {
              const cat = getPropertyCategory(property);
              if (cat === 'MARRIAGE_HALL') {
                return (
                  <>
                    <span className="text-[10px] text-gray-400 block font-medium uppercase tracking-wider">
                      {lang === 'ta' ? 'அரங்கம்' : 'Hall Space'}
                    </span>
                    <span className="font-bold text-gray-800 truncate block mt-0.5">
                      {property.rooms ? `${property.rooms * 100} Pax` : 'Grand Hall'}
                    </span>
                  </>
                );
              }
              if (cat === 'HOSTEL') {
                return (
                  <>
                    <span className="text-[10px] text-gray-400 block font-medium uppercase tracking-wider">
                      {lang === 'ta' ? 'படுக்கை' : 'Sharing / Beds'}
                    </span>
                    <span className="font-bold text-gray-800 truncate block mt-0.5">
                      {property.bedrooms ? `${property.bedrooms} Sharing` : `${property.rooms || 1} Rooms`}
                    </span>
                  </>
                );
              }
              return (
                <>
                  <span className="text-[10px] text-gray-400 block font-medium uppercase tracking-wider">
                    {property.propertyType === 'HOUSE' ? t('card.bhk') : t('card.rooms')}
                  </span>
                  <span className="font-bold text-gray-800 truncate block mt-0.5">
                    {property.bedrooms ? `${property.bedrooms} BHK` : `${property.rooms || 1} Rooms`}
                  </span>
                </>
              );
            })()}
          </div>

          <div className="px-1">
            <span className="text-[10px] text-gray-400 block font-medium uppercase tracking-wider">{t('card.sqft')}</span>
            <span className="font-bold text-gray-800 truncate block mt-0.5">{property.propertySize} sq.ft</span>
          </div>
        </div>

        {/* Card Footer: WhatsApp direct share & View / Get Owner Details button */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <div className="text-[11px] text-gray-500 font-medium truncate">
            {furnishingLabel[property.furnishing] || t('card.unfurnished')}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={getWhatsAppShareUrl(property, lang)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={t('card.shareWhatsapp')}
              aria-label="Share on WhatsApp"
              className="p-2 bg-[#FCFAF5] hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-xl border border-[#E8DFC8] transition-all shadow-2xs flex items-center justify-center active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
            </a>

            <Link
              to={`/property/${property.id}`}
              className="px-3.5 py-2 bg-gradient-to-r from-[#D4AF37] via-[#C5A059] to-[#B8860B] hover:brightness-105 text-white font-bold text-xs rounded-xl transition-all shadow-xs shadow-[#D4AF37]/20"
            >
              {t('card.viewDetails')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
