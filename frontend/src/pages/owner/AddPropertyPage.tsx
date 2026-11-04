import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyService } from '../../services/property.service';
import { useLocalities } from '../../hooks/useProperties';
import { ImageUploader } from '../../components/property/ImageUploader';
import { PhoneOTPForm } from '../../components/auth/PhoneOTPForm';
import { useAuth } from '../../hooks/useAuth';
import { compressImageToBase64 } from '../../utils/imageCompression';
import { SEOHead } from '../../components/common/SEOHead';
import {
  Building2,
  Building,
  Store,
  Users,
  PartyPopper,
  UploadCloud,
  CheckCircle,
  ArrowRight,
  Info,
  MapPin,
  Navigation,
  Crosshair,
  Sparkles,
  Bath,
  Car,
  Dog,
  Dumbbell,
  ShieldCheck,
  Zap,
  Droplets,
  Wind,
  Wifi,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { COMMERCIAL_SUBTYPES } from '../../utils/categoryUtils';
import { CHENNAI_LOCALITIES } from '../../utils/chennaiLocalities';
import { getNavaratriOffer, isOfferActive } from '../../config/offersConfig';

export const AddPropertyPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hasVerifiedMobile = Boolean(user?.mobile);
  const { data: localitiesData } = useLocalities();
  const localities = (Array.isArray(localitiesData) && localitiesData.length > 0) ? localitiesData : CHENNAI_LOCALITIES;

  // Listing Language state (English or Tamil)
  const [listingLanguage, setListingLanguage] = useState<'EN' | 'TA'>('EN');

  // Form states
  const [category, setCategory] = useState<'HOUSE' | 'APARTMENT' | 'SHOP' | 'HOSTEL' | 'MARRIAGE_HALL'>('HOUSE');
  const [commercialSubtype, setCommercialSubtype] = useState<string>('Shop');
  const [propertyType, setPropertyType] = useState<'HOUSE' | 'SHOP'>('HOUSE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [propertySize, setPropertySize] = useState('');
  const [bedrooms, setBedrooms] = useState('2');
  const [rooms, setRooms] = useState('1');
  const [furnishing, setFurnishing] = useState<'UNFURNISHED' | 'SEMI_FURNISHED' | 'FURNISHED'>('UNFURNISHED');
  const [availability, setAvailability] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [contactPhone, setContactPhone] = useState(true);
  const [contactWhatsapp, setContactWhatsapp] = useState(true);
  const [contactEnquiry, setContactEnquiry] = useState(true);

  // NoBroker-style Property Specifics
  const [bathrooms, setBathrooms] = useState('2');
  const [balconies, setBalconies] = useState('1');
  const [attachedBathroom, setAttachedBathroom] = useState(true);

  // Parking
  const [parkingBike, setParkingBike] = useState(true);
  const [parkingCar, setParkingCar] = useState(false);
  const [parkingCovered, setParkingCovered] = useState(false);

  // Tenant Preferences (NoBroker)
  const [petFriendly, setPetFriendly] = useState(false);
  const [bachelorsAllowed, setBachelorsAllowed] = useState(false);
  const [familyOnly, setFamilyOnly] = useState(true);
  const [vegetarianOnly, setVegetarianOnly] = useState(false);
  const [nonVegAllowed, setNonVegAllowed] = useState(true);

  // Amenities checklist
  const [gym, setGym] = useState(false);
  const [lift, setLift] = useState(false);
  const [powerBackup, setPowerBackup] = useState(false);
  const [waterMetro, setWaterMetro] = useState(true);
  const [waterBorewell, setWaterBorewell] = useState(false);
  const [securityCCTV, setSecurityCCTV] = useState(false);
  const [swimmingPool, setSwimmingPool] = useState(false);
  const [gatedCommunity, setGatedCommunity] = useState(false);
  const [ac, setAc] = useState(false);
  const [modularKitchen, setModularKitchen] = useState(false);
  const [geyser, setGeyser] = useState(false);
  const [washingArea, setWashingArea] = useState(false);
  const [wifi, setWifi] = useState(false);
  const [pipedGas, setPipedGas] = useState(false);
  const [clubhouse, setClubhouse] = useState(false);
  const [privateTerrace, setPrivateTerrace] = useState(false);
  const [nearMetro, setNearMetro] = useState(false);
  const [nearBusStand, setNearBusStand] = useState(false);

  // Category specific additional amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Images to upload
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick popular Chennai localities
  const popularLocalities = [
    'Kodambakkam',
    'Vadapalani',
    'T. Nagar',
    'Anna Nagar',
    'Velachery',
    'Adyar',
    'Porur',
    'Besant Nagar',
    'Mylapore',
    'Nungambakkam',
    'Tambaram',
    'Ashok Nagar',
  ];

  // Geolocation detector
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        try {
          // OpenStreetMap Nominatim reverse geocode
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`
          );
          const data = await response.json();
          const addr = data.address || {};
          const detectedCandidates = [
            addr.suburb,
            addr.neighbourhood,
            addr.residential,
            addr.city_district,
            addr.county,
            addr.town,
          ].filter(Boolean) as string[];

          // Match with Chennai localities
          let foundLocality = '';
          for (const cand of detectedCandidates) {
            const match = localities.find(
              (loc) =>
                loc.toLowerCase().includes(cand.toLowerCase()) ||
                cand.toLowerCase().includes(loc.toLowerCase())
            );
            if (match) {
              foundLocality = match;
              break;
            }
          }

          if (foundLocality) {
            setLocality(foundLocality);
            toast.success(`Mapped to Chennai locality: ${foundLocality}`);
          } else if (detectedCandidates.length > 0) {
            toast.success(`Area detected: ${detectedCandidates[0]}. Select matching locality below.`);
          } else {
            toast.success('Current location GPS coordinates mapped!');
          }
        } catch {
          toast.success('Current location GPS coordinates mapped!');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        toast.error('Could not detect location. Please select your locality below.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const shopAmenitiesListEn = [
    'Main Road Facing',
    'Heavy Footfall Zone',
    'High Ceiling',
    'Three Phase Electricity',
    'Glass Frontage',
    'Rolling Shutter Installed',
    'Water Connection Inside',
    'Dedicated Customer Parking',
    'Attached Restroom',
    'Loading / Unloading Bay',
  ];

  const shopAmenitiesListTa = [
    'மெயின் ரோடு வசதி (Main Road Facing)',
    'அதிக மக்கள் நடமாட்டம் (Heavy Footfall)',
    'உயரமான கூரை (High Ceiling)',
    '3 பேஸ் மின்சாரம் (Three Phase Power)',
    'கண்ணாடி முகப்பு (Glass Frontage)',
    'ரோலிங் ஷட்டர் (Rolling Shutter)',
    'குடிநீர் இணைப்பு (Water Connection)',
    'வாடிக்கையாளர் பார்க்கிங் (Customer Parking)',
    'இணைக்கப்பட்ட கழிப்பறை (Attached Restroom)',
    'ஏற்றுதல் / இறக்குதல் வசதி (Loading Bay)',
  ];

  const hostelAmenitiesListEn = [
    'Nutritious Food Provided (3 Times)',
    'High-Speed Wi-Fi',
    'Washing Machine & Laundry',
    '24/7 Warden & Security',
    'CCTV Surveillance',
    'Attached Restroom / Geyser',
    'Air Conditioner (AC)',
    'Purified RO Drinking Water',
    'Daily Housekeeping',
    'Two Wheeler Parking',
  ];

  const hostelAmenitiesListTa = [
    '3 வேளை சத்தான உணவு (Food Provided)',
    'வைஃபை இணைய வசதி (Wi-Fi)',
    'வாஷிங் மெஷின் வசதி (Washing Machine)',
    '24/7 வார்டன் & பாதுகாப்பு (Security)',
    'CCTV கேமரா கண்காணிப்பு',
    'அட்டாச்டு பாத்ரூம் & கீசர் (Geyser)',
    'ஏசி வசதி (Air Conditioner)',
    'RO சுத்திகரிக்கப்பட்ட குடிநீர் (RO Water)',
    'தினசரி துப்புரவு (Daily Cleaning)',
    'பைக் பார்க்கிங் (Bike Parking)',
  ];

  const marriageHallAmenitiesListEn = [
    'Air Conditioned Central Hall (AC)',
    'Spacious Dining Hall (500+ Seating)',
    'Bride & Groom AC Deluxe Rooms',
    'High Capacity Generator Backup',
    'Dedicated Car Parking (100+ Cars)',
    'Modern Commercial Kitchen & Vessels',
    'Grand Stage & Lighting Setup',
    'Lift / Elevator for Elders',
    'Audio PA Sound System Installed',
    'Near Bus Depot & Main Road Access',
  ];

  const marriageHallAmenitiesListTa = [
    'மைய குளிர்சாதன அரங்கம் (Central AC Hall)',
    'விசாலமான உணவுக்கூடம் (Dining Hall 500+)',
    'மணமக்கள் ஏசி சொகுசு அறைகள் (Bride/Groom Rooms)',
    'முழு மின் ஜெனரேட்டர் பேக்கப் (Generator)',
    'பிரமாண்ட கார் பார்க்கிங் (100+ Cars Parking)',
    'நவீன சமையலறை & பாத்திரங்கள் (Kitchen)',
    'பிரம்மாண்ட மேடை & அலங்கார விளக்குகள் (Stage)',
    'லிப்ட் வசதி (Lift / Elevator)',
    'அதிநவீன ஒலி பெருக்கி வசதி (Sound System)',
    'பிரதான சாலை & பஸ் ஸ்டாண்ட் அருகில்',
  ];

  const categorySpecificAmenities =
    category === 'HOSTEL'
      ? listingLanguage === 'TA'
        ? hostelAmenitiesListTa
        : hostelAmenitiesListEn
      : category === 'MARRIAGE_HALL'
      ? listingLanguage === 'TA'
        ? marriageHallAmenitiesListTa
        : marriageHallAmenitiesListEn
      : category === 'SHOP'
      ? listingLanguage === 'TA'
        ? shopAmenitiesListTa
        : shopAmenitiesListEn
      : [];

  const toggleCategoryAmenity = (name: string) => {
    if (selectedAmenities.includes(name)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== name));
    } else {
      setSelectedAmenities([...selectedAmenities, name]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasVerifiedMobile) {
      toast.error('Verify your mobile number with OTP before posting a property.');
      return;
    }

    if (!locality) {
      toast.error('Please select a Chennai locality or detect your current location');
      return;
    }
    if (files.length === 0) {
      toast.error('Please upload at least 1 photo of the property');
      return;
    }

    try {
      setIsSubmitting(true);

      let finalDesc = description.trim();
      const compiledAmenities = new Set<string>();

      if (listingLanguage === 'TA') {
        compiledAmenities.add('[LANG:TA]');
      }

      if (category === 'HOSTEL') {
        if (!finalDesc.includes('[CATEGORY:HOSTEL]')) {
          finalDesc = `${finalDesc}\n\n[CATEGORY:HOSTEL]`;
        }
        compiledAmenities.add('[CATEGORY:HOSTEL]');
      } else if (category === 'MARRIAGE_HALL') {
        if (!finalDesc.includes('[CATEGORY:MARRIAGE_HALL]')) {
          finalDesc = `${finalDesc}\n\n[CATEGORY:MARRIAGE_HALL]`;
        }
        compiledAmenities.add('[CATEGORY:MARRIAGE_HALL]');
      } else if (category === 'APARTMENT') {
        if (!finalDesc.includes('[CATEGORY:APARTMENT]')) {
          finalDesc = `${finalDesc}\n\n[CATEGORY:APARTMENT]`;
        }
        compiledAmenities.add('[CATEGORY:APARTMENT]');
      } else if (category === 'SHOP') {
        const tag = `[COMMERCIAL:${commercialSubtype.toUpperCase().replace(/\s+/g, '_')}]`;
        if (!finalDesc.includes(tag)) {
          finalDesc = `${finalDesc}\n\n${tag}`;
        }
        compiledAmenities.add(commercialSubtype);
        compiledAmenities.add(tag);
      }

      // Add NoBroker checkboxes to amenities list
      if (category === 'HOUSE' || category === 'APARTMENT' || category === 'HOSTEL') {
        compiledAmenities.add(`${bathrooms} ${parseInt(bathrooms) === 1 ? 'Bathroom' : 'Bathrooms'}`);
        if (attachedBathroom) compiledAmenities.add('Attached Bathroom');
        if (balconies !== '0') compiledAmenities.add(`${balconies} ${parseInt(balconies) === 1 ? 'Balcony' : 'Balconies'}`);
      }

      if (parkingBike) compiledAmenities.add('Two Wheeler / Bike Parking');
      if (parkingCar) compiledAmenities.add('Car Parking');
      if (parkingCovered) compiledAmenities.add('Covered Car Parking');

      if (petFriendly) compiledAmenities.add('Pet Friendly (Pets Allowed)');
      if (bachelorsAllowed) compiledAmenities.add('Bachelors Allowed');
      if (familyOnly) compiledAmenities.add('Family Only Preferred');
      if (vegetarianOnly) compiledAmenities.add('Vegetarians Only');
      if (nonVegAllowed) compiledAmenities.add('Non-Veg Allowed');

      if (gym) compiledAmenities.add('Gym / Fitness Centre');
      if (lift) compiledAmenities.add('Lift / Elevator');
      if (powerBackup) compiledAmenities.add('100% Power Backup');
      if (waterMetro) compiledAmenities.add('24/7 Metro Water');
      if (waterBorewell) compiledAmenities.add('Borewell Water Supply');
      if (securityCCTV) compiledAmenities.add('24/7 Security & CCTV');
      if (gatedCommunity) compiledAmenities.add('Gated Community');
      if (swimmingPool) compiledAmenities.add('Swimming Pool');
      if (ac) compiledAmenities.add('Air Conditioner (AC)');
      if (modularKitchen) compiledAmenities.add('Modular Kitchen');
      if (geyser) compiledAmenities.add('Geyser / Water Heater');
      if (washingArea) compiledAmenities.add('Utility / Washing Area');
      if (wifi) compiledAmenities.add('High-Speed WiFi Ready');
      if (pipedGas) compiledAmenities.add('Piped Gas Connection');
      if (clubhouse) compiledAmenities.add('Clubhouse / Community Hall');
      if (privateTerrace) compiledAmenities.add('Private Terrace / Garden');
      if (nearMetro) compiledAmenities.add('Near Metro Station');
      if (nearBusStand) compiledAmenities.add('Near Bus Stand');

      // Add any category specific amenities
      selectedAmenities.forEach((a) => compiledAmenities.add(a));

      // Compress uploaded photos into clean Base64 JPEGs (~100KB) to persist directly in PostgreSQL
      const base64Photos: string[] = [];
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        try {
          const b64 = await compressImageToBase64(files[i]);
          if (b64) base64Photos.push(b64);
        } catch {
          // Ignore
        }
      }

      const finalAmenities = Array.from(compiledAmenities);
      if (base64Photos[0]) {
        finalAmenities.push(`[IMG_PRIMARY:${base64Photos[0]}]`);
      }
      for (let i = 1; i < base64Photos.length; i++) {
        finalAmenities.push(`[IMG_EXTRA:${base64Photos[i]}]`);
      }

      // Step 1: Create draft property
      const res = await propertyService.createProperty({
        propertyType: category === 'SHOP' || category === 'MARRIAGE_HALL' ? 'SHOP' : 'HOUSE',
        title: title.trim(),
        description: finalDesc,
        rent: parseFloat(rent),
        deposit: parseFloat(deposit),
        locality,
        address: address.trim() || `${locality}, Chennai`,
        latitude,
        longitude,
        propertySize: parseFloat(propertySize),
        bedrooms: category === 'HOUSE' || category === 'APARTMENT' || category === 'HOSTEL' ? parseInt(bedrooms) : null,
        rooms: category === 'SHOP' || category === 'MARRIAGE_HALL' ? parseInt(rooms) : null,
        furnishing,
        amenities: finalAmenities,
        availability: new Date(availability).toISOString(),
        contactPhone,
        contactWhatsapp,
        contactEnquiry,
      });

      const newPropertyId = res.data.id;

      // Step 2: Upload images and cache locally
      if (files.length > 0) {
        if (base64Photos[0]) {
          try {
            localStorage.setItem(`owner_prop_img_${newPropertyId}`, base64Photos[0]);
          } catch {
            // Ignore quota
          }
        }

        try {
          await propertyService.uploadImages(newPropertyId, files);
        } catch {
          // Non-fatal: base64 is already safely stored in PostgreSQL amenities array
        }
      }

      queryClient.invalidateQueries({ queryKey: ['ownerProperties'] });
      toast.success('Property details saved! Please choose your listing plan to proceed.');

      // Step 3: Redirect to Listing Plans & Payment page
      navigate(`/owner/payment?propertyId=${newPropertyId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <SEOHead title="Add New Property | Veedu Vadagaikku Chennai" />

      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          List Your Chennai Property
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Provide your locality, property specs, and photos. Your listing is 100% free and submitted directly for admin review.
        </p>
      </div>

      {/* Navaratri Festive Offer Active Banner */}
      {isOfferActive(getNavaratriOffer()) && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <p className="font-black text-sm sm:text-base">
                Deepavali Special Offer Active: Post This Property 100% FREE!
              </p>
              <p className="text-xs text-amber-100 font-medium">
                ₹0 posting fee with the Navaratri Free Posting Plan. No credit card or payment required.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-white text-orange-600 font-extrabold text-xs shrink-0 shadow-xs">
            Save ₹222+
          </span>
        </div>
      )}

      {!hasVerifiedMobile && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-black text-gray-900">Verify your mobile number to post</h2>
            <p className="text-sm text-gray-600 mt-1">
              We’ll send a one-time password by SMS. Your verified number will be used as the owner contact for your listing.
            </p>
          </div>
          <PhoneOTPForm
            role="OWNER"
            mode="link-phone"
            containerId="owner-property-phone-recaptcha"
            onSuccess={() => toast.success('Phone verified. You can now post your property.')}
          />
        </section>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Listing Language Selection */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              1. Listing Language / விளம்பர மொழி
            </label>
            <span className="text-xs font-semibold text-[#9A7818]">
              {listingLanguage === 'TA' ? 'தமிழில் விளம்பரம் தேர்வு செய்யப்பட்டுள்ளது' : 'English listing selected'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setListingLanguage('EN');
                setSelectedAmenities([]);
              }}
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition ${
                listingLanguage === 'EN'
                  ? 'border-[#C5A059] bg-[#FAF4E6] text-gray-900 font-bold shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <span className="text-xs font-black px-2.5 py-1.5 bg-[#FAF4E6] text-[#9A7818] border border-[#E8DFC8] rounded-xl">EN</span>
              <div className="text-left">
                <div className="text-sm font-bold">English</div>
                <div className="text-[11px] text-gray-500">Post details in English</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setListingLanguage('TA');
                setSelectedAmenities([]);
              }}
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition ${
                listingLanguage === 'TA'
                  ? 'border-[#C5A059] bg-[#FAF4E6] text-gray-900 font-bold shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <span className="text-xs font-black px-2.5 py-1.5 bg-[#FAF4E6] text-[#9A7818] border border-[#E8DFC8] rounded-xl">தமிழ்</span>
              <div className="text-left">
                <div className="text-sm font-bold">தமிழ் (Tamil)</div>
                <div className="text-[11px] text-gray-500">தமிழில் பதிவேற்றுக</div>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Property Category */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE8D8] shadow-xs space-y-4">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            2. Select Property Category / சொத்து பிரிவு
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. House */}
            <button
              type="button"
              onClick={() => {
                setCategory('HOUSE');
                setPropertyType('HOUSE');
                setSelectedAmenities([]);
              }}
              className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition text-left ${
                category === 'HOUSE'
                  ? 'border-[#C5A059] bg-[#FAF4E6] text-gray-900 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="p-3 bg-white text-[#9A7818] border border-[#E8DFC8] rounded-xl shrink-0">
                <Building2 className="w-6 h-6 text-[#C5A059]" />
              </div>
              <div>
                <div className="text-base font-bold">
                  {listingLanguage === 'TA' ? 'தனி வீடு / வில்லா (House / Villa)' : 'Independent House / Villa'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  1BHK, 2BHK, 3BHK, Independent House, Villa
                </div>
              </div>
            </button>

            {/* 2. Apartment / Flat */}
            <button
              type="button"
              onClick={() => {
                setCategory('APARTMENT');
                setPropertyType('HOUSE');
                setSelectedAmenities([]);
              }}
              className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition text-left ${
                category === 'APARTMENT'
                  ? 'border-[#C5A059] bg-[#FAF4E6] text-gray-900 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="p-3 bg-white text-[#9A7818] border border-[#E8DFC8] rounded-xl shrink-0">
                <Building className="w-6 h-6 text-[#C5A059]" />
              </div>
              <div>
                <div className="text-base font-bold">
                  {listingLanguage === 'TA' ? 'அபார்ட்மெண்ட் / பிளாட் (Apartment / Flat)' : 'Apartment / Flat / Community'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Gated Community, High-rise Flat, Multi-storey
                </div>
              </div>
            </button>

            {/* 2. Commercial Shop */}
            <button
              type="button"
              onClick={() => {
                setCategory('SHOP');
                setPropertyType('SHOP');
                setSelectedAmenities([]);
              }}
              className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition text-left ${
                category === 'SHOP'
                  ? 'border-[#C5A059] bg-[#FAF4E6] text-gray-900 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="p-3 bg-white text-[#9A7818] border border-[#E8DFC8] rounded-xl shrink-0">
                <Store className="w-6 h-6 text-[#C5A059]" />
              </div>
              <div>
                <div className="text-base font-bold">
                  {listingLanguage === 'TA' ? 'கடை / வணிக கட்டிடம் (Shops / Commercial Buildings)' : 'Shops / Commercial Buildings'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Retail Store, Showroom, Office, Clinic, Godown, Building
                </div>
              </div>
            </button>

            {/* 3. Hostel */}
            <button
              type="button"
              onClick={() => {
                setCategory('HOSTEL');
                setPropertyType('HOUSE');
                setSelectedAmenities([]);
              }}
              className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition text-left ${
                category === 'HOSTEL'
                  ? 'border-[#C5A059] bg-[#FAF4E6] text-gray-900 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="p-3 bg-white text-[#9A7818] border border-[#E8DFC8] rounded-xl shrink-0">
                <Users className="w-6 h-6 text-[#C5A059]" />
              </div>
              <div>
                <div className="text-base font-bold">
                  {listingLanguage === 'TA' ? 'விடுதி / பி.ஜி (Hostel / PG / Coliving)' : 'Hostel / PG / Co-Living'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Men's PG, Women's Hostel, Shared rooms
                </div>
              </div>
            </button>

            {/* 4. Marriage Hall */}
            <button
              type="button"
              onClick={() => {
                setCategory('MARRIAGE_HALL');
                setPropertyType('SHOP');
                setSelectedAmenities([]);
              }}
              className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition text-left ${
                category === 'MARRIAGE_HALL'
                  ? 'border-[#C5A059] bg-[#FAF4E6] text-gray-900 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="p-3 bg-white text-[#9A7818] border border-[#E8DFC8] rounded-xl shrink-0">
                <PartyPopper className="w-6 h-6 text-[#C5A059]" />
              </div>
              <div>
                <div className="text-base font-bold">
                  {listingLanguage === 'TA' ? 'திருமண மண்டபம் / மஹால் (Marriage Hall)' : 'Marriage Hall / Mandapam'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Kalyana Mandapam, Mini Hall, Party Hall
                </div>
              </div>
            </button>
          </div>

          {/* Commercial Subtype Selector (Image 2) */}
          {category === 'SHOP' && (
            <div className="pt-4 border-t border-gray-100 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {listingLanguage === 'TA' ? 'வணிக சொத்து வகை (Commercial Type)' : 'Commercial Subtype'}
                </label>
                <span className="text-[11px] font-semibold text-[#9A7818]">
                  {commercialSubtype}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {listingLanguage === 'TA'
                  ? 'சரியான வணிக வகையைத் தேர்வு செய்யவும் (எ.கா: கடை, ஷோரூம், அலுவலகம், கிடங்கு)'
                  : 'Select the exact commercial subtype for targeted tenant inquiries (e.g. Shop, Office, Showroom, Warehouse)'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {COMMERCIAL_SUBTYPES.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setCommercialSubtype(sub.label)}
                    className={`p-3 rounded-xl text-xs font-bold border text-center transition ${
                      commercialSubtype === sub.label
                        ? 'bg-[#FAF4E6] border-[#C5A059] text-[#9A7818] shadow-xs'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {listingLanguage === 'TA' ? sub.labelTa : sub.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Location & Locality Mapping */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                3. Property Location & Locality / இருப்பிடம்
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Map your property by Chennai locality (e.g. Kodambakkam, Vadapalani). Full street address is completely optional.
              </p>
            </div>

            {/* GPS Geolocation Button */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FAF4E6] hover:bg-[#F3E8CD] border border-[#E8DFC8] text-[#9A7818] font-bold text-xs rounded-xl shadow-2xs transition active:scale-95 disabled:opacity-50 shrink-0"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting Location...' : 'Use Current Location (GPS)'}</span>
            </button>
          </div>

          {/* Quick Locality Pick Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Popular Chennai Localities (1-Click Select):
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {popularLocalities.map((popLoc) => {
                const fullLoc = localities.find((l) => l.toLowerCase().startsWith(popLoc.toLowerCase())) || popLoc;
                const isSelected = locality === popLoc || locality === fullLoc || locality.toLowerCase().startsWith(popLoc.toLowerCase());
                return (
                  <button
                    key={popLoc}
                    type="button"
                    onClick={() => setLocality(fullLoc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#C5A059] text-white shadow-2xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{popLoc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locality Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              All Chennai Localities
            </label>
            <select
              required
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#C5A059] cursor-pointer"
            >
              <option value="">Select Chennai Area</option>
              {localities.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {latitude && longitude && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
              <span className="flex items-center gap-2 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>GPS Coordinates Mapped: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
              </span>
              <span className="text-[11px] text-emerald-700">Locality: {locality || 'Detected'}</span>
            </div>
          )}

          {/* Full Physical Address (Optional Toggle) */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-700">
              <input
                type="checkbox"
                checked={showFullAddress}
                onChange={(e) => setShowFullAddress(e.target.checked)}
                className="w-4 h-4 text-[#C5A059] rounded focus:ring-[#C5A059]"
              />
              <span>Add full street address / door no (Optional)</span>
            </label>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              By default, only your Locality ({locality || 'e.g. Kodambakkam, Chennai'}) will be shown publicly to protect your privacy. Check the box above if you want to provide door number, street, or landmark details.
            </p>

            {showFullAddress && (
              <div className="pt-1">
                <textarea
                  rows={2}
                  placeholder={
                    listingLanguage === 'TA'
                      ? 'கதவு எண் 14, 2வது மெயின் ரோடு, சாந்தி தியேட்டர் அருகில், சென்னை'
                      : 'Door No. 14, 2nd Main Road, Near Landmark, Chennai'
                  }
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Basic Property Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            4. Property Details & Pricing
          </label>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Listing Title
              </label>
              <input
                type="text"
                required
                minLength={5}
                maxLength={100}
                placeholder={
                  category === 'HOUSE'
                    ? 'Spacious 2 BHK Apartment near Kodambakkam Railway Station'
                    : category === 'SHOP'
                    ? 'Prime Ground Floor Commercial Retail Shop on Vadapalani Main Road'
                    : category === 'HOSTEL'
                    ? "Deluxe Men's PG & Hostel with Food & AC in Anna Nagar"
                    : 'Grand Air Conditioned Marriage Hall with Dining in Adyar'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Monthly Rent / Lease Amount (₹)
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">No maximum limit (₹1 to Infinity)</span>
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="25000 (e.g. 50,000+)"
                  value={rent}
                  onChange={(e) => setRent(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Security Deposit / Advance (₹)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="100000"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Super Built-up Area (Sq.Ft)
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  placeholder="1150"
                  value={propertySize}
                  onChange={(e) => setPropertySize(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              {category === 'HOUSE' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Bedrooms (BHK)
                  </label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059] cursor-pointer"
                  >
                    <option value="1">1 BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4 BHK</option>
                    <option value="5">5+ BHK</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Number of Rooms / Spaces
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  {listingLanguage === 'TA' ? 'பர்னிச்சர் வசதி (Furnishing)' : 'Furnishing Status'}
                </label>
                <select
                  value={furnishing}
                  onChange={(e) => setFurnishing(e.target.value as any)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                >
                  <option value="UNFURNISHED">Unfurnished</option>
                  <option value="SEMI_FURNISHED">Semi-Furnished</option>
                  <option value="FURNISHED">Fully Furnished</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  {listingLanguage === 'TA' ? 'வாடகைக்கு கிடைக்கும் நாள்' : 'Available From Date'}
                </label>
                <input
                  type="date"
                  required
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                {listingLanguage === 'TA' ? 'முழு விவரங்கள் (Description)' : 'Detailed Property Description'}
              </label>
              <textarea
                rows={3}
                required
                minLength={20}
                placeholder={
                  listingLanguage === 'TA'
                    ? 'வீட்டின் சிறப்பம்சங்கள், மெட்ரோ குடிநீர் வசதி, கார் பார்க்கிங், அருகிலுள்ள பேருந்து/மெட்ரோ நிலையங்கள், வாடகை நிபந்தனைகள்...'
                    : 'Highlight ventilation, neighborhood advantages, water sources, natural light, preferred tenants, etc.'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              />
            </div>
          </div>
        </div>

        {/* Step 5: NoBroker-Style Checkboxes (Bathrooms, Balcony, Parking, Pets, Gym) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C5A059]" />
              <span>5. Property Specifics & Checklists</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Select bathrooms, balconies, parking, tenant restrictions, and society amenities.
            </p>
          </div>

          {/* Section A: Bathrooms & Balconies */}
          {(category === 'HOUSE' || category === 'HOSTEL') && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Bathrooms & Balconies
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bathrooms count */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <label className="block text-xs font-bold text-gray-800">
                    Number of Bathrooms
                  </label>
                  <div className="flex gap-2">
                    {['1', '2', '3', '4+'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBathrooms(num)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                          bathrooms === num
                            ? 'bg-[#C5A059] border-[#C5A059] text-white shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 pt-2 cursor-pointer text-xs font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={attachedBathroom}
                      onChange={(e) => setAttachedBathroom(e.target.checked)}
                      className="w-4 h-4 text-[#C5A059] rounded focus:ring-[#C5A059]"
                    />
                    <span>Attached Bathroom in Bedroom(s)</span>
                  </label>
                </div>

                {/* Balconies count */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <label className="block text-xs font-bold text-gray-800">
                    Number of Balconies
                  </label>
                  <div className="flex gap-2">
                    {['0', '1', '2', '3+'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBalconies(num)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                          balconies === num
                            ? 'bg-[#C5A059] border-[#C5A059] text-white shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {num === '0' ? 'None' : `${num} Balcony`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section B: Vehicular Parking */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Parking Facilities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  parkingBike
                    ? 'border-[#C5A059] bg-[#FCFAF5] font-bold text-gray-900 shadow-2xs'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={parkingBike}
                  onChange={(e) => setParkingBike(e.target.checked)}
                  className="w-4 h-4 text-[#C5A059] rounded focus:ring-[#C5A059]"
                />
                <span className="text-xs font-medium">Bike Parking (Two Wheeler)</span>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  parkingCar
                    ? 'border-[#C5A059] bg-[#FCFAF5] font-bold text-gray-900 shadow-2xs'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={parkingCar}
                  onChange={(e) => setParkingCar(e.target.checked)}
                  className="w-4 h-4 text-[#C5A059] rounded focus:ring-[#C5A059]"
                />
                <span className="text-xs font-medium">Car Parking (Four Wheeler)</span>
              </label>

            </div>
          </div>

          {/* Section C: Tenant Preferences & Rules */}
          {category === 'HOUSE' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Tenant Preferences & Rules
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                    petFriendly
                      ? 'border-[#C5A059] bg-[#FCFAF5] font-bold text-gray-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={petFriendly}
                    onChange={(e) => setPetFriendly(e.target.checked)}
                    className="w-4 h-4 text-[#C5A059] rounded focus:ring-[#C5A059]"
                  />
                  <span className="text-xs font-medium">Pet Friendly (Pets Allowed)</span>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                    bachelorsAllowed
                      ? 'border-[#C5A059] bg-[#FCFAF5] font-bold text-gray-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={bachelorsAllowed}
                    onChange={(e) => setBachelorsAllowed(e.target.checked)}
                    className="w-4 h-4 text-[#C5A059] rounded focus:ring-[#C5A059]"
                  />
                  <span className="text-xs font-medium">Bachelors Allowed</span>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                    familyOnly
                      ? 'border-[#C5A059] bg-[#FCFAF5] font-bold text-gray-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={familyOnly}
                    onChange={(e) => setFamilyOnly(e.target.checked)}
                    className="w-4 h-4 text-[#C5A059] rounded focus:ring-[#C5A059]"
                  />
                  <span className="text-xs font-medium">Family Preferred</span>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                    vegetarianOnly
                      ? 'border-[#C5A059] bg-[#FCFAF5] font-bold text-gray-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={vegetarianOnly}
                    onChange={(e) => setVegetarianOnly(e.target.checked)}
                    className="w-4 h-4 text-[#C5A059] rounded focus:ring-[#C5A059]"
                  />
                  <span className="text-xs font-medium">Vegetarians Only</span>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                    nonVegAllowed
                      ? 'border-[#C5A059] bg-[#FCFAF5] font-bold text-gray-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={nonVegAllowed}
                    onChange={(e) => setNonVegAllowed(e.target.checked)}
                    className="w-4 h-4 text-[#C5A059] rounded focus:ring-[#C5A059]"
                  />
                  <span className="text-xs font-medium">Non-Veg Allowed</span>
                </label>
              </div>
            </div>
          )}

          {/* Section D: Building & Society Amenities (Gym, Lift, Water, Power) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Society & Building Amenities
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Gym / Fitness Centre', checked: gym, setter: setGym },
                { label: 'Lift / Elevator', checked: lift, setter: setLift },
                { label: '100% Power Backup', checked: powerBackup, setter: setPowerBackup },
                { label: '24/7 Metro Water', checked: waterMetro, setter: setWaterMetro },
                { label: 'Borewell Water', checked: waterBorewell, setter: setWaterBorewell },
                { label: 'Security Guard & CCTV', checked: securityCCTV, setter: setSecurityCCTV },
                { label: 'Gated Community', checked: gatedCommunity, setter: setGatedCommunity },
                { label: 'Swimming Pool', checked: swimmingPool, setter: setSwimmingPool },
                { label: 'Air Conditioner (AC)', checked: ac, setter: setAc },
                { label: 'Modular Kitchen', checked: modularKitchen, setter: setModularKitchen },
                { label: 'Geyser / Water Heater', checked: geyser, setter: setGeyser },
                { label: 'Utility / Washing Area', checked: washingArea, setter: setWashingArea },
                { label: 'High-Speed WiFi Ready', checked: wifi, setter: setWifi },
                { label: 'Piped Gas Connection', checked: pipedGas, setter: setPipedGas },
                { label: 'Clubhouse / Hall', checked: clubhouse, setter: setClubhouse },
                { label: 'Private Terrace / Garden', checked: privateTerrace, setter: setPrivateTerrace },
                { label: 'Near Metro Station', checked: nearMetro, setter: setNearMetro },
                { label: 'Near Bus Stand', checked: nearBusStand, setter: setNearBusStand },
              ].map((item, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                    item.checked
                      ? 'border-[#C5A059] bg-[#FCFAF5] font-bold text-gray-900 shadow-2xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.setter(e.target.checked)}
                    className="w-4 h-4 text-[#C5A059] rounded focus:ring-[#C5A059]"
                  />
                  <span className="text-xs">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section E: Additional Category Specific Amenities (if Shop / Hostel / Hall) */}
          {categorySpecificAmenities.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Category Highlights ({category})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categorySpecificAmenities.map((amenity) => {
                  const isChecked = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleCategoryAmenity(amenity)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-bold text-left transition ${
                        isChecked
                          ? 'bg-[#FCFAF5] border-[#C5A059] text-gray-900 shadow-2xs'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-[#C5A059] border-[#C5A059] text-white' : 'border-gray-300'
                        }`}
                      >
                        {isChecked && <CheckCircle className="w-3.5 h-3.5" />}
                      </div>
                      <span>{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Step 6: Contact Preferences */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            6. Tenant Contact Preferences
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={contactPhone}
                onChange={(e) => setContactPhone(e.target.checked)}
                className="w-4 h-4 text-[#C5A059] rounded"
              />
              <span className="text-xs font-semibold text-gray-800">Direct Phone Calling</span>
            </label>

            <label className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.checked)}
                className="w-4 h-4 text-[#C5A059] rounded"
              />
              <span className="text-xs font-semibold text-gray-800">WhatsApp Redirection</span>
            </label>

            <label className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={contactEnquiry}
                onChange={(e) => setContactEnquiry(e.target.checked)}
                className="w-4 h-4 text-[#C5A059] rounded"
              />
              <span className="text-xs font-semibold text-gray-800">In-App Message Enquiry</span>
            </label>
          </div>
        </div>

        {/* Step 7: Photos Upload */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            7. Upload Property Photos
          </label>
          <ImageUploader newFiles={files} onFilesChange={setFiles} maxFiles={10} />
        </div>

        {/* Submit Action */}
        <div className="bg-[#FCFAF5] border border-[#E8DFC8] p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-[#C5A059] shrink-0" />
            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              After clicking Save, you will be directed to select a Listing Plan (Deepavali Free Offer ₹0 / Residential ₹99 / Commercial ₹555) to activate and submit your property for admin review.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !hasVerifiedMobile}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#C5A059] to-[#B8860B] hover:brightness-105 text-white font-bold text-sm rounded-xl shadow-lg shadow-[#D4AF37]/25 transition active:scale-95 disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? 'Uploading Photos...' : hasVerifiedMobile ? 'Save & Select Plan' : 'Verify phone to continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
