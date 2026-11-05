import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { planService } from "../../services/plan.service";
import {
  Sparkles,
  ArrowRight,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MapPin,
  Phone,
  CalendarDays,
  ImageIcon,
  TrendingUp,
  Megaphone,
  Headphones,
  Layers,
} from "lucide-react";

interface DeepavaliPlansShowcaseProps {
  isOwnerView?: boolean;
  hideHeroBrandBar?: boolean;
}

const PLAN_FEATURES = [
  { icon: MapPin, label: "Listed in All Chennai Pincodes", sub: "150+ areas covered" },
  { icon: Phone, label: "Direct Phone & WhatsApp Leads", sub: "Zero intermediary" },
  { icon: CalendarDays, label: "60-Day Listing Validity", sub: "Full 2 months live" },
  { icon: Layers, label: "All Property Categories", sub: "Houses, shops, halls & services" },
  { icon: ImageIcon, label: "Up to 10 HD Photos", sub: "Showcase your space" },
  { icon: Clock, label: "Fast Admin Review", sub: "Live within 24 hours" },
  { icon: TrendingUp, label: "Verified Owner Badge", sub: "Trust & credibility" },
  { icon: Sparkles, label: "Featured Placement", sub: "Top of search & category page" },
];

const DEFAULT_PLANS = [
  {
    id: "plan_deepavali_free",
    badge: "DEEPAVALI OFFER",
    badgeCls: "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#3D2211] shadow-sm",
    name: "Deepavali Free Offer",
    nameTamil: "தீபாவளி இலவச சலுகை",
    price: "₹0",
    strikePrice: "₹99-₹2,500",
    period: "per listing · 60 days",
    ctaLabel: "Post your property for free",
    ctaLink: "/owner/properties/add",
    enabledCount: 5,
    isOffer: true,
    isPremium: false,
  },
  {
    id: "plan_residential_single",
    badge: "RESIDENTIAL",
    badgeCls: "bg-amber-50 text-[#7D4D2B] border border-amber-200",
    name: "Residential",
    nameTamil: "வீடு",
    price: "₹99",
    strikePrice: null,
    period: "per listing · 30 days",
    ctaLabel: "List a Home",
    ctaLink: "/owner/properties/add?type=HOUSE",
    enabledCount: 5,
    isOffer: false,
    isPremium: false,
  },
  {
    id: "plan_home_services",
    badge: "HOME SERVICES",
    badgeCls: "bg-amber-50 text-[#7D4D2B] border border-amber-200",
    name: "Home Services",
    nameTamil: "வீட்டு சேவைகள்",
    price: "₹444",
    strikePrice: null,
    period: "per listing · 60 days",
    ctaLabel: "Advertise a Service",
    ctaLink: "/home-services/list",
    enabledCount: 6,
    isOffer: false,
    isPremium: false,
  },
  {
    id: "plan_commercial_single",
    badge: "SHOPS & COMMERCIAL",
    badgeCls: "bg-amber-50 text-[#7D4D2B] border border-amber-200",
    name: "Commercial",
    nameTamil: "வணிக இடம்",
    price: "₹555",
    strikePrice: null,
    period: "per listing · 60 days",
    ctaLabel: "List a Shop",
    ctaLink: "/owner/properties/add?type=SHOP",
    enabledCount: 7,
    isOffer: false,
    isPremium: false,
  },
  {
    id: "plan_kalyana_mandapam",
    badge: "PREMIUM VENUE",
    badgeCls: "bg-gradient-to-r from-[#7D4D2B] to-[#5A3319] text-[#FFE4A0] border border-[#D4A373]",
    name: "Kalyana Mandapam",
    nameTamil: "கல்யாண மண்டபம்",
    price: "₹2,500",
    strikePrice: null,
    period: "per listing · 60 days",
    ctaLabel: "List a Hall",
    ctaLink: "/owner/properties/add?type=MARRIAGE_HALL",
    enabledCount: 8,
    isOffer: false,
    isPremium: true,
  },
];

