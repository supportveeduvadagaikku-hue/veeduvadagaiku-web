import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Heart,
  Share2,
  Phone,
  MessageCircle,
  Building2,
  Store,
  Calendar,
  Maximize2,
  Bed,
  Sofa,
  CheckCircle,
  ShieldCheck,
  Send,
  User,
  Eye,
  Lock,
} from 'lucide-react';
import { useProperty } from '../../hooks/useProperties';
import { useFavourites } from '../../hooks/useFavourites';
import { useCreateEnquiry } from '../../hooks/useEnquiries';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { getWhatsAppShareUrl } from '../../utils/shareUtils';
import { PropertyImageGallery } from '../../components/property/PropertyImageGallery';
import { PhoneLoginModal } from '../../components/auth/PhoneLoginModal';
import { Loader } from '../../components/common/Loader';
import { SEOHead } from '../../components/common/SEOHead';
import { getPropertyCategory, getCategoryBadgeInfo } from '../../utils/categoryUtils';
import toast from 'react-hot-toast';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: propRes, isLoading, error, refetch } = useProperty(id || '');
  const property = propRes?.data;

  const { isFavourite, toggleFavourite, isPending: favPending } = useFavourites();
  const { user, isAuthenticated } = useAuth();
  const { lang, t } = useLanguage();
  const createEnquiryMutation = useCreateEnquiry();

  // Enquiry modal / form state
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPhoneLoginModal, setShowPhoneLoginModal] = useState(false);

  if (isLoading) {
    return <Loader fullScreen text="Loading property details..." />;
  }

  if (error || !property) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
        <p className="text-gray-500 mb-6">
          This listing might have been rented out, removed, or is awaiting verification.
        </p>
        <Link
          to="/properties"
          className="inline-flex px-6 py-2.5 bg-orange-600 text-white font-bold rounded-xl"
        >
          Browse Other Chennai Properties
        </Link>
      </div>
    );
  }

  const favorited = isFavourite(property.id);

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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out this rental property in ${property.locality}, Chennai on Veedu Vadagaikku Chennai:`,
          url,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Property link copied to clipboard!');
    }
  };

  const handleSendEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to send an enquiry');
      return;
    }
    if (!enquiryMessage.trim()) {
      toast.error('Please enter your enquiry message');
      return;
    }

    createEnquiryMutation.mutate(
      {
        propertyId: property.id,
        message: enquiryMessage.trim(),
        phone: enquiryPhone.trim() || undefined,
      },
      {
        onSuccess: () => {
          setEnquiryMessage('');
          setEnquiryPhone('');
          setIsModalOpen(false);
        },
      }
    );
  };

  const ownerPhone = property.owner?.user?.mobile || '';
  const cleanPhone = ownerPhone.replace(/\D/g, '');

  const isTamil =
    property.amenities?.some((a) => a.includes('[LANG:TA]') || a.includes('தமிழ்')) ||
    /[\u0B80-\u0BFF]/.test(property.title || '') ||
    /[\u0B80-\u0BFF]/.test(property.description || '');

  const isUserLoggedInWithMobile = Boolean(user && user.mobile);
  const visibleAmenities = (property.amenities || []).filter(
    (amenity) => !/^\[(?:LANG|CATEGORY|IMG_PRIMARY|IMG_EXTRA):/i.test(amenity)
  );
  const displayDescription = (property.description || '')
    .replace(/\s*\[(?:LANG|CATEGORY):[^\]]+\]/gi, '')
    .trim();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8">
      <SEOHead
        title={`${property.title} in ${property.locality}, Chennai | Veedu Vadagaikku Chennai`}
        description={`${property.propertyType === 'HOUSE' ? 'House' : 'Shop'} for rent in ${
          property.locality
        }, Chennai. Rent: ${formattedRent}/month. Direct owner contact.`}
        image={property.images?.[0]?.imageUrl}
      />

      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <Link to="/" className="hover:text-[#B08B40]">Home</Link>
          <span>/</span>
          {(() => {
            const cat = getPropertyCategory(property);
            const badge = getCategoryBadgeInfo(cat, lang);
            const route =
              cat === 'HOSTEL'
                ? '/hostels'
                : cat === 'MARRIAGE_HALL'
                ? '/marriage-halls'
                : cat === 'SHOP'
                ? '/shops'
                : '/houses';
            return (
              <Link to={route} className="hover:text-[#B08B40]">
                {badge.label}
              </Link>
            );
          })()}
          <span>/</span>
          <span className="text-gray-900 truncate max-w-xs">{property.locality}</span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={getWhatsAppShareUrl(property, lang)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>{t('detail.shareWhatsapp')}</span>
          </a>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{t('detail.share')}</span>
          </button>

          <button
            onClick={() => toggleFavourite(property.id)}
            disabled={favPending}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
              favorited
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
            <span>{favorited ? t('detail.saved') : t('detail.save')}</span>
          </button>
        </div>
      </div>

      {/* Main Images Gallery */}
      <PropertyImageGallery
        images={property.images}
        title={property.title}
        propertyType={property.propertyType}
        propertyId={property.id}
        amenities={property.amenities}
      />

      {/* Main 2-Column Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Property Specs, Details & Amenities */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header & Badges */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const cat = getPropertyCategory(property);
                const badge = getCategoryBadgeInfo(cat, lang);
                const BadgeIcon = badge.Icon;
                return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF4E6] text-[#9A7818] border border-[#E8DFC8]">
                    <BadgeIcon className="w-3.5 h-3.5 text-[#C5A059]" />
                    {badge.label}
                  </span>
                );
              })()}

              {isTamil && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#C59B27] text-white">
                  தமிழ்
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('detail.verified')}
              </span>

              <span className="inline-flex items-center gap-1 text-xs text-gray-400 ml-auto">
                <Eye className="w-3.5 h-3.5" />
                {property.viewCount} {t('detail.views')}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              {property.title}
            </h1>

            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-600">
              <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
              <span>{property.locality}, Chennai, Tamil Nadu</span>
            </div>
          </div>

          {/* Quick Highlights Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="space-y-1">
              <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                <Maximize2 className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">{t('detail.superBuiltUp')}</p>
              <p className="text-sm font-black text-gray-900">{property.propertySize} {t('card.sqft')}</p>
            </div>

            <div className="space-y-1">
              <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                {property.propertyType === 'HOUSE' ? <Bed className="w-4 h-4" /> : <Store className="w-4 h-4" />}
              </div>
              <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">
                {property.propertyType === 'HOUSE' ? 'Bedrooms' : t('card.rooms')}
              </p>
              <p className="text-sm font-black text-gray-900">
                {property.propertyType === 'HOUSE'
                  ? `${property.bedrooms || 1} ${t('card.bhk')}`
                  : `${property.rooms || 1} ${t('card.rooms')}`}
              </p>
            </div>

            <div className="space-y-1">
              <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                <Sofa className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">{t('detail.furnishing')}</p>
              <p className="text-sm font-black text-gray-900 capitalize">
                {property.furnishing === 'FURNISHED'
                  ? t('card.furnished')
                  : property.furnishing === 'SEMI_FURNISHED'
                  ? t('card.semiFurnished')
                  : t('card.unfurnished')}
              </p>
            </div>

            <div className="space-y-1">
              <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                <Calendar className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">{t('detail.availableFrom')}</p>
              <p className="text-sm font-black text-gray-900">
                {new Date(property.availability).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-3">
            <h3 className="text-lg font-black text-gray-900">{t('detail.about')}</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
              {displayDescription}
            </p>
          </div>

          {/* Amenities & Features */}
          {visibleAmenities.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-gray-900">{t('detail.amenities')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {visibleAmenities.map((amenity, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl text-xs font-semibold text-gray-800"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Address */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-2">
            <h3 className="text-lg font-black text-gray-900">{t('detail.address')}</h3>
            <p className="text-sm text-gray-600 font-medium">{property.address}</p>
          </div>
        </div>

        {/* Right Sticky Card: Rent Details & Owner Actions */}
        <div className="lg:col-span-1 sticky top-24 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl space-y-6">
            {/* Rent Pricing Block */}
            <div className="pb-6 border-b border-gray-100 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-black text-gray-900 tracking-tight">
                    {formattedRent}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold ml-1">/ month</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>{t('detail.securityDeposit')}</span>
                <span className="font-bold text-gray-800">{formattedDeposit}</span>
              </div>
            </div>

            {/* Owner Profile Card (White & Lite Gold) */}
            <div className="flex items-center gap-3 p-3.5 bg-[#FCFAF5] rounded-2xl border border-[#E8DFC8]">
              <div className="w-12 h-12 rounded-full bg-[#FAF4E6] text-[#9A7818] border border-[#E8DFC8] flex items-center justify-center font-bold text-base shadow-2xs">
                {property.owner?.user?.name?.charAt(0) || <User className="w-5 h-5 text-[#C5A059]" />}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-gray-900 truncate">
                  {property.owner?.user?.name || 'Chennai Property Owner'}
                </h4>

              </div>
            </div>

            {/* Direct Connect Buttons */}
            <div className="space-y-3">
              {isUserLoggedInWithMobile ? (
                <>
                  {/* Verified Owner Phone Display */}
                  {cleanPhone && (
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-white rounded-xl border border-[#E8DFC8] text-xs font-semibold text-gray-700 shadow-2xs">
                      <span className="text-gray-400">Landlord Mobile</span>
                      <span className="font-mono text-gray-900 font-bold">+91 {cleanPhone.slice(-10)}</span>
                    </div>
                  )}

                  {/* Call Owner Button */}
                  {property.contactPhone && cleanPhone && (
                    <a
                      href={`tel:+91${cleanPhone.slice(-10)}`}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-[#D4AF37] via-[#C5A059] to-[#B8860B] hover:brightness-105 text-white font-bold text-sm rounded-xl shadow-md shadow-[#D4AF37]/25 transition active:scale-95"
                    >
                      <Phone className="w-5 h-5" />
                      <span>{t('detail.callOwner')}</span>
                    </a>
                  )}

                  {/* WhatsApp Button */}
                  {property.contactWhatsapp && cleanPhone && (
                    <a
                      href={`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(
                        lang === 'ta'
                          ? `வணக்கம், நான் உங்கள் சொத்து விளம்பரத்தை வீடு வாடகைக்கு இணையதளத்தில் பார்த்தேன்: "${property.title}" (${property.locality}). இது தற்போது வாடகைக்கு உள்ளதா?`
                          : `Hi, I found your property listing on Veedu Vadagaikku Chennai: "${property.title}" in ${property.locality}. Is it still available for rent?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-sm rounded-xl shadow-md shadow-[#25D366]/20 transition active:scale-95"
                    >
                      <MessageCircle className="w-5 h-5 fill-current" />
                      <span>{t('detail.chatWhatsapp')}</span>
                    </a>
                  )}
                </>
              ) : (
                /* Locked Phone Number State — Requires Login by Mobile Number Only */
                <div className="p-4 bg-[#FCFAF5] rounded-2xl border border-[#E8DFC8] space-y-3 text-center shadow-xs">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-gray-500 font-medium">{t('detail.verifiedOwner')}</span>
                    <span className="font-mono font-bold text-gray-800 tracking-wider">
                      {t('detail.maskedPhone')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPhoneLoginModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-[#D4AF37] via-[#C5A059] to-[#B8860B] hover:brightness-105 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#D4AF37]/25 transition active:scale-95"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{t('detail.loginToViewPhone')}</span>
                  </button>

                  <p className="text-[11px] text-gray-500 leading-snug">
                    {t('detail.loginRequirement')}
                  </p>
                </div>
              )}

              {/* Share Property on WhatsApp Button */}
              <a
                href={getWhatsAppShareUrl(property, lang)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-[#FCFAF5] text-gray-700 hover:text-gray-900 text-xs font-bold rounded-xl border border-[#E8DFC8] transition shadow-2xs"
              >
                <MessageCircle className="w-4 h-4 fill-current text-[#25D366]" />
                <span>
                  {lang === 'ta' ? 'வாட்ஸ்அப்பில் நண்பர்களுக்கு பகிர்க' : 'Share Property on WhatsApp'}
                </span>
              </a>

              {/* Send Enquiry Button */}
              {property.contactEnquiry && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gray-900 hover:bg-black text-white font-extrabold text-sm rounded-xl shadow-sm transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{t('detail.sendEnquiry')}</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-400 text-center leading-normal">
              {t('detail.zeroBrokerage')}
            </p>
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">
                {lang === 'ta' ? 'உரிமையாளருக்கு நேரடி செய்தி' : 'Send Enquiry to Owner'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                x
              </button>
            </div>

            <form onSubmit={handleSendEnquiry} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  {lang === 'ta' ? 'உங்கள் தகவல்' : 'Your Message'}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={
                    lang === 'ta'
                      ? 'வணக்கம், இந்த சொத்தை வாடகைக்கு எடுக்க விரும்புகிறேன். எப்போது நேரில் வந்து பார்க்கலாம்?'
                      : 'Hi, I am interested in renting this property. Please let me know when I can visit.'
                  }
                  value={enquiryMessage}
                  onChange={(e) => setEnquiryMessage(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  {lang === 'ta' ? 'உங்கள் மொபைல் எண் (விருப்பத்தேர்வு)' : 'Contact Phone (Optional)'}
                </label>
                <input
                  type="tel"
                  placeholder={lang === 'ta' ? 'உங்கள் 10 இலக்க மொபைல் எண்' : 'Your mobile number'}
                  value={enquiryPhone}
                  onChange={(e) => setEnquiryPhone(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  {lang === 'ta' ? 'ரத்து' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={createEnquiryMutation.isPending}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {createEnquiryMutation.isPending
                    ? lang === 'ta' ? 'அனுப்பப்படுகிறது...' : 'Sending...'
                    : lang === 'ta' ? 'விசாரணையை சமர்ப்பிக்க' : 'Submit Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Phone Login Modal for Tenants */}
      <PhoneLoginModal
        isOpen={showPhoneLoginModal}
        onClose={() => setShowPhoneLoginModal(false)}
        onSuccess={() => {
          void refetch();
        }}
      />
    </div>
  );
};
