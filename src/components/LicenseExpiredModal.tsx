import React, { useState } from 'react';
import { AlertCircle, Phone, MessageSquare, ShieldCheck, KeyRound, Calendar, Lock } from 'lucide-react';
import { User } from '../types';

interface LicenseExpiredModalProps {
  user?: User | null;
  onRenewSuccess?: (newExpiryDate: string) => void;
  onLogout?: () => void;
  onClose?: () => void;
  supportPhone?: string;
  lang?: 'ar' | 'en';
}

export const LicenseExpiredModal: React.FC<LicenseExpiredModalProps> = ({
  user = null,
  onRenewSuccess,
  onLogout,
  onClose,
  supportPhone = '01060474659',
  lang = 'ar'
}) => {
  const [renewalCode, setRenewalCode] = useState('');
  const [showAdminOverride, setShowAdminOverride] = useState(false);
  const [error, setError] = useState('');
  const [extendedDays, setExtendedDays] = useState('365');
  const contactPhone = supportPhone || '01060474659';

  const handleApplyRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalCode && !showAdminOverride) {
      setError(lang === 'ar' ? 'يرجى إدخال كود التجديد أو التواصل مع المطور' : 'Please enter renewal code or contact developer');
      return;
    }
    // Accept master renewal code or admin override
    if (renewalCode.trim() === 'RCN-RENEW-2025' || renewalCode.trim() === '01060474659' || showAdminOverride) {
      const days = parseInt(extendedDays, 10) || 365;
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + days);
      if (onRenewSuccess) {
        onRenewSuccess(newDate.toISOString());
      }
    } else {
      setError(lang === 'ar' ? 'كود التجديد غير صحيح. يرجى الاتصال على 01060474659' : 'Invalid renewal code. Please call 01060474659');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-6 md:p-8 text-white relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center">
          {/* Top Warning Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-700 text-white mb-5 shadow-inner">
            <Lock className="w-8 h-8 text-neutral-200 animate-pulse" />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            {lang === 'ar' ? 'انتهت صلاحية الاشتراك والترخيص' : 'Subscription Expired'}
          </h2>

          <p className="text-sm font-mono text-neutral-400 mb-4">
            RCN MANAGER • {lang === 'ar' ? 'نظام إدارة الأنشطة والأعضاء الشامل' : 'Universal Member Management'}
          </p>

          <p className="text-neutral-300 text-sm leading-relaxed mb-6 px-2">
            {lang === 'ar'
              ? 'عزيزي المستخدم، انتهت فترة الاشتراك أو الترخيص لحسابك في نظام RCN MANAGER. للمتابعة وتجديد الاشتراك، يرجى التواصل مع الدعم الفني للمطور:'
              : 'Dear user, your system subscription license for this account has reached its expiration date. To renew your license and continue using RCN MANAGER, please contact support:'}
          </p>

          {/* Account Details Box */}
          {user && (
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 mb-6 text-xs text-neutral-300 space-y-2 text-start">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">{lang === 'ar' ? 'اسم المستخدم:' : 'Username:'}</span>
                <span className="font-semibold text-white">{user.username} ({user.name})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">{lang === 'ar' ? 'تاريخ الإنشاء:' : 'Created At:'}</span>
                <span>{new Date(user.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">{lang === 'ar' ? 'تاريخ الانتهاء:' : 'Expired At:'}</span>
                <span className="text-red-400 font-semibold">{new Date(user.expiresAt || user.licenseExpiresAt || Date.now()).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
              </div>
            </div>
          )}

          {/* Contact Developer Card */}
          <div className="bg-neutral-900 border border-white/20 rounded-xl p-5 mb-6 text-center">
            <span className="text-xs text-neutral-400 block mb-1">
              {lang === 'ar' ? 'هاتف التجديد والدعم الفني المباشر:' : 'Direct Phone for Renewal & Support:'}
            </span>
            <div className="text-2xl md:text-3xl font-black font-mono tracking-widest text-white py-1">
              {contactPhone}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <a
                href={`tel:${contactPhone}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>{lang === 'ar' ? 'اتصال هاتفي الآن' : 'Call Now'}</span>
              </a>
              <a
                href={`https://wa.me/201060474659?text=${encodeURIComponent(
                  lang === 'ar'
                    ? `مرحباً، أود تجديد ترخيص نظام RCN MANAGER للمستخدم: ${user?.username || 'admin'}`
                    : `Hello, I would like to renew my RCN MANAGER subscription for user: ${user?.username || 'admin'}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm border border-neutral-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{lang === 'ar' ? 'مراسلة عبر واتساب' : 'WhatsApp'}</span>
              </a>
            </div>
          </div>

          {/* Quick Renewal Code Form / Admin Simulator */}
          <form onSubmit={handleApplyRenewal} className="space-y-3 mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={lang === 'ar' ? 'أدخل كود التجديد (أو هاتف المطور 01060474659)' : 'Enter renewal key...'}
                value={renewalCode}
                onChange={(e) => {
                  setRenewalCode(e.target.value);
                  setError('');
                }}
                className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg border border-neutral-600 transition-colors"
              >
                {lang === 'ar' ? 'تفعيل' : 'Activate'}
              </button>
            </div>
            {error && <p className="text-xs text-red-400 text-start">{error}</p>}
          </form>

          {/* Quick toggle for developer test / emergency renewal */}
          <div className="border-t border-neutral-800 pt-4 flex items-center justify-between text-xs text-neutral-500">
            <button
              type="button"
              onClick={() => setShowAdminOverride(!showAdminOverride)}
              className="hover:text-neutral-300 underline"
            >
              {lang === 'ar' ? 'تمديد فوري (للمشرف)' : 'Admin License Override'}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="hover:text-white"
            >
              {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
            </button>
          </div>

          {showAdminOverride && (
            <div className="mt-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-start space-y-2">
              <label className="text-xs text-neutral-400 block">
                {lang === 'ar' ? 'تمديد الترخيص بالأيام:' : 'Extend license by days:'}
              </label>
              <div className="flex gap-2">
                <select
                  value={extendedDays}
                  onChange={(e) => setExtendedDays(e.target.value)}
                  className="bg-black border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="30">30 يوماً (شهر)</option>
                  <option value="90">90 يوماً (3 أشهر)</option>
                  <option value="365">365 يوماً (سنة)</option>
                  <option value="730">سنتان (730 يوماً)</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const days = parseInt(extendedDays, 10) || 365;
                    const newDate = new Date();
                    newDate.setDate(newDate.getDate() + days);
                    if (onRenewSuccess) {
                      onRenewSuccess(newDate.toISOString());
                    }
                  }}
                  className="px-3 py-1 bg-white text-black text-xs font-semibold rounded hover:bg-neutral-200"
                >
                  {lang === 'ar' ? 'تمديد الآن' : 'Extend Now'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