export const DeepavaliPlansShowcase: React.FC<DeepavaliPlansShowcaseProps> = ({
  isOwnerView = false,
  hideHeroBrandBar = false,
}) => {
  const { data: plansResponse } = useQuery({
    queryKey: ['listingPlans'],
    queryFn: () => planService.getPlans(),
    staleTime: 60 * 1000,
  });

  const displayPlans = useMemo(() => {
    const serverPlans = plansResponse?.data?.filter((p) => p.isActive) || [];
    if (serverPlans.length === 0) return DEFAULT_PLANS;

    return serverPlans.map((p) => {
      const isOffer = p.isOffer ?? (p.price === 0 || p.id.includes('free'));
      const isPremium = p.isPremium ?? (p.price >= 1000 || p.name.toLowerCase().includes('mandapam') || p.name.toLowerCase().includes('hall'));

      let badge = p.badge;
      if (!badge) {
        if (isOffer) badge = 'DEEPAVALI OFFER';
        else if (isPremium) badge = 'PREMIUM VENUE';
        else if (p.name.toLowerCase().includes('residential') || p.name.toLowerCase().includes('home') || p.name.toLowerCase().includes('house')) badge = 'RESIDENTIAL';
        else if (p.name.toLowerCase().includes('service')) badge = 'HOME SERVICES';
        else if (p.name.toLowerCase().includes('commercial') || p.name.toLowerCase().includes('shop')) badge = 'SHOPS & COMMERCIAL';
        else badge = p.name.toUpperCase();
      }

      let badgeCls = "bg-amber-50 text-[#7D4D2B] border border-amber-200";
      if (isOffer) badgeCls = "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#3D2211] shadow-sm";
      else if (isPremium) badgeCls = "bg-gradient-to-r from-[#7D4D2B] to-[#5A3319] text-[#FFE4A0] border border-[#D4A373]";

      return {
        id: p.id,
        badge,
        badgeCls,
        name: p.name,
        nameTamil: p.nameTamil || '',
        price: `₹${p.price.toLocaleString('en-IN')}`,
        rawPrice: p.price,
        strikePrice: p.strikePrice || (isOffer ? '₹99-₹2,500' : null),
        period: `per listing · ${p.durationDays} days`,
        durationDays: p.durationDays,
        ctaLabel: p.ctaLabel || (isOffer ? 'Post your property for free' : `List a ${p.name}`),
        ctaLink: p.ctaLink || '/owner/properties/add',
        enabledCount: p.enabledCount ?? (isPremium ? 8 : p.price > 500 ? 7 : p.price > 200 ? 6 : 5),
        isOffer,
        isPremium,
      };
    });
  }, [plansResponse]);

  const [selectedPlan, setSelectedPlan] = useState<string>("plan_kalyana_mandapam");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 16, hours: 3, minutes: 22, seconds: 40 });

  useEffect(() => {
    if (displayPlans.length > 0 && !displayPlans.some((p) => p.id === selectedPlan)) {
      const preferred = displayPlans.find((p) => p.isPremium) || displayPlans[displayPlans.length - 1] || displayPlans[0];
      if (preferred) setSelectedPlan(preferred.id);
    }
  }, [displayPlans, selectedPlan]);

  const activePlan = useMemo(() => {
    return displayPlans.find((p) => p.id === selectedPlan) ??
           displayPlans.find((p) => p.isPremium) ??
           displayPlans[displayPlans.length - 1] ??
           displayPlans[0];
  }, [displayPlans, selectedPlan]);

  useEffect(() => {
    const targetDate = new Date("2026-11-08T23:59:59+05:30").getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const faqs = [
    {
      q: "Is property posting really ₹0 till Deepavali?",
      a: "Yes, 100%! All rental listings (Houses, Flats, Shops, Commercial Spaces, Kalyana Mandapams and Home Services) posted on or before Deepavali, 8 Nov 2026 carry absolutely zero posting fee. No payment gateway or credit card required.",
    },
    {
      q: "How long will my free listing remain active?",
      a: "Every property registered during the Deepavali offer stays active for a full 60 days from the date of approval. You get the complete 2-month advertising validity for free.",
    },
    {
      q: "What happens after the Deepavali offer ends?",
      a: "Any property posted before the deadline stays completely free for its full 60 days. New properties posted after Deepavali will renew at our transparent, affordable prices starting at just ₹99 for residential spaces.",
    },
    {
      q: "Can I list commercial spaces and marriage halls?",
      a: "Absolutely! Commercial shops, showrooms, office spaces, and premium wedding venues/kalyana mandapams are all eligible for the ₹0 Deepavali listing offer.",
    },
    {
      q: "How will tenants get in touch with me?",
      a: "Tenants browse your property by pincode and locality in Chennai, and contact you directly via direct phone calls and WhatsApp messages. Zero intermediary, zero commission.",
    },
  ];

  return (
    <div id="listing-plans" className="w-full bg-[#FAF6EF] text-[#3D2211] font-sans scroll-mt-20">
      {/* HERO — Radiant Light Brown with Metallic Golden Sheen */}
      <section className="relative overflow-hidden w-full max-w-full bg-gradient-to-br from-[#7D4D2B] via-[#9E6941] to-[#6E3F1F] text-white pt-6 sm:pt-8 pb-12 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-[#D4A373]/50 shadow-inner">
        {/* Luminous Golden Shine Overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-200/30 via-amber-400/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-300/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-orange-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12 relative z-10 w-full">
          {!hideHeroBrandBar && (
            <div className="flex items-center justify-between border-b border-[#D4A373]/40 pb-4 sm:pb-5">
              <Link to="/" className="inline-block group">
                <span className="text-[#FFE4A0] font-black text-lg sm:text-2xl tracking-tight leading-none drop-shadow-xs">
                  veeduvadagaikku chennai
                </span>
                <span className="block text-[#FDECD2] text-xs sm:text-sm font-medium mt-0.5">
                  வீடு வாடகைக்கு · சென்னை
                </span>
              </Link>
              <Link
                to="/owner/properties/add"
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full border border-[#FFE4A0] text-[#FFE4A0] hover:bg-[#FFE4A0] hover:text-[#3D2211] text-xs sm:text-sm font-bold transition-all shadow-sm"
              >
                List your property
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-start">
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 w-full">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#5A3319]/70 border border-[#D4A373]/50 text-[#FFE4A0] text-xs sm:text-[13px] font-bold shadow-sm backdrop-blur-xs">
                <Flame className="w-3.5 h-3.5 text-[#FBBF24]" />
                <span>For owners &amp; advertisers only</span>
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-4xl lg:text-[50px] font-black text-white leading-[1.15] tracking-tight break-words drop-shadow-[0_2px_4px_rgba(40,18,6,0.4)]">
                List your property &amp; services{" "}
                <span className="text-[#FDE68A] underline decoration-[#F59E0B] decoration-wavy decoration-2">
                  free
                </span>{" "}
                till Deepavali
              </h1>

              {/* Subtitles */}
              <div className="space-y-1.5 break-words">
                <p className="text-sm sm:text-lg lg:text-xl font-bold text-[#FFE4A0] leading-relaxed drop-shadow-xs">
                  தீபாவளி வரை உங்கள் வீடு, கடை, மண்டபம் அனைத்தையும் கட்டணமின்றி பதிவு செய்யுங்கள்!
                </p>
                <p className="text-xs sm:text-base lg:text-lg font-medium text-[#FDECD2] leading-relaxed">
                  இந்த தீபாவளிக்கு உங்கள் சொத்து சென்னை முழுவதும் தெரியட்டும் – பதிவு முற்றிலும் இலவசம்!
                </p>
              </div>

              <p className="text-xs sm:text-base text-[#FDECD2]/90 max-w-xl font-normal leading-relaxed">
                Put your house, shop, hall or home service in front of Chennai across every pincode. No listing fee on anything posted on or before Deepavali.
              </p>

              {/* CTAs */}
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <Link
                  to="/owner/properties/add"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#D97706] text-[#3D2211] text-sm sm:text-base font-black shadow-xl shadow-amber-950/30 hover:brightness-105 transition-all active:scale-95 group text-center border border-amber-200/40"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Post your property for free</span>
                  <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-[#FDECD2] font-semibold">
                  <Clock className="w-4 h-4 text-[#FDE68A] shrink-0" />
                  <span>Offer ends Deepavali, 8 Nov 2026</span>
                </div>
              </div>

              {/* Wanted Column Button */}
              <div className="pt-0.5">
                <Link
                  to="/wanted-spaces/specify"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/30 border border-emerald-400/40 transition-all active:scale-95 group text-center"
                >
                  <Megaphone className="w-4 h-4 text-emerald-200 shrink-0" />
                  <span>Wanted Column (தேவை பகுதி - Post Requirement)</span>
                  <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Countdown Timer with Light Brown & Gold Shine */}
              <div className="pt-2 w-full max-w-full overflow-hidden">
                <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3 p-2.5 px-3 sm:px-4 rounded-2xl bg-[#5A3319]/80 border border-[#D4A373]/50 text-xs max-w-full shadow-inner backdrop-blur-xs">
                  <span className="text-[#FFE4A0] font-black uppercase tracking-wider flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Deepavali Countdown:
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-white font-mono font-black text-xs sm:text-sm">
                    {[{ v: timeLeft.days, u: "d" }, { v: timeLeft.hours, u: "h" }, { v: timeLeft.minutes, u: "m" }, { v: timeLeft.seconds, u: "s" }].map((t, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span className="text-[#FDE68A]">:</span>}
                        <span className="px-1.5 sm:px-2 py-0.5 bg-gradient-to-b from-[#7D4D2B] to-[#4D270E] border border-[#D4A373]/40 rounded-md text-[#FFE4A0] shadow-xs">
                          {String(t.v).padStart(2, "0")}{t.u}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Offer Card */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-white text-gray-900 rounded-3xl p-5 sm:p-8 shadow-2xl border-2 border-amber-300/60 relative overflow-hidden hover:scale-[1.01] transition-transform w-full">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-500 text-[#3D2211] text-[10px] font-black uppercase tracking-widest py-1 px-4 rounded-bl-xl shadow-xs">
                  100% Free
                </div>
                <div className="space-y-4">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#92400e] block">DEEPAVALI OFFER</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">₹0</span>
                    <span className="text-xs sm:text-sm text-gray-400 line-through font-semibold">Instead of ₹99 to ₹2,500</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 leading-snug">Listing fee for properties and home services</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Applies to every listing posted on or before Deepavali, 8 Nov 2026.</p>
                  <div className="pt-3 border-t border-gray-100 space-y-2.5">
                    {["Valid in all 150+ Chennai pincodes", "Full 60-day validity at zero extra cost", "Direct phone calls & WhatsApp tenant leads"].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-[10px] font-black">✓</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 space-y-2">
                    <Link
                      to="/owner/properties/add"
                      className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-[#7D4D2B] via-[#9E6941] to-[#7D4D2B] hover:brightness-110 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md border border-[#D4A373]/40"
                    >
                      <span>Post your property for free</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/wanted-spaces/specify"
                      className="w-full py-2.5 px-4 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <Megaphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Wanted Column (Specify Requirement)</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PLANS SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-12">
        <div className="text-center space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-[#7D4D2B]">
            Owner Advertising Plans · விளம்பரத் திட்டங்கள்
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Simple pricing for owners
          </h2>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Click a plan to see included features. Free right now, low after the offer ends.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pt-5 pb-4">
          <div className="flex gap-4 min-w-max sm:min-w-0 sm:grid sm:grid-cols-5">
            {displayPlans.map((plan) => {
              const isActive = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative w-44 sm:w-auto flex flex-col text-left rounded-3xl border-2 transition-all duration-200 overflow-visible focus:outline-none cursor-pointer
                    ${isActive
                      ? plan.isPremium
                        ? "border-[#F59E0B] shadow-2xl shadow-amber-950/25 scale-[1.03]"
                        : "border-[#7D4D2B] shadow-xl shadow-[#7D4D2B]/20 scale-[1.03]"
                      : "border-[#e8d5cb] shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    }
                    ${isActive && plan.isPremium
                      ? "bg-gradient-to-b from-[#6E3F1F] via-[#7D4D2B] to-[#5A3319] text-white"
                      : "bg-white"
                    }
                  `}
                >
                  {/* Badge ribbon */}
                  <div className="absolute -top-3.5 left-0 right-0 flex justify-center z-10">
                    <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap shadow-sm ${plan.badgeCls}`}>
                      {plan.badge}
                    </span>
                  </div>

                  <div className="p-5 pt-7 flex flex-col gap-3 h-full">
                    <div>
                      <h3 className={`text-sm font-black tracking-tight leading-snug ${isActive && plan.isPremium ? "text-white" : "text-gray-900"}`}>
                        {plan.name}
                      </h3>
                      <span className={`text-[10px] font-medium block mt-0.5 ${isActive && plan.isPremium ? "text-[#FDECD2]" : "text-gray-500"}`}>
                        {plan.nameTamil}
                      </span>
                    </div>

                    <div>
                      {plan.strikePrice && (
                        <span className={`text-[10px] line-through font-semibold block ${isActive && plan.isPremium ? "text-[#FDECD2]/70" : "text-gray-400"}`}>
                          {plan.strikePrice}
                        </span>
                      )}
                      <span className={`text-2xl font-black tracking-tight block ${isActive && plan.isPremium ? "text-[#FFE4A0]" : "text-[#7D4D2B]"}`}>
                        {plan.price}
                      </span>
                      <span className={`text-[10px] font-medium mt-0.5 block ${isActive && plan.isPremium ? "text-[#FDECD2]" : "text-gray-500"}`}>
                        {plan.period}
                      </span>
                      {plan.isOffer && (
                        <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">Free during Deepavali</span>
                      )}
                    </div>

                    <div className="mt-auto pt-2">
                      <Link
                        to={plan.ctaLink}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full py-2.5 px-3 rounded-full text-xs font-black tracking-wide text-center flex items-center justify-center gap-1 transition-all active:scale-95
                          ${isActive
                            ? plan.isPremium
                              ? "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#3D2211] hover:brightness-105 shadow-md"
                              : "bg-gradient-to-r from-[#7D4D2B] via-[#9E6941] to-[#7D4D2B] text-white hover:brightness-110 shadow-md"
                            : "border-2 border-[#7D4D2B] text-[#7D4D2B] hover:bg-[#7D4D2B] hover:text-white"
                          }`}
                      >
                        Subscribe
                      </Link>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Comparison Panel */}
        <div className="bg-white rounded-3xl border border-[#e8d5cb] shadow-sm overflow-hidden">
          {/* Panel header */}
          <div className="px-6 sm:px-8 py-4 border-b border-[#f0e6dc] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#7D4D2B]">
                {activePlan.name} — Features Included
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {activePlan.enabledCount} of {PLAN_FEATURES.length} features enabled
              </p>
            </div>
            <div className="flex items-center gap-5 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-gray-900">
                <span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block" />
                Included
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
                Not included
              </span>
            </div>
          </div>

          {/* Feature grid */}
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            {PLAN_FEATURES.map((feat, idx) => {
              const enabled = idx < activePlan.enabledCount;
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 transition-all duration-300 ${enabled ? "opacity-100" : "opacity-30"}`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 transition-colors ${enabled ? "bg-[#F59E0B]/15 text-[#92400e]" : "bg-gray-100 text-gray-400"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold leading-snug ${enabled ? "text-gray-900" : "text-gray-400"}`}>
                      {feat.label}
                    </p>
                    <p className={`text-[11px] mt-0.5 ${enabled ? "text-gray-500" : "text-gray-300"}`}>
                      {feat.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panel Footer */}
          <div className="px-6 sm:px-8 py-4 bg-[#faf6ef] border-t border-[#f0e6dc] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-gray-600 font-medium">
              <span className="text-[#7D4D2B] font-bold">{activePlan.name}</span> — {activePlan.price} {activePlan.period}
              {activePlan.isOffer && <span className="ml-2 text-emerald-700 font-bold">Free during Deepavali!</span>}
            </p>
            <Link
              to={activePlan.ctaLink}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black tracking-wide transition-all active:scale-95 whitespace-nowrap ${
                activePlan.isPremium
                  ? "bg-gradient-to-r from-[#7D4D2B] via-[#9E6941] to-[#7D4D2B] hover:brightness-110 text-white border border-[#D4A373]/40"
                  : "bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#D97706] text-[#3D2211] hover:brightness-105"
              } shadow-md`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activePlan.ctaLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Why List With Us banner */}
        <div className="bg-[#fff5e6] rounded-3xl p-6 sm:p-8 border border-[#fde2b8] space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-[#92400e]">Zero Commission · Zero Middlemen</p>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900">Why Chennai Owners Prefer Veedu Vadagaikku</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
            Tenants contact you directly on your mobile or WhatsApp without paying a brokerage fee. Your listing is verified by our admin team and shown to tenants searching in your exact locality.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="space-y-4 pt-4">
          <div className="text-center space-y-1 mb-8">
            <p className="text-xs font-black uppercase tracking-widest text-[#7D4D2B]">Got Questions?</p>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900">Frequently Asked Questions</h3>
          </div>
          <div className="space-y-3 max-w-3xl mx-auto">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-gray-50/50 transition"
                >
                  <span className="font-bold text-sm sm:text-base text-gray-900 flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-[#7D4D2B] shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 border-t border-gray-100 bg-[#FAF6EF]/30 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Callout Banner with Light Brown & Gold Shine */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#7D4D2B] via-[#9E6941] to-[#6E3F1F] rounded-3xl p-8 sm:p-10 text-white text-center space-y-4 shadow-xl border border-[#D4A373]/40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/20 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#5A3319]/80 border border-[#D4A373]/50 text-[#FFE4A0] text-xs font-black uppercase tracking-wider shadow-sm">
              Limited Festive Period
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
              Don't Miss Chennai's Biggest Free Rental Festival
            </h3>
            <p className="text-xs sm:text-sm text-[#FDECD2] max-w-xl mx-auto">
              Post your property in less than 2 minutes. Start getting direct tenant calls from your neighborhood.
            </p>
            <div className="pt-2">
              <Link
                to="/owner/properties/add"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#D97706] text-[#3D2211] font-black text-sm shadow-lg shadow-amber-950/30 hover:brightness-105 active:scale-95 transition border border-amber-200/40"
              >
                <Sparkles className="w-4 h-4" />
                <span>Post Your Free Property Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DeepavaliPlansShowcase;
