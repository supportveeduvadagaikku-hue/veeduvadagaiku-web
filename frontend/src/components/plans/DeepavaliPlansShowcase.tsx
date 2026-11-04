import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  { icon: TrendingUp, label: "Priority Search Visibility", sub: "5x more views on searches" },
  { icon: Megaphone, label: "Property Promotion on Website", sub: "Featured homepage placement" },
  { icon: Headphones, label: "Dedicated Owner Support", sub: "Priority assistance team" },
];

const PLANS = [
  {
    id: "FREE",
    badge: "DEEPAVALI OFFER",
    badgeCls: "bg-[#f59e0b] text-[#1b0610]",
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
    id: "RESIDENTIAL",
    badge: "RESIDENTIAL",
    badgeCls: "bg-amber-50 text-[#92400e] border border-amber-200",
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
    id: "SERVICE",
    badge: "HOME SERVICES",
    badgeCls: "bg-amber-50 text-[#92400e] border border-amber-200",
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
    id: "COMMERCIAL",
    badge: "SHOPS & COMMERCIAL",
    badgeCls: "bg-amber-50 text-[#92400e] border border-amber-200",
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
    id: "HALL",
    badge: "PREMIUM VENUE",
    badgeCls: "bg-[#240a15] text-[#f59e0b]",
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
  const [selectedPlan, setSelectedPlan] = useState("HALL");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 16, hours: 3, minutes: 22, seconds: 40 });

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

  const activePlan = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[PLANS.length - 1];

  const faqs = [
    {
      q: "Is property posting really ₹0 till Deepavali?",
      a: "Yes, 100%! All rental listings (Houses, Flats, Shops, Commercial Spaces, Kalyana Mandapams and Home Services) posted on or before Deepavali, 8 Nov 2026 carry absolutely zero posting fee. No payment gateway or credit card required.",
    },
    {
      q: "How long will my free listing remain active?",
      a: "Any property posted during the Deepavali promotional period will remain live and visible to home seekers in all Chennai pincodes for full 60 days at ₹0.",
    },
    {
      q: "What prices will apply after the offer ends?",
      a: "After the Deepavali offer concludes on 8 Nov 2026: ₹99 for Residential (30 days), ₹555 for Commercial & Shops (60 days), ₹2,500 for Kalyana Mandapams (60 days), and ₹444 for Home Services (60 days).",
    },
    {
      q: "How will tenants get in touch with me?",
      a: "Tenants browse your property by pincode and locality in Chennai, and contact you directly via direct phone calls and WhatsApp messages. Zero intermediary, zero commission.",
    },
  ];

  return (
    <div id="listing-plans" className="w-full bg-[#FAF6EF] text-[#240a15] font-sans scroll-mt-20">
      {/* HERO */}
      <section className="relative overflow-hidden w-full max-w-full bg-gradient-to-b from-[#1b0610] via-[#240a15] to-[#2d0c1b] text-white pt-6 sm:pt-8 pb-12 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-[#3d1323]">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12 relative z-10 w-full">
          {!hideHeroBrandBar && (
            <div className="flex items-center justify-between border-b border-[#3f1525]/60 pb-4 sm:pb-5">
              <Link to="/" className="inline-block group">
                <span className="text-[#f59e0b] font-black text-lg sm:text-2xl tracking-tight leading-none">
                  veeduvadagaikku chennai
                </span>
                <span className="block text-[#edd8de] text-xs sm:text-sm font-normal mt-0.5">
                  வீடு வாடகைக்கு · சென்னை
                </span>
              </Link>
              <Link
                to="/owner/properties/add"
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full border border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b] hover:text-[#1b0610] text-xs sm:text-sm font-bold transition-all"
              >
                List your property
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-start">
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 w-full">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#391121] border border-[#5a1b34] text-[#fcd34d] text-xs sm:text-[13px] font-semibold">
                <Flame className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>For owners & advertisers only</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-[50px] font-black text-white leading-[1.15] tracking-tight break-words">
                List your property &amp; services{" "}
                <span className="text-[#f59e0b] underline decoration-[#f59e0b]/50 decoration-wavy decoration-2">
                  free
                </span>{" "}
                till Deepavali
              </h1>
              <div className="space-y-1.5 break-words">
                <p className="text-sm sm:text-lg lg:text-xl font-bold text-[#fcd34d] leading-relaxed">
                  தீபாவளி வரை உங்கள் வீடு, கடை, மண்டபம் அனைத்தையும் கட்டணமின்றி பதிவு செய்யுங்கள்!
                </p>
                <p className="text-xs sm:text-base lg:text-lg font-medium text-[#edd8de] leading-relaxed">
                  இந்த தீபாவளிக்கு உங்கள் சொத்து சென்னை முழுவதும் தெரியட்டும் – பதிவு முற்றிலும் இலவசம்!
                </p>
              </div>
              <p className="text-xs sm:text-base text-[#d4bac6] max-w-xl font-normal leading-relaxed">
                Put your house, shop, hall or home service in front of Chennai across every pincode. No listing fee on anything posted on or before Deepavali.
              </p>
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <Link
                  to="/owner/properties/add"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#f59e0b] hover:bg-[#eab308] text-[#1b0610] text-sm sm:text-base font-black shadow-xl shadow-amber-500/25 transition-all active:scale-95 group text-center"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Post your property for free</span>
                  <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-[#edd8de] font-semibold">
                  <Clock className="w-4 h-4 text-[#f59e0b] shrink-0" />
                  <span>Offer ends Deepavali, 8 Nov 2026</span>
                </div>
              </div>

              {/* Wanted Column Button directly below Deepavali button */}
              <div className="pt-0.5">
                <Link
                  to="/wanted-spaces/specify"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition-all active:scale-95 group text-center"
                >
                  <Megaphone className="w-4 h-4 text-emerald-200 shrink-0" />
                  <span>Wanted Column (தேவை பகுதி - Post Requirement)</span>
                  <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="pt-2 w-full max-w-full overflow-hidden">
                <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3 p-2.5 px-3 sm:px-4 rounded-2xl bg-[#320e1e]/90 border border-[#52192f] text-xs max-w-full">
                  <span className="text-[#fcd34d] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Deepavali Countdown:
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-white font-mono font-black text-xs sm:text-sm">
                    {[{ v: timeLeft.days, u: "d" }, { v: timeLeft.hours, u: "h" }, { v: timeLeft.minutes, u: "m" }, { v: timeLeft.seconds, u: "s" }].map((t, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span className="text-[#f59e0b]">:</span>}
                        <span className="px-1.5 sm:px-2 py-0.5 bg-[#441329] rounded-md text-[#f59e0b]">
                          {String(t.v).padStart(2, "0")}{t.u}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 w-full">
              <div className="bg-white text-gray-900 rounded-3xl p-5 sm:p-8 shadow-2xl border-2 border-amber-300/40 relative overflow-hidden hover:scale-[1.01] transition-transform w-full">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-500 text-[#1b0610] text-[10px] font-black uppercase tracking-widest py-1 px-4 rounded-bl-xl">
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
                    <Link to="/owner/properties/add" className="w-full py-3 px-4 rounded-full bg-[#240a15] hover:bg-[#320e1e] text-[#f59e0b] font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md">
                      <span>Post your property for free</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link to="/wanted-spaces/specify" className="w-full py-2.5 px-4 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition">
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

      {/* INTERACTIVE PLANS + FEATURE GRID */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-10">
        {/* Header */}
        <div className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-widest text-[#8b263e] block">
            OWNER ADVERTISING PLANS · விளம்பரத் திட்டங்கள்
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#240a15] tracking-tight">Simple pricing for owners</h2>
          <p className="text-sm sm:text-base text-gray-600">Click a plan to see included features. Free right now, low after the offer ends.</p>
        </div>

        {/* Plan Cards */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pt-5 pb-4">
          <div className="flex gap-4 min-w-max sm:min-w-0 sm:grid sm:grid-cols-5">
            {PLANS.map((plan) => {
              const isActive = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative w-44 sm:w-auto flex flex-col text-left rounded-3xl border-2 transition-all duration-200 overflow-visible focus:outline-none cursor-pointer
                    ${isActive
                      ? plan.isPremium
                        ? "border-[#f59e0b] shadow-2xl shadow-[#240a15]/30 scale-[1.03]"
                        : "border-[#240a15] shadow-xl shadow-[#240a15]/15 scale-[1.03]"
                      : "border-[#e8d5cb] shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    }
                    ${isActive && plan.isPremium ? "bg-[#240a15]" : "bg-white"}
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
                      <h3 className={`text-sm font-black tracking-tight leading-snug ${isActive && plan.isPremium ? "text-white" : "text-[#240a15]"}`}>
                        {plan.name}
                      </h3>
                      <span className={`text-[10px] font-medium block mt-0.5 ${isActive && plan.isPremium ? "text-[#edd8de]" : "text-gray-500"}`}>
                        {plan.nameTamil}
                      </span>
                    </div>

                    <div>
                      {plan.strikePrice && (
                        <span className={`text-[10px] line-through font-semibold block ${isActive && plan.isPremium ? "text-[#edd8de]" : "text-gray-400"}`}>
                          {plan.strikePrice}
                        </span>
                      )}
                      <span className={`text-2xl font-black tracking-tight block ${isActive && plan.isPremium ? "text-[#f59e0b]" : "text-[#240a15]"}`}>
                        {plan.price}
                      </span>
                      <span className={`text-[10px] font-medium mt-0.5 block ${isActive && plan.isPremium ? "text-[#edd8de]" : "text-gray-500"}`}>
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
                              ? "bg-[#f59e0b] text-[#1b0610] hover:bg-[#eab308] shadow-md"
                              : "bg-[#240a15] text-[#f59e0b] hover:bg-[#320e1e] shadow-md"
                            : "border-2 border-[#240a15] text-[#240a15] hover:bg-[#240a15] hover:text-white"
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
              <p className="text-xs font-black uppercase tracking-widest text-[#8b263e]">
                {activePlan.name} — Features Included
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {activePlan.enabledCount} of {PLAN_FEATURES.length} features enabled
              </p>
            </div>
            <div className="flex items-center gap-5 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#240a15]">
                <span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block" />
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
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 transition-colors ${enabled ? "bg-[#f59e0b]/15 text-[#92400e]" : "bg-gray-100 text-gray-400"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold leading-snug ${enabled ? "text-[#240a15]" : "text-gray-400"}`}>
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
              <span className="text-[#240a15] font-bold">{activePlan.name}</span> — {activePlan.price} {activePlan.period}
              {activePlan.isOffer && <span className="ml-2 text-emerald-700 font-bold">Free during Deepavali!</span>}
            </p>
            <Link
              to={activePlan.ctaLink}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black tracking-wide transition-all active:scale-95 whitespace-nowrap ${activePlan.isPremium ? "bg-[#240a15] text-[#f59e0b] hover:bg-[#320e1e]" : "bg-[#f59e0b] text-[#1b0610] hover:bg-[#eab308]"} shadow-md`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activePlan.ctaLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Offer Details */}
        <div className="bg-[#fff5e6] rounded-3xl p-6 sm:p-8 border border-[#fde2b8] space-y-2">
          <h3 className="text-base font-black text-[#240a15]">Offer details</h3>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            All listings posted on or before Deepavali, 8 Nov 2026 carry no listing fee. Post-offer pricing: ₹99 per residential listing (30 days), ₹555 per shop or commercial (60 days), ₹2,500 per kalyana mandapam or convention hall (60 days), and ₹444 per home service (60 days).
          </p>
        </div>

        {/* Three Steps */}
        <div className="space-y-6 pt-2">
          <h2 className="text-2xl sm:text-3xl font-black text-[#240a15] tracking-tight">Three steps to list</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: "1", title: "Add your property", desc: "Enter the area, pincode, rent and photos of your house or shop." },
              { n: "2", title: "Go live in Chennai", desc: "Your listing shows up for home seekers searching your pincode." },
              { n: "3", title: "Get enquiries", desc: "Seekers find your listing and get in touch with you directly." },
            ].map((step) => (
              <div key={step.n} className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e8d5cb] shadow-sm space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-9 h-9 rounded-full bg-[#240a15] text-[#f59e0b] font-black text-base flex items-center justify-center shadow-md">
                  {step.n}
                </div>
                <h3 className="text-base sm:text-lg font-black text-[#240a15]">{step.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4 pt-2 max-w-4xl mx-auto">
          <div className="text-center space-y-1 pb-2">
            <h3 className="text-xl sm:text-2xl font-black text-[#240a15] tracking-tight">Frequently Asked Questions</h3>
            <p className="text-xs sm:text-sm text-gray-500">Everything about Chennai''s ₹0 Deepavali festive listing offer</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-[#e8d5cb] shadow-xs overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#240a15]"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#f59e0b] shrink-0" />
                      <span>{faq.q}</span>
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-[#1b0610] via-[#240a15] to-[#2d0c1b] rounded-3xl p-8 sm:p-10 text-white text-center space-y-4 shadow-xl">
          <span className="inline-block px-3 py-1 rounded-full bg-[#3f1525] text-[#fcd34d] text-xs font-bold uppercase tracking-wider">
            Celebrate Deepavali 2026 With Zero Brokerage &amp; Free Listings
          </span>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight max-w-xl mx-auto">
            Ready to list your rental property or home service in Chennai?
          </h3>
          <p className="text-xs sm:text-sm text-[#d4bac6] max-w-md mx-auto">
            Takes less than 2 minutes. No payment required until Deepavali, 8 Nov 2026.
          </p>
          <div className="pt-2">
            <Link
              to="/owner/properties/add"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#f59e0b] hover:bg-[#eab308] text-[#1b0610] font-black text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Post your property for free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

