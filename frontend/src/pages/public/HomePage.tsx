import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Building,
  Store,
  Users,
  PartyPopper,
  ChevronDown,
  Truck,
  Wrench,
  Wind,
  FileText,
  Shield,
  Layers,
  Car,
  Home,
  Maximize2,
  Briefcase,
  Utensils,
  Gift,
  LayoutGrid,
} from 'lucide-react';
import { useProperties, useLocalities } from '../../hooks/useProperties';
import { PropertyCard } from '../../components/property/PropertyCard';
import { SEOHead } from '../../components/common/SEOHead';
import { useLanguage } from '../../context/LanguageContext';
import { CHENNAI_LOCALITIES } from '../../utils/chennaiLocalities';
import { DeepavaliPlansShowcase } from '../../components/plans/DeepavaliPlansShowcase';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<'HOUSE' | 'APARTMENT' | 'SHOP' | 'COMMERCIAL_BUILDING' | 'HOSTEL' | 'MARRIAGE_HALL' | ''>('');

  const [locality, setLocality] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedParking, setSelectedParking] = useState<string>('');
  const [selectedSizeRange, setSelectedSizeRange] = useState<string>('');
  const [minSize, setMinSize] = useState<string>('');
  const [maxSize, setMaxSize] = useState<string>('');

  // Budget interactive picker popover state
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const budgetRef = React.useRef<HTMLDivElement>(null);
  const [rentalTab, setRentalTab] = useState<'RESIDENTIAL' | 'COMMERCIAL' | 'HOSTEL' | 'MARRIAGE_HALL'>('RESIDENTIAL');
  const [selectedBhks, setSelectedBhks] = useState<string[]>([]);
  const [residentialType, setResidentialType] = useState<'ALL' | 'HOUSE' | 'APARTMENT'>('ALL');
  const [selectedCommercialTypes, setSelectedCommercialTypes] = useState<string[]>([]);
  const [hostelGender, setHostelGender] = useState<'MALE' | 'FEMALE' | 'COLIVING' | ''>('');
  const [hostelSharing, setHostelSharing] = useState<string>('');
  const [hostelTotalMembers, setHostelTotalMembers] = useState<string>('');
  const [hallCapacity, setHallCapacity] = useState<'UP_TO_250' | '250_TO_500' | '500_TO_1000' | '1000_PLUS' | ''>('');
  const [hallDining, setHallDining] = useState<string>('');
  const [hallAc, setHallAc] = useState<'AC' | 'NON_AC' | ''>('');

  // Close budget picker on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (budgetRef.current && !budgetRef.current.contains(event.target as Node)) {
        setIsBudgetOpen(false);
      }
    };
    if (isBudgetOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBudgetOpen]);

  const { data: localitiesRes } = useLocalities();
  const localities = useMemo((): string[] => {
    if (Array.isArray(localitiesRes) && localitiesRes.length > 0) return localitiesRes;
    if (Array.isArray((localitiesRes as any)?.data)) return (localitiesRes as any).data;
    return CHENNAI_LOCALITIES;
  }, [localitiesRes]);

  // Fetch featured and latest properties for below sections
  const { data: featuredData, isLoading: loadingFeatured } = useProperties({
    limit: 6,
    sortBy: 'newest',
  });
  const featuredProperties = Array.isArray(featuredData?.data) ? featuredData.data : [];

  const { data: housesData, isLoading: loadingHouses } = useProperties({
    propertyType: 'HOUSE',
    limit: 3,
  });
  const houseProperties = Array.isArray(housesData?.data) ? housesData.data : [];

  const { data: shopsData, isLoading: loadingShops } = useProperties({
    propertyType: 'SHOP',
    limit: 3,
  });
  const shopProperties = Array.isArray(shopsData?.data) ? shopsData.data : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (locality) params.append('locality', locality);

    if (selectedCategory === 'HOUSE' || (rentalTab === 'RESIDENTIAL' && selectedCategory !== 'COMMERCIAL_BUILDING' && selectedCategory !== 'SHOP')) {
      if (residentialType === 'APARTMENT') {
        params.append('category', 'APARTMENT');
      } else if (residentialType === 'HOUSE' || selectedCategory === 'HOUSE') {
        params.append('category', 'HOUSE');
        params.append('propertyType', 'HOUSE');
      } else {
        params.append('propertyType', 'HOUSE');
      }
      if (selectedBhks.length > 0) {
        params.append('bedrooms', selectedBhks.join(','));
      }
      if (selectedFloor) {
        params.append('floor', selectedFloor);
      }
      if (selectedParking) {
        params.append('carParking', selectedParking);
      }
    } else if (selectedCategory === 'COMMERCIAL_BUILDING') {
      params.append('propertyType', 'SHOP');
      params.append('category', 'COMMERCIAL_BUILDING');
      if (selectedCommercialTypes.length > 0) {
        params.append('commercialType', selectedCommercialTypes.join(','));
      } else {
        params.append('commercialType', 'Industrial Building,Office Space,Commercial Building');
      }
      if (minSize) params.append('minSize', minSize);
      if (maxSize) params.append('maxSize', maxSize);
      if (selectedFloor) params.append('floor', selectedFloor);
      if (selectedParking) params.append('carParking', selectedParking);
    } else if (selectedCategory === 'SHOP' || rentalTab === 'COMMERCIAL') {
      params.append('propertyType', 'SHOP');
      params.append('category', 'SHOP');
      if (selectedCommercialTypes.length > 0) {
        params.append('commercialType', selectedCommercialTypes.join(','));
      }
      if (minSize) params.append('minSize', minSize);
      if (maxSize) params.append('maxSize', maxSize);
      if (selectedFloor) params.append('floor', selectedFloor);
      if (selectedParking) params.append('carParking', selectedParking);
    } else if (selectedCategory === 'HOSTEL' || rentalTab === 'HOSTEL') {
      params.append('category', 'HOSTEL');
      if (hostelGender) params.append('hostelGender', hostelGender);
      if (hostelSharing) params.append('hostelSharing', hostelSharing);
      if (hostelTotalMembers) params.append('hostelTotalMembers', hostelTotalMembers);
      if (minSize) params.append('minSize', minSize);
      if (maxSize) params.append('maxSize', maxSize);
    } else if (selectedCategory === 'MARRIAGE_HALL' || rentalTab === 'MARRIAGE_HALL') {
      params.append('category', 'MARRIAGE_HALL');
      params.append('propertyType', 'SHOP');
      if (hallCapacity) params.append('hallCapacity', hallCapacity);
      if (hallDining) params.append('hallDining', hallDining);
      if (hallAc) params.append('hallAc', hallAc);
      if (minSize) params.append('minSize', minSize);
      if (maxSize) params.append('maxSize', maxSize);
      if (selectedParking) params.append('carParking', selectedParking);
    }

    if (maxRent) params.append('maxRent', maxRent);
    navigate(`/properties?${params.toString()}`);
  };

  const popularLocalities = [
    'Anna Nagar',
    'T. Nagar',
    'Velachery',
    'Adyar',
    'Mylapore',
    'Porur',
    'Tambaram',
    'Sholinganallur',
    'Vadapalani',
    'Besant Nagar',
    'Guindy',
    'Thiruvanmiyur',
  ];

  return (
    <div className="space-y-6 sm:space-y-16 pb-12">
      <SEOHead
        title="Chennai's Exclusive One-Stop Property Rental Webapp | veeduvadagaikkuchennai"
        description="veeduvadagaikkuchennai - Chennai's exclusive one-stop property rental webapp. Verified houses for rent, hostels & PG accommodation, shops / commercial for rent, marriage halls & home services direct from owners."
      />

      {/* Hero Section */}
      <section className="relative overflow-x-hidden pt-4 pb-4 sm:pb-6 md:pt-8 md:pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#FCFAF6] via-white to-[#F8F5EE] border-b border-[#EFE8D8]">
        {/* Subtle decorative gold radial glows */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none opacity-40" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full pointer-events-none opacity-30" style={{ background: 'radial-gradient(circle, rgba(197,160,89,0.12) 0%, transparent 65%)' }} />

        <div className="relative max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Top Tagline */}
          <div className="text-center space-y-2 max-w-3xl mx-auto px-2">
            <h1 className="font-editorial text-xl sm:text-3xl lg:text-[2.25rem] font-bold sm:font-extrabold tracking-tight leading-snug sm:leading-tight text-[#1E2329]">
              <span className="text-[#C5A059]">{t('hero.title1')}</span>{' '}
              <span className="text-[#C5A059]">{t('hero.titleHouse')}</span>
            </h1>

            <p className="max-w-xl mx-auto text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              {t('hero.desc')}
            </p>

          </div>
          {/* Trust Guarantee Badges — 2 boxes side by side */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-[#EFE8D8] shadow-2xs">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#FAF4E6] border border-[#E8DFC8] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A059]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight">{t('hero.zeroBrokerage')}</p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug">{t('hero.zeroBrokerageDesc')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-[#EFE8D8] shadow-2xs">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#FAF4E6] border border-[#E8DFC8] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A059]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight">{t('hero.instantConnect')}</p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug">{t('hero.instantConnectDesc')}</p>
              </div>
            </div>
          </div>

          {/* Deepavali 2026 Festive Offer Banner */}
          <div className="max-w-4xl mx-auto px-2">
            <Link
              to="/plans"
              className="group flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#1b0610] via-[#240a15] to-[#2d0c1b] text-white border border-[#f59e0b]/40 shadow-lg shadow-amber-950/20 hover:brightness-105 transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-[#391121] border border-[#5a1b34] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#f59e0b]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                    <span className="text-xs sm:text-sm font-black text-white">
                      Deepavali Special Offer: List Properties &amp; Services <span className="text-[#f59e0b]">FREE</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#f59e0b] text-[#1b0610] text-[10px] font-black uppercase">
                      Till 8 Nov
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#edd8de] mt-0.5">
                    தீபாவளி வரை உங்கள் சொத்தை இலவசமாக பதிவு செய்யுங்கள் • Zero Listing Fee
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f59e0b] text-[#1b0610] text-xs font-black tracking-wide shrink-0 shadow-sm group-hover:bg-[#eab308] transition">
                <span>View Plans &amp; Pricing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>

          {/* Quick Categories Bar */}
          <div className="w-full overflow-x-auto no-scrollbar py-2.5 px-2 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 w-fit min-w-full justify-start min-[1150px]:justify-center px-2">
              <Link
                to="/houses"
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#E8DFC8] bg-white hover:bg-[#FAF4E6] hover:border-[#C5A059] text-gray-800 hover:text-[#9A7818] font-bold text-xs sm:text-[13px] shrink-0 whitespace-nowrap transition-all shadow-2xs active:scale-[0.97] group"
              >
                <Building2 className="w-4 h-4 sm:w-[17px] sm:h-[17px] text-[#C5A059] shrink-0" strokeWidth={2} />
                <span>{t('nav.houses')}</span>
              </Link>

              <Link
                to="/hostels"
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#E8DFC8] bg-white hover:bg-[#FAF4E6] hover:border-[#C5A059] text-gray-800 hover:text-[#9A7818] font-bold text-xs sm:text-[13px] shrink-0 text-left transition-all shadow-2xs active:scale-[0.97] group"
              >
                <Users className="w-4 h-4 sm:w-[17px] sm:h-[17px] text-[#C5A059] shrink-0" strokeWidth={2} />
                <div className="flex flex-col leading-tight">
                  <span className="whitespace-nowrap">{lang === 'ta' ? 'விடுதிகள் & PG' : 'Hostels & PG'}</span>
                  <span className="text-[10px] font-semibold text-gray-400 group-hover:text-[#B08B40] transition-colors whitespace-nowrap">
                    Accommodation
                  </span>
                </div>
              </Link>

              <Link
                to="/shops"
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#E8DFC8] bg-white hover:bg-[#FAF4E6] hover:border-[#C5A059] text-gray-800 hover:text-[#9A7818] font-bold text-xs sm:text-[13px] shrink-0 whitespace-nowrap transition-all shadow-2xs active:scale-[0.97] group"
              >
                <Store className="w-4 h-4 sm:w-[17px] sm:h-[17px] text-[#C5A059] shrink-0" strokeWidth={2} />
                <span>{t('nav.shops')}</span>
              </Link>

              <Link
                to="/marriage-halls"
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#E8DFC8] bg-white hover:bg-[#FAF4E6] hover:border-[#C5A059] text-gray-800 hover:text-[#9A7818] font-bold text-xs sm:text-[13px] shrink-0 whitespace-nowrap transition-all shadow-2xs active:scale-[0.97] group"
              >
                <Sparkles className="w-4 h-4 sm:w-[17px] sm:h-[17px] text-[#C5A059] shrink-0" strokeWidth={2} />
                <span>{t('nav.marriageHalls')}</span>
              </Link>

              <Link
                to="/home-services"
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#E8DFC8] bg-white hover:bg-[#FAF4E6] hover:border-[#C5A059] text-gray-800 hover:text-[#9A7818] font-bold text-xs sm:text-[13px] shrink-0 whitespace-nowrap transition-all shadow-2xs active:scale-[0.97] group"
              >
                <Wrench className="w-4 h-4 sm:w-[17px] sm:h-[17px] text-[#C5A059] shrink-0" strokeWidth={2} />
                <span>{t('nav.homeServices')}</span>
              </Link>

              <Link
                to="/wanted-spaces"
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#E8DFC8] bg-white hover:bg-[#FAF4E6] hover:border-[#C5A059] text-gray-800 hover:text-[#9A7818] font-bold text-xs sm:text-[13px] shrink-0 whitespace-nowrap transition-all shadow-2xs active:scale-[0.97] group"
              >
                <Search className="w-4 h-4 sm:w-[17px] sm:h-[17px] text-[#C5A059] shrink-0" strokeWidth={2} />
                <span>Wanted Specify</span>
              </Link>
            </div>
          </div>


          {/* House Sub-filters: All BHKs, Floor, Car Parking, All */}
          {selectedCategory === 'HOUSE' && (
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-[#E8DFC8] shadow-md shadow-[#D4AF37]/5 space-y-3">
                {/* 1. BHK Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-1.5 w-32 shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'அறைகள் (BHK)' : 'Bedrooms'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து BHK (All)' : 'All BHKs' },
                      { id: '1RK', label: '1 RK' },
                      { id: '1', label: '1 BHK' },
                      { id: '2', label: '2 BHK' },
                      { id: '3', label: '3 BHK' },
                      { id: '4+', label: '4+ BHK' },
                    ].map((item) => {
                      const isSelected = item.id === '' ? selectedBhks.length === 0 : selectedBhks.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (item.id === '') {
                              setSelectedBhks([]);
                            } else {
                              setSelectedBhks((prev) =>
                                prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]
                              );
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Floor Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-32 shrink-0">
                    <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'தளம் (Floor)' : 'Floor'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து தளம் (All)' : 'All Floors' },
                      { id: 'ground', label: lang === 'ta' ? 'தரை தளம் (Ground)' : 'Ground Floor' },
                      { id: '1-3', label: lang === 'ta' ? '1 – 3 வது தளம்' : '1st – 3rd Floor' },
                      { id: '4+', label: lang === 'ta' ? '4+ வது தளம்' : '4th+ Floor' },
                    ].map((item) => {
                      const isSelected = selectedFloor === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedFloor(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Car Parking Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-32 shrink-0">
                    <Car className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'கார் பார்க்கிங்' : 'Car Parking'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்தும் (All)' : 'All Parking' },
                      { id: 'car', label: lang === 'ta' ? 'கார் பார்க்கிங்' : 'Car Parking' },
                      { id: 'bike', label: lang === 'ta' ? 'பைக் பார்க்கிங்' : 'Bike Parking' },
                    ].map((item) => {
                      const isSelected = selectedParking === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedParking(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shop Sub-filters: Area (Sq Ft), Floor, Shop Type, Parking */}
          {selectedCategory === 'SHOP' && (
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-[#E8DFC8] shadow-md shadow-[#D4AF37]/5 space-y-3">
                {/* 1. Size / Area Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-1.5 w-32 shrink-0">
                    <Maximize2 className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'பரப்பளவு' : 'Area (Sq Ft)'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து அளவுகளும்' : 'All Sq Ft', min: '', max: '' },
                      { id: '<300', label: lang === 'ta' ? '< 300 ச.அடி' : '< 300 sq ft', min: '', max: '300' },
                      { id: '300-600', label: lang === 'ta' ? '300 – 600 ச.அடி' : '300 – 600 sq ft', min: '300', max: '600' },
                      { id: '600-1200', label: lang === 'ta' ? '600 – 1,200 ச.அடி' : '600 – 1,200 sq ft', min: '600', max: '1200' },
                      { id: '1200+', label: lang === 'ta' ? '1,200+ ச.அடி' : '1,200+ sq ft', min: '1200', max: '' },
                    ].map((item) => {
                      const isSelected = selectedSizeRange === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSizeRange('');
                              setMinSize('');
                              setMaxSize('');
                            } else {
                              setSelectedSizeRange(item.id);
                              setMinSize(item.min);
                              setMaxSize(item.max);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Floor Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-32 shrink-0">
                    <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'தளம் (Floor)' : 'Floor'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து தளம் (All)' : 'All Floors' },
                      { id: 'ground', label: lang === 'ta' ? 'தரை தளம் (Ground)' : 'Ground Floor' },
                      { id: '1-3', label: lang === 'ta' ? '1 – 2 வது தளம்' : '1st – 2nd Floor' },
                      { id: '4+', label: lang === 'ta' ? 'மேல் தளம் / பிற' : 'Upper / Other' },
                    ].map((item) => {
                      const isSelected = selectedFloor === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedFloor(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Shop Type */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-32 shrink-0">
                    <Store className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'கடை வகை' : 'Shop Type'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து வகை (All)' : 'All Shop Types' },
                      { id: 'Shop', label: lang === 'ta' ? 'சில்லறை கடை (Retail)' : 'Retail Shop' },
                      { id: 'Showroom', label: lang === 'ta' ? 'காட்சியகம் (Showroom)' : 'Showroom' },
                      { id: 'Godown/Warehouse', label: lang === 'ta' ? 'கிடங்கு (Godown)' : 'Godown / Storage' },
                      { id: 'Office Space', label: lang === 'ta' ? 'வணிக இடம்' : 'Commercial Space' },
                    ].map((item) => {
                      const isSelected = item.id === '' ? selectedCommercialTypes.length === 0 : selectedCommercialTypes.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (item.id === '') {
                              setSelectedCommercialTypes([]);
                            } else {
                              setSelectedCommercialTypes((prev) =>
                                prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]
                              );
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Parking Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-32 shrink-0">
                    <Car className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'பார்க்கிங்' : 'Parking'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்தும் (All)' : 'All Parking' },
                      { id: 'car', label: lang === 'ta' ? 'வாடிக்கையாளர் பார்க்கிங்' : 'Car / Customer Parking' },
                      { id: 'bike', label: lang === 'ta' ? 'பைக் பார்க்கிங்' : 'Bike Parking' },
                    ].map((item) => {
                      const isSelected = selectedParking === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedParking(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Commercial Building Sub-filters: Area (Sq Ft), Building Type, Floor, Parking */}
          {selectedCategory === 'COMMERCIAL_BUILDING' && (
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-[#E8DFC8] shadow-md shadow-[#D4AF37]/5 space-y-3">
                {/* 1. Size / Area Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-1.5 w-32 shrink-0">
                    <Maximize2 className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'பரப்பளவு' : 'Building Area'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து அளவுகளும்' : 'All Sq Ft', min: '', max: '' },
                      { id: '<1000', label: lang === 'ta' ? '< 1,000 ச.அடி' : '< 1,000 sq ft', min: '', max: '1000' },
                      { id: '1000-3000', label: lang === 'ta' ? '1,000 – 3,000 ச.அடி' : '1,000 – 3,000 sq ft', min: '1000', max: '3000' },
                      { id: '3000-5000', label: lang === 'ta' ? '3,000 – 5,000 ச.அடி' : '3,000 – 5,000 sq ft', min: '3000', max: '5000' },
                      { id: '5000-10000', label: lang === 'ta' ? '5,000 – 10,000 ச.அடி' : '5,000 – 10,000 sq ft', min: '5000', max: '10000' },
                      { id: '10000+', label: lang === 'ta' ? '10,000+ ச.அடி' : '10,000+ sq ft', min: '10000', max: '' },
                    ].map((item) => {
                      const isSelected = selectedSizeRange === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSizeRange('');
                              setMinSize('');
                              setMaxSize('');
                            } else {
                              setSelectedSizeRange(item.id);
                              setMinSize(item.min);
                              setMaxSize(item.max);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Building Usage / Commercial Type */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-32 shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'கட்டிட வகை' : 'Building Type'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து வணிக கட்டிடங்கள்' : 'All Commercial' },
                      { id: 'Office Space', label: lang === 'ta' ? 'அலுவலக கட்டிடம் (Office)' : 'Office Building / Space' },
                      { id: 'Commercial Building', label: lang === 'ta' ? 'முழு வணிக கட்டிடம்' : 'Full Commercial Building' },
                      { id: 'Industrial Building', label: lang === 'ta' ? 'தொழிற்சாலை (Industrial)' : 'Industrial / Factory' },
                      { id: 'Godown/Warehouse', label: lang === 'ta' ? 'பெரிய கிடங்கு (Warehouse)' : 'Large Warehouse' },
                      { id: 'Showroom', label: lang === 'ta' ? 'வணிக வளாகம் (Complex)' : 'Commercial Complex' },
                    ].map((item) => {
                      const isSelected = item.id === '' ? selectedCommercialTypes.length === 0 : selectedCommercialTypes.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (item.id === '') {
                              setSelectedCommercialTypes([]);
                            } else {
                              setSelectedCommercialTypes((prev) =>
                                prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]
                              );
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Floor Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-32 shrink-0">
                    <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'தளம் (Floor)' : 'Floor'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து தளம் (All)' : 'All Floors' },
                      { id: 'ground', label: lang === 'ta' ? 'தரை தளம் (Ground)' : 'Ground Floor' },
                      { id: '1-3', label: lang === 'ta' ? '1 – 3 வது தளம்' : '1st – 3rd Floor' },
                      { id: '4+', label: lang === 'ta' ? '4+ வது தளம்' : '4th+ Floor' },
                    ].map((item) => {
                      const isSelected = selectedFloor === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedFloor(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Parking Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-32 shrink-0">
                    <Car className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'பார்க்கிங்' : 'Parking'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்தும் (All)' : 'All Parking' },
                      { id: 'car', label: lang === 'ta' ? 'கார் பார்க்கிங்' : 'Car Parking' },
                      { id: 'bike', label: lang === 'ta' ? 'பைக் பார்க்கிங்' : 'Bike Parking' },
                    ].map((item) => {
                      const isSelected = selectedParking === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedParking(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hostel / PG Sub-filters: Gender (Men/Women), Room Sharing (Members), Total Members (Capacity), Sq Ft */}
          {selectedCategory === 'HOSTEL' && (
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-[#E8DFC8] shadow-md shadow-[#D4AF37]/5 space-y-3">
                {/* 1. Gender Filter: Men or Women */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-1.5 w-36 shrink-0">
                    <Users className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'விடுதி வகை' : 'Hostel For'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்தும் (All)' : 'All (Any Gender)' },
                      { id: 'MALE', label: lang === 'ta' ? 'ஆண்கள் விடுதி' : "Men's / Boys" },
                      { id: 'FEMALE', label: lang === 'ta' ? 'பெண்கள் விடுதி' : "Women's / Girls" },
                      { id: 'COLIVING', label: lang === 'ta' ? 'இருபாலர் / Co-Living' : 'Co-Living / Any' },
                    ].map((item) => {
                      const isSelected = hostelGender === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setHostelGender(item.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Room Sharing (Members per room) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-36 shrink-0">
                    <Home className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'அறை பகிர்வு' : 'Room Sharing'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து பகிர்வும் (All)' : 'All Sharing' },
                      { id: '1', label: lang === 'ta' ? 'தனி நபர் (Single)' : 'Single Room (1 Member)' },
                      { id: '2', label: lang === 'ta' ? '2 பேர் பகிர்வு' : '2 Sharing (2 Members)' },
                      { id: '3', label: lang === 'ta' ? '3 பேர் பகிர்வு' : '3 Sharing (3 Members)' },
                      { id: '4+', label: lang === 'ta' ? '4+ பேர் பகிர்வு' : '4+ Sharing (Dorm)' },
                    ].map((item) => {
                      const isSelected = hostelSharing === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setHostelSharing(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Total Members / Capacity */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-36 shrink-0">
                    <Users className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'மொத்த கொள்ளளவு' : 'Total Members'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து கொள்ளளவு (All)' : 'All Capacities' },
                      { id: '1-10', label: lang === 'ta' ? '1 – 10 உறுப்பினர்கள்' : 'Up to 10 Members' },
                      { id: '11-25', label: lang === 'ta' ? '11 – 25 உறுப்பினர்கள்' : '11 – 25 Members' },
                      { id: '26-50', label: lang === 'ta' ? '26 – 50 உறுப்பினர்கள்' : '26 – 50 Members' },
                      { id: '50+', label: lang === 'ta' ? '50+ உறுப்பினர்கள்' : '50+ Members (Large PG)' },
                    ].map((item) => {
                      const isSelected = hostelTotalMembers === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setHostelTotalMembers(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Sq Ft (Area / Room Size) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-36 shrink-0">
                    <Maximize2 className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'பரப்பளவு' : 'Area (Sq Ft)'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து அளவுகளும்' : 'All Sq Ft', min: '', max: '' },
                      { id: '<150', label: lang === 'ta' ? '< 150 ச.அடி' : '< 150 sq ft', min: '', max: '150' },
                      { id: '150-300', label: lang === 'ta' ? '150 – 300 ச.அடி' : '150 – 300 sq ft', min: '150', max: '300' },
                      { id: '300-500', label: lang === 'ta' ? '300 – 500 ச.அடி' : '300 – 500 sq ft', min: '300', max: '500' },
                      { id: '500+', label: lang === 'ta' ? '500+ ச.அடி' : '500+ sq ft', min: '500', max: '' },
                    ].map((item) => {
                      const isSelected = selectedSizeRange === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSizeRange('');
                              setMinSize('');
                              setMaxSize('');
                            } else {
                              setSelectedSizeRange(item.id);
                              setMinSize(item.min);
                              setMaxSize(item.max);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Kalyana Mandapam / Marriage Hall Sub-filters: Guest Capacity, Dining Seating Capacity, AC Type, Sq Ft, Parking */}
          {selectedCategory === 'MARRIAGE_HALL' && (
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-[#E8DFC8] shadow-md shadow-[#D4AF37]/5 space-y-3">
                {/* 1. Guest Capacity (விருந்தினர் கொள்ளளவு) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-1.5 w-36 shrink-0">
                    <PartyPopper className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'விருந்தினர் அளவு' : 'Guest Capacity'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து கொள்ளளவு (All)' : 'All Capacities' },
                      { id: 'UP_TO_250', label: lang === 'ta' ? '250 பேர் வரை (மினி ஹால்)' : 'Up to 250 Guests (Mini Hall)' },
                      { id: '250_TO_500', label: lang === 'ta' ? '250 – 500 பேர் (மண்டபம்)' : '250 – 500 Guests' },
                      { id: '500_TO_1000', label: lang === 'ta' ? '500 – 1000 பேர் (திருமண மஹால்)' : '500 – 1000 Guests' },
                      { id: '1000_PLUS', label: lang === 'ta' ? '1000+ பேர் (பிரம்மாண்ட மஹால்)' : '1000+ Guests (Convention)' },
                    ].map((item) => {
                      const isSelected = hallCapacity === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setHallCapacity(item.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Dining Seating Capacity (உணவுக்கூடம் / பந்தி கொள்ளளவு) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-36 shrink-0">
                    <Utensils className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'பந்தி கொள்ளளவு' : 'Dining Capacity'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து பந்தி (All)' : 'All Dining' },
                      { id: 'UP_TO_150', label: lang === 'ta' ? '150 இலைகள் வரை' : 'Up to 150 Seater' },
                      { id: '150_TO_350', label: lang === 'ta' ? '150 – 350 இலைகள்' : '150 – 350 Seater' },
                      { id: '350_TO_600', label: lang === 'ta' ? '350 – 600 இலைகள்' : '350 – 600 Seater' },
                      { id: '600_PLUS', label: lang === 'ta' ? '600+ இலைகள் (பிரம்மாண்ட பந்தி)' : '600+ Seater (Grand)' },
                    ].map((item) => {
                      const isSelected = hallDining === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setHallDining(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Air Conditioning Type (AC வசதி) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-36 shrink-0">
                    <Wind className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'ஏசி வசதி' : 'Hall AC Type'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து அரங்கம் (All)' : 'All Hall Types' },
                      { id: 'AC', label: lang === 'ta' ? 'முழு ஏசி அரங்கம் (AC Hall)' : 'Centralized AC Hall' },
                      { id: 'NON_AC', label: lang === 'ta' ? 'ஏசி அல்லாதது (Non-AC)' : 'Non-AC Hall' },
                    ].map((item) => {
                      const isSelected = hallAc === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setHallAc(item.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Hall Area / Built-up Size (Sq Ft) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-36 shrink-0">
                    <Maximize2 className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'அரங்க பரப்பளவு' : 'Hall Area (Sq Ft)'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்து அளவுகளும்' : 'All Sizes', min: '', max: '' },
                      { id: '<3000', label: lang === 'ta' ? '< 3,000 ச.அடி' : '< 3,000 sq ft', min: '', max: '3000' },
                      { id: '3000-7000', label: lang === 'ta' ? '3,000 – 7,000 ச.அடி' : '3k – 7k sq ft', min: '3000', max: '7000' },
                      { id: '7000-15000', label: lang === 'ta' ? '7,000 – 15,000 ச.அடி' : '7k – 15k sq ft', min: '7000', max: '15000' },
                      { id: '15000+', label: lang === 'ta' ? '15,000+ ச.அடி' : '15,000+ sq ft', min: '15000', max: '' },
                    ].map((item) => {
                      const isSelected = selectedSizeRange === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSizeRange('');
                              setMinSize('');
                              setMaxSize('');
                            } else {
                              setSelectedSizeRange(item.id);
                              setMinSize(item.min);
                              setMaxSize(item.max);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Car Parking */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 w-36 shrink-0">
                    <Car className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      {lang === 'ta' ? 'பார்க்கிங்' : 'Parking'}:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { id: '', label: lang === 'ta' ? 'அனைத்தும் (All)' : 'All Parking' },
                      { id: 'car', label: lang === 'ta' ? 'கார் பார்க்கிங்' : 'Car Parking' },
                      { id: 'bike', label: lang === 'ta' ? 'பைக் பார்க்கிங்' : 'Bike Parking' },
                    ].map((item) => {
                      const isSelected = selectedParking === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedParking(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white border-[#C5A059] shadow-2xs scale-[1.02]'
                              : 'bg-[#FCFAF5] text-gray-700 border-[#E8DFC8] hover:bg-[#FAF4E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      </section>


      {/* Featured Properties Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9A7818] bg-[#FAF4E6] border border-[#E8DFC8] px-3 py-1 rounded-full mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{lang === 'ta' ? 'சிறந்த தேர்வுகள்' : 'Handpicked Deals'}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {t('home.featuredTitle')}
            </h2>
          </div>
          <Link
            to="/properties"
            className="inline-flex items-center gap-1 text-sm font-bold text-[#C5A059] hover:text-[#9A7818] transition"
          >
            <span>{t('home.viewAll')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#EFE8D8] shadow-xs overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-24 bg-gray-200 rounded-full" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded-full" />
                  <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <div className="h-3 w-16 bg-gray-200 rounded-full" />
                    <div className="h-3 w-14 bg-gray-200 rounded-full" />
                    <div className="h-3 w-18 bg-gray-200 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-5 w-28 bg-gray-200 rounded-lg" />
                    <div className="h-8 w-24 bg-gray-200 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        )}
      </section>

      {/* Houses Spotlight */}
      <section className="bg-[#FAF8F4] py-14 border-y border-[#EFE8D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                {t('home.housesTitle')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{t('home.housesSubtitle')}</p>
            </div>
            <Link
              to="/houses"
              className="text-xs sm:text-sm font-bold text-[#C5A059] hover:text-[#9A7818] flex items-center gap-1"
            >
              <span>{t('home.viewAll')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingHouses ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#EFE8D8] shadow-xs overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-24 bg-gray-200 rounded-full" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded-full" />
                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                      <div className="h-3 w-16 bg-gray-200 rounded-full" />
                      <div className="h-3 w-14 bg-gray-200 rounded-full" />
                      <div className="h-3 w-16 bg-gray-200 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="h-5 w-28 bg-gray-200 rounded-lg" />
                      <div className="h-8 w-24 bg-gray-200 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              houseProperties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Commercial Shops Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {t('home.shopsTitle')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{t('home.shopsSubtitle')}</p>
          </div>
          <Link
            to="/shops"
            className="text-xs sm:text-sm font-bold text-[#C5A059] hover:text-[#9A7818] flex items-center gap-1"
          >
            <span>{t('home.viewAll')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingShops ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#EFE8D8] shadow-xs overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-24 bg-gray-200 rounded-full" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded-full" />
                  <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <div className="h-3 w-16 bg-gray-200 rounded-full" />
                    <div className="h-3 w-14 bg-gray-200 rounded-full" />
                    <div className="h-3 w-16 bg-gray-200 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-5 w-28 bg-gray-200 rounded-lg" />
                    <div className="h-8 w-24 bg-gray-200 rounded-xl" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            shopProperties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))
          )}
        </div>
      </section>

      {/* Home Services Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9A7818] bg-[#FAF4E6] border border-[#E8DFC8] px-3 py-1 rounded-full mb-1">
              <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{lang === 'ta' ? 'சரிபார்க்கப்பட்ட சேவைகள்' : 'Verified Professionals'}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {lang === 'ta' ? 'சென்னை வீட்டு சேவைகள்' : 'Chennai Home Services'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {lang === 'ta'
                ? 'மூவர்ஸ், புதுப்பித்தல், ஏசி பழுது, துப்புரவு மற்றும் சட்ட ஆவண சேவைகள் — நேரடி வல்லுநர்கள்'
                : 'Movers & Packers, Renovation, AC Care, Cleaning & Pest Control, Legal Documentation'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/home-services/list"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#C5A059] shadow-xs hover:brightness-105 transition"
            >
              <span>+ {lang === 'ta' ? 'சேவை சேர்க்க' : 'List Your Service'}</span>
            </Link>
            <Link
              to="/home-services"
              className="inline-flex items-center gap-1 text-sm font-bold text-[#C5A059] hover:text-[#9A7818] transition"
            >
              <span>{t('home.viewAll')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Link
            to="/home-services?category=MOVERS"
            className="group bg-white rounded-2xl p-4 border border-[#EFE8D8] shadow-xs hover:border-blue-400 hover:shadow-md transition text-center flex flex-col items-center justify-between"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-blue-700 transition leading-tight mb-1">
              {lang === 'ta' ? 'மூவர்ஸ் & பேக்கர்ஸ்' : 'Movers & Packers'}
            </h4>
            <p className="text-[11px] text-gray-500">
              {lang === 'ta' ? 'உள்ளூர் & வெளியூர் இடமாற்றம்' : 'Local & Intercity Shifting'}
            </p>
          </Link>

          <Link
            to="/home-services?category=RENOVATION"
            className="group bg-white rounded-2xl p-4 border border-[#EFE8D8] shadow-xs hover:border-orange-400 hover:shadow-md transition text-center flex flex-col items-center justify-between"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
              <Wrench className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-orange-700 transition leading-tight mb-1">
              {lang === 'ta' ? 'புதுப்பித்தல் & பழுது' : 'Renovation & Repairs'}
            </h4>
            <p className="text-[11px] text-gray-500">
              {lang === 'ta' ? 'மின்சாரம், பிளம்பிங், பெயிண்டிங்' : 'Painting, Plumbing, Electric'}
            </p>
          </Link>

          <Link
            to="/home-services?category=CLEANING"
            className="group bg-white rounded-2xl p-4 border border-[#EFE8D8] shadow-xs hover:border-green-400 hover:shadow-md transition text-center flex flex-col items-center justify-between"
          >
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 border border-green-100 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-green-700 transition leading-tight mb-1">
              {lang === 'ta' ? 'துப்புரவு & பூச்சி கட்டுப்பாடு' : 'Cleaning & Pest Control'}
            </h4>
            <p className="text-[11px] text-gray-500">
              {lang === 'ta' ? 'ஆழ்ந்த சுத்தம், கரப்பான், கறையான்' : 'Deep Clean & Pest Treatment'}
            </p>
          </Link>

          <Link
            to="/home-services?category=AC_SERVICE"
            className="group bg-white rounded-2xl p-4 border border-[#EFE8D8] shadow-xs hover:border-cyan-400 hover:shadow-md transition text-center flex flex-col items-center justify-between"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
              <Wind className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-cyan-700 transition leading-tight mb-1">
              {lang === 'ta' ? 'AC சேவை & துப்புரவு' : 'AC Service & Cleaning'}
            </h4>
            <p className="text-[11px] text-gray-500">
              {lang === 'ta' ? 'கேஸ் நிரப்புதல், நிறுவுதல்' : 'Gas Refill, Service, Install'}
            </p>
          </Link>

          <Link
            to="/home-services?category=LEGAL"
            className="group bg-white rounded-2xl p-4 border border-[#EFE8D8] shadow-xs hover:border-purple-400 hover:shadow-md transition text-center flex flex-col items-center justify-between col-span-2 sm:col-span-1"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-purple-700 transition leading-tight mb-1">
              {lang === 'ta' ? 'சட்ட ஆவணங்கள்' : 'Legal Documentation'}
            </h4>
            <p className="text-[11px] text-gray-500">
              {lang === 'ta' ? 'வாடகை ஒப்பந்தம், பத்திரம்' : 'Rental Agreements & Deeds'}
            </p>
          </Link>
        </div>
      </section>

      {/* Popular Chennai Areas Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {t('hero.popularLocalities')}
          </h2>
          <p className="text-sm text-gray-600 font-normal">
            {lang === 'ta'
              ? 'சென்னையின் முக்கிய பகுதிகளில் கிடைக்கும் வாடகை வீடுகள் மற்றும் கடைகளை கண்டறியுங்கள்.'
              : "Quickly browse available houses and shops in Chennai's high-demand neighborhoods."}
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {popularLocalities.map((loc) => (
            <Link
              key={loc}
              to={`/properties?locality=${encodeURIComponent(loc)}`}
              className="p-2.5 sm:p-4 bg-white rounded-2xl border border-[#EFE8D8] hover:border-[#C5A059] hover:shadow-md transition text-center group"
            >
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A059] mx-auto mb-1 sm:mb-2 group-hover:scale-110 transition" />
              <h4 className="text-[10px] sm:text-sm font-semibold text-gray-800 group-hover:text-[#9A7818] transition leading-tight">
                {loc}
              </h4>
              <span className="hidden sm:block text-[11px] text-gray-500 font-normal">View rentals</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works (White and Lite Gold Theme) */}
      <section className="bg-[#FAF8F4] text-gray-900 py-16 border-y border-[#EFE8D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-block px-3 py-1 bg-[#FAF4E6] border border-[#E8DFC8] text-[#9A7818] rounded-full text-xs font-bold uppercase tracking-wider">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900">
              How veeduvadagaikkuchennai Works
            </h2>
            <p className="text-sm text-gray-600 font-normal">
              We connect tenants directly with verified Chennai landlords without middlemen or hidden commission.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-white rounded-3xl border border-[#EFE8D8] shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF4E6] text-[#9A7818] border border-[#E8DFC8] flex items-center justify-center font-bold text-lg mx-auto shadow-xs">
                1
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Browse & Discover Rentals</h3>
              <p className="text-sm text-gray-600 font-normal">
                Explore properties using our card-based discovery view or filter by locality, price bracket, and furnishing.
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-[#EFE8D8] shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF4E6] text-[#9A7818] border border-[#E8DFC8] flex items-center justify-center font-bold text-lg mx-auto shadow-xs">
                2
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Inspect Verified Details</h3>
              <p className="text-sm text-gray-600 font-normal">
                Check high-res photos, exact address, amenities, security deposit, and house rules.
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-[#EFE8D8] shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF4E6] text-[#9A7818] border border-[#E8DFC8] flex items-center justify-center font-bold text-lg mx-auto shadow-xs">
                3
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Connect via WhatsApp or Call</h3>
              <p className="text-sm text-gray-600 font-normal">
                Directly dial the owner, message on WhatsApp, or send an enquiry instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Deepavali Owner Advertising Plans Section */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8">
        <DeepavaliPlansShowcase hideHeroBrandBar={true} />
      </section>
    </div>
  );
};
