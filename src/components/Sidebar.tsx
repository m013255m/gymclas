import React from 'react';
import {
  Home,
  Users,
  Layers,
  Calendar,
  CheckSquare,
  QrCode,
  CreditCard,
  TrendingUp,
  BarChart3,
  Bell,
  History,
  ShieldCheck,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
  X,
  AlertCircle
} from 'lucide-react';
import { OrganizationConfig } from '../types';
import { ACTIVITY_TERMINOLOGIES } from '../lib/translations';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  lang: 'ar' | 'en';
  organization: OrganizationConfig | null;
  unreadNotifsCount: number;
  unpaidDebtsCount?: number;
  onOpenSetupWizard: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onToggle,
  lang,
  organization,
  unreadNotifsCount,
  unpaidDebtsCount = 0,
  onOpenSetupWizard
}) => {
  const activityType = organization?.activityType || 'educational_academy';
  const activityInfo = ACTIVITY_TERMINOLOGIES[activityType] || ACTIVITY_TERMINOLOGIES.custom;

  const NAV_ITEMS = [
    { id: 'dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', icon: Home, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'members', labelAr: activityInfo.termsAr.memberPlural, labelEn: activityInfo.termsEn.memberPlural, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'debts', labelAr: 'المشتركين المتأخرين (المديونيات)', labelEn: 'Unpaid Members', icon: AlertCircle, badge: unpaidDebtsCount, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { id: 'groups', labelAr: activityInfo.termsAr.groupPlural, labelEn: activityInfo.termsEn.groupPlural, icon: Layers, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'sessions', labelAr: activityInfo.termsAr.sessionPlural, labelEn: activityInfo.termsEn.sessionPlural, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'attendance', labelAr: 'تسجيل الحضور', labelEn: 'Attendance', icon: CheckSquare, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { id: 'qr-scanner', labelAr: 'ماسح الـ QR', labelEn: 'QR Scanner', icon: QrCode, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { id: 'payments', labelAr: 'المدفوعات والإيصالات', labelEn: 'Payments', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'performance', labelAr: 'التقييم ومستوى الأداء', labelEn: 'Performance', icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'reports', labelAr: 'التقارير والإحصائيات', labelEn: 'Reports', icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'notifications', labelAr: 'التنبيهات والمستحقات', labelEn: 'Notifications', icon: Bell, badge: unreadNotifsCount, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'activity-log', labelAr: 'سجل العمليات', labelEn: 'Activity Log', icon: History, color: 'text-slate-400', bg: 'bg-slate-500/10' },
    { id: 'users', labelAr: 'المستخدمين والصلاحيات', labelEn: 'Users & Roles', icon: ShieldCheck, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { id: 'backup', labelAr: 'النسخ والاستعادة', labelEn: 'Backup & Restore', icon: Database, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { id: 'settings', labelAr: 'الإعدادات والترخيص', labelEn: 'Settings', icon: Settings, color: 'text-teal-500', bg: 'bg-teal-500/10' }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-35 md:hidden transition-opacity"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 h-screen z-40 bg-neutral-950 border-r rtl:border-l rtl:border-r-0 border-neutral-800 flex flex-col transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-20 -translate-x-full md:translate-x-0 rtl:translate-x-full rtl:md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-neutral-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white text-black font-black flex items-center justify-center shrink-0 shadow">
              RCN
            </div>
            {isOpen && (
              <div className="truncate">
                <div className="font-black text-sm tracking-tight text-white">RCN MANAGER</div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {lang === 'ar' ? 'نظام إدارة شامل' : 'Universal Management'}
                </div>
              </div>
            )}
          </div>
          {isOpen && (
            <button
              type="button"
              onClick={onToggle}
              className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 relative active:scale-[0.98] ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
              title={lang === 'ar' ? item.labelAr : item.labelEn}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive
                    ? `${item.bg} ${item.color}`
                    : 'bg-neutral-800/60 text-neutral-400 group-hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? item.color : ''}`} />
              </div>
              {isOpen && <span className="truncate">{lang === 'ar' ? item.labelAr : item.labelEn}</span>}
              {/* Unread badge */}
              {item.badge && item.badge > 0 ? (
                <span
                  className={`ml-auto rtl:mr-auto rtl:ml-0 text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-600 text-white shadow-sm animate-pulse ${
                    !isOpen ? 'absolute top-1.5 right-1.5 rtl:left-1.5 rtl:right-auto' : ''
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Activity Type Widget (Bottom card matching screenshot!) */}
      {isOpen && (
        <div className="p-3 m-2 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-xs text-start">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-neutral-800 text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 block">
                {lang === 'ar' ? 'النشاط الفعّال' : 'Active Type'}
              </span>
              <span className="font-bold text-white text-xs block truncate">
                {lang === 'ar' ? activityInfo.nameAr : activityInfo.nameEn}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSetupWizard}
            className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-semibold rounded-lg border border-neutral-700 transition"
          >
            {lang === 'ar' ? 'تغيير نوع النشاط' : 'Change Activity'}
          </button>
        </div>
      )}

      {/* Footer Branding */}
      <div className="p-3 border-t border-neutral-800 text-center">
        {isOpen ? (
          <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
            <span>RCN MANAGER</span>
            <span>v1.0.0</span>
          </div>
        ) : (
          <span className="text-[10px] text-neutral-600 font-mono">v1.0</span>
        )}
      </div>
    </aside>
  </>
  );
};
