import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, User, LogOut, Menu, X, PlusCircle, Building2, Store, Users, Sparkles, MapPin, ChevronDown, Wrench, Gift } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const { user, isAuthenticated, isOwner, isAdmin, logout } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EFE8D8] shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & City Selector */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link to="/" className="flex items-center group py-0.5 shrink-0">
              <img
                src="/logo.png"
                alt="veeduvadagaikkuchennai"
                className="h-12 sm:h-[62px] w-auto object-contain rounded-xl group-hover:scale-[1.03] transition-transform drop-shadow-md"
              />
            </Link>

            {/* City Indicator */}
            <div className="hidden 2xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F0] border border-[#E8DFC8] text-xs font-semibold text-gray-700 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Chennai</span>
            </div>
          </div>

          {/* Right Navigation & Action Buttons (Spaced accordingly) */}
          <div className="hidden md:flex items-center gap-3.5 lg:gap-5 shrink-0">
            <Link
              to="/about"
              className="text-sm font-medium text-gray-700 hover:text-[#9A7818] transition-colors whitespace-nowrap"
            >
              {t('nav.about')}
            </Link>
            <Link
              to="/contact"
              className="text-sm font-medium text-gray-700 hover:text-[#9A7818] transition-colors whitespace-nowrap"
            >
              {t('nav.contact')}
            </Link>
            <Link
              to="/plans"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#7D4D2B] via-[#9E6941] to-[#6E3F1F] text-[#FFE4A0] border border-[#D4A373]/60 text-xs font-bold hover:brightness-110 hover:scale-[1.02] transition-all shadow-sm whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Listing Plans</span>
            </Link>

            <div className="h-6 w-px bg-[#E8DFC8]"></div>
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2 p-1.5 pl-3 pr-2 rounded-full bg-white border border-[#E8DFC8] hover:border-[#C5A059] transition shadow-xs"
                >
                  <span className="text-sm font-medium text-gray-800">
                    {user?.name.split(' ')[0]}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#FAF4E6] text-[#9A7818] border border-[#E8DFC8] flex items-center justify-center font-bold text-xs">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </button>

                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#EFE8D8] py-2 animate-slide-up z-50">
                    <div className="px-4 py-2 border-b border-[#F0E8D5]">
                      <p className="text-xs text-gray-400 font-normal">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                      <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold rounded-full bg-[#FAF4E6] text-[#9A7818] border border-[#E8DFC8]">
                        {user?.role}
                      </span>
                    </div>

                    {isAdmin ? (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#FAF7F0] font-medium"
                      >
                        Admin Dashboard
                      </Link>
                    ) : isOwner ? (
                      <>
                        <Link
                          to="/owner/dashboard"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#FAF7F0] font-medium"
                        >
                          Owner Dashboard
                        </Link>
                        <Link
                          to="/owner/properties"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#FAF7F0] font-medium"
                        >
                          My Properties
                        </Link>
                        <Link
                          to="/owner/enquiries"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#FAF7F0] font-medium"
                        >
                          Enquiries
                        </Link>
                        <Link
                          to="/home-services/list"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#FAF7F0] font-medium"
                        >
                          List Home Service
                        </Link>
                        <Link
                          to="/owner/profile"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#FAF7F0] font-medium"
                        >
                          Profile
                        </Link>
                        <Link
                          to="/owner/listing-plans"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-[#92400e] hover:bg-[#FAF7F0] font-bold"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
                          Plans &amp; Offers
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/user/dashboard"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#FAF7F0] font-medium"
                        >
                          User Dashboard
                        </Link>
                        <Link
                          to="/user/favourites"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#FAF7F0] font-medium"
                        >
                          <Heart className="w-4 h-4 text-[#C5A059]" />
                          Saved Properties
                        </Link>
                        <Link
                          to="/user/enquiries"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#FAF7F0] font-medium"
                        >
                          My Enquiries
                        </Link>
                        <Link
                          to="/user/profile"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#FAF7F0] font-medium"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                      </>
                    )}

                    <div className="border-t border-[#F0E8D5] my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-700 hover:text-[#B08B40] transition px-3 py-2"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-bold text-[#9A7818] bg-[#FAF4E6] hover:bg-[#F5EAD4] border border-[#E8DFC8] px-3.5 py-2 rounded-xl transition shadow-2xs"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Language Switcher Button (Desktop) */}
            <LanguageSwitcher />

            {/* "Post Property" CTA in Lite Gold */}
            {isOwner ? (
              <Link
                to="/owner/properties/add"
                className="flex items-center gap-2 px-5 py-2.5 sm:py-2.5 bg-gradient-to-r from-[#D4AF37] via-[#C5A059] to-[#B8860B] hover:brightness-105 text-white rounded-xl sm:rounded-2xl font-extrabold text-sm sm:text-[15px] shadow-md shadow-[#D4AF37]/25 transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                {t('nav.postProperty')}
              </Link>
            ) : (
              <Link
                to={isAuthenticated ? '/owner/dashboard' : '/login?role=OWNER'}
                className="flex items-center gap-2 px-5 py-2.5 sm:py-2.5 bg-gradient-to-r from-[#D4AF37] via-[#C5A059] to-[#B8860B] hover:brightness-105 text-white rounded-xl sm:rounded-2xl font-extrabold text-sm sm:text-[15px] shadow-md shadow-[#D4AF37]/25 transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                {t('nav.listProperty')}
              </Link>
            )}
          </div>

          {/* Mobile Actions: Language Switcher + Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-700 hover:text-[#B08B40] rounded-xl hover:bg-[#FAF7F0] transition"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-[#EFE8D8] bg-white px-4 pt-3 pb-6 space-y-0.5 animate-fade-in shadow-xl">
          <Link
            to="/houses"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-gray-800 hover:bg-[#FAF6ED] rounded-xl"
          >
            <Building2 className="w-4 h-4 text-[#C5A059]" />
            {t('nav.houses')}
          </Link>
          <Link
            to="/hostels"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-gray-800 hover:bg-[#FAF6ED] rounded-xl"
          >
            <Users className="w-4 h-4 text-[#C5A059]" />
            {t('nav.hostels')}
          </Link>
          <Link
            to="/shops"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-gray-800 hover:bg-[#FAF6ED] rounded-xl"
          >
            <Store className="w-4 h-4 text-[#C5A059]" />
            {t('nav.shops')}
          </Link>
          <Link
            to="/marriage-halls"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-gray-800 hover:bg-[#FAF6ED] rounded-xl"
          >
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            {t('nav.marriageHalls')}
          </Link>
          <Link
            to="/home-services"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-gray-800 hover:bg-[#FAF6ED] rounded-xl"
          >
            <Wrench className="w-4 h-4 text-[#C5A059]" />
            {t('nav.homeServices')}
          </Link>
          <Link
            to="/wanted-spaces"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-gray-800 hover:bg-[#FAF6ED] rounded-xl"
          >
            <Search className="w-4 h-4 text-[#C5A059]" />
            Wanted Specify
          </Link>
          <Link
            to="/plans"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3.5 py-3 text-sm font-bold text-[#4D270E] hover:bg-[#FAF6ED] rounded-xl bg-[#fff5e6] border border-[#fde2b8]"
          >
            <Sparkles className="w-4 h-4 text-[#f59e0b]" />
            <span>Listing Plans</span>
          </Link>
          <Link
            to="/about"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-gray-800 hover:bg-[#FAF6ED] rounded-xl"
          >
            <User className="w-4 h-4 text-[#C5A059]" />
            {t('nav.about')}
          </Link>
          <Link
            to="/contact"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-gray-800 hover:bg-[#FAF6ED] rounded-xl"
          >
            <User className="w-4 h-4 text-[#C5A059]" />
            {t('nav.contact')}
          </Link>

          <div className="border-t border-[#F0E8D5] pt-3">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <p className="text-xs text-gray-400 font-normal">Logged in as</p>
                  <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                </div>
                {isAdmin ? (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-sm font-semibold text-[#9A7818] bg-[#FAF4E6] rounded-xl"
                  >
                    Admin Dashboard
                  </Link>
                ) : isOwner ? (
                  <>
                    <Link
                      to="/owner/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 text-sm font-semibold text-[#9A7818] bg-[#FAF4E6] rounded-xl"
                    >
                      {t('nav.dashboard')}
                    </Link>
                    <Link
                      to="/owner/properties"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-[#FAF7F0] rounded-xl"
                    >
                      {t('nav.myProperties')}
                    </Link>
                    <Link
                      to="/home-services/list"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 text-sm font-semibold text-[#9A7818] hover:bg-[#FAF7F0] rounded-xl"
                    >
                      + List Home Service
                    </Link>
                    <Link
                      to="/owner/properties/add"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#C5A059] rounded-xl text-center shadow-md shadow-[#D4AF37]/20"
                    >
                      + {t('nav.postProperty')}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/user/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 text-sm font-semibold text-[#9A7818] bg-[#FAF4E6] rounded-xl"
                    >
                      {t('nav.dashboard')}
                    </Link>
                    <Link
                      to="/user/favourites"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-[#FAF7F0] rounded-xl"
                    >
                      {t('nav.saved')}
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login?role=OWNER"
                  onClick={() => setIsOpen(false)}
                  className="block text-center py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#C5A059] rounded-xl shadow-md"
                >
                  List Your Property Free
                </Link>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="text-center py-2.5 px-4 text-sm font-semibold text-gray-700 bg-[#FAF7F0] border border-[#E8DFC8] rounded-xl"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="text-center py-2.5 px-4 text-sm font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#C5A059] rounded-xl shadow-md shadow-[#D4AF37]/20"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
