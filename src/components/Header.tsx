import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  Calendar as CalendarIcon,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Shield,
  Wifi,
  WifiOff,
  User as UserIcon,
  CheckCircle2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { InternalNotification, Member, OrganizationConfig, User } from '../types';

interface HeaderProps {
  currentUser: User | null;
  organization: OrganizationConfig | null;
  notifications: InternalNotification[];
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  lang: 'ar' | 'en';
  onLanguageToggle: () => void;
  onMenuToggle: () => void;
  onLogout: () => void;
  onSelectMember: (member: Member) => void;
  allMembers: Member[];
  onNavigate: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  organization,
  notifications,
  theme,
  onThemeToggle,
  lang,
  onLanguageToggle,
  onMenuToggle,
  onLogout,
  onSelectMember,
  allMembers,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const matches = allMembers
      .filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.memberCode.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          (m.guardianPhone && m.guardianPhone.includes(q))
      )
      .slice(0, 6);
    setSearchResults(matches);
    setShowSearchResults(true);
  }, [searchQuery, allMembers]);

  // Formatted date
  const todayDateFormatted = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 flex items-center justify-between gap-3 sticky top-0 z-30 transition-colors">
      {/* Right/Left section: Menu toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute top-3 left-3 rtl:right-3 rtl:left-auto" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
              placeholder={lang === 'ar' ? 'بحث عن مشترك بالاسم أو الكود...' : 'Search member by name or code...'}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-9 py-2 text-xs md:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 transition"
            />
          </div>

          {/* Quick Search Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full mt-1.5 w-full bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto space-y-1">
              {searchResults.length > 0 ? (
                searchResults.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectMember(m);
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                    className="w-full p-2 rounded-lg hover:bg-neutral-900 flex items-center justify-between text-start transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={m.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName)}&background=222&color=fff`}
                        alt={m.fullName}
                        className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                      />
                      <div>
                        <div className="font-bold text-xs text-white">{m.fullName}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">{m.memberCode} • {m.phone}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {m.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-neutral-500">
                  {lang === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching records found'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center/End: Online status, Date, Notifications, Theme toggle, User Profile */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Online / Offline badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs shadow-xs">
          <span className="relative flex h-2 w-2">
            {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="text-neutral-300 font-medium">
            {isOnline ? (lang === 'ar' ? 'متصل محلياً' : 'Local Online') : (lang === 'ar' ? 'غير متصل' : 'Offline')}
          </span>
        </div>

        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-300 shadow-xs">
          <div className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-[11px]">{todayDateFormatted}</span>
        </div>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-xl text-neutral-400 hover:text-amber-400 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-all duration-200 active:scale-95 relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 rtl:-left-1 rtl:-right-auto w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifMenu && (
            <div className="absolute top-full mt-2 left-0 rtl:right-auto rtl:left-0 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-3 z-50 text-white">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
                <span className="font-bold text-xs">
                  {lang === 'ar' ? 'التنبيهات والإشعارات' : 'Alerts & Notifications'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('notifications');
                    setShowNotifMenu(false);
                  }}
                  className="text-[11px] text-neutral-400 hover:text-white underline"
                >
                  {lang === 'ar' ? 'عرض الكل' : 'View All'}
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-xs">
                    <div className="font-semibold text-white flex items-center justify-between">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-neutral-500 font-normal">{n.date}</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Toggle */}
        <button
          type="button"
          onClick={onThemeToggle}
          className="p-2 rounded-xl text-neutral-400 hover:text-blue-500 hover:bg-neutral-900 border border-neutral-800 hover:border-blue-500/40 transition-all duration-200 active:scale-95"
          title={theme === 'dark' ? 'التبديل للوضع الفاتح' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* User Profile Dropdown */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-neutral-900 border border-neutral-800 transition-all duration-200 active:scale-98"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Avatar"
              className="w-7 h-7 rounded-full object-cover border border-neutral-700"
            />
            <div className="hidden sm:block text-start text-xs">
              <div className="font-bold text-white leading-tight">{currentUser?.name || 'المدير العام'}</div>
              <div className="text-[10px] text-neutral-400">
                {currentUser?.role === 'admin' ? (lang === 'ar' ? 'مدير النظام' : 'System Admin') : (currentUser?.role || 'مستخدم')}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          {showUserMenu && (
            <div className="absolute top-full mt-2 left-0 rtl:right-auto rtl:left-0 w-52 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-2 z-50 text-white">
              <div className="px-3 py-2 border-b border-neutral-800 text-xs">
                <span className="text-neutral-500 block text-[10px]">{lang === 'ar' ? 'تم تسجيل الدخول كـ' : 'Signed in as'}</span>
                <span className="font-bold text-white block">{currentUser?.username || 'admin'}</span>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-start text-xs hover:bg-neutral-900 flex items-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{lang === 'ar' ? 'الإعدادات والترخيص' : 'Settings & License'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLanguageToggle();
                    setShowUserMenu(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-start text-xs hover:bg-neutral-900 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{lang === 'ar' ? 'English (EN)' : 'عربي (AR)'}</span>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full px-3 py-2 rounded-lg text-start text-xs hover:bg-neutral-900 text-red-400 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
