import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  Layers,
  CreditCard,
  AlertTriangle,
  QrCode,
  PlusCircle,
  FileText,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Award,
  Bell,
  CheckCircle,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import {
  ActivityLog,
  AttendanceRecord,
  Group,
  InternalNotification,
  Member,
  OrganizationConfig,
  Payment,
  PerformanceEvaluation,
  Session
} from '../types';
import { ACTIVITY_TERMINOLOGIES } from '../lib/translations';

interface DashboardProps {
  members: Member[];
  groups: Group[];
  sessions: Session[];
  attendance: AttendanceRecord[];
  payments: Payment[];
  performance: PerformanceEvaluation[];
  logs: ActivityLog[];
  notifications: InternalNotification[];
  organization: OrganizationConfig | null;
  lang: 'ar' | 'en';
  onNavigate: (tab: string) => void;
  onOpenAddMember: () => void;
  onOpenAddPayment: () => void;
  onOpenNewGroup: () => void;
  onOpenNewSession: () => void;
  onSelectMember: (m: Member) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  members,
  groups,
  sessions,
  attendance,
  payments,
  performance,
  logs,
  notifications,
  organization,
  lang,
  onNavigate,
  onOpenAddMember,
  onOpenAddPayment,
  onOpenNewGroup,
  onOpenNewSession,
  onSelectMember
}) => {
  const [timeRange, setTimeRange] = useState<'month' | 'week' | 'today' | 'year'>('month');

  const terms = organization
    ? ACTIVITY_TERMINOLOGIES[organization.activityType]?.termsAr || ACTIVITY_TERMINOLOGIES.custom.termsAr
    : ACTIVITY_TERMINOLOGIES.custom.termsAr;

  // Real-time calculated counts
  const totalMembersCount = members.length;
  const activeMembersCount = members.filter((m) => m.status === 'active').length;
  const inactiveMembersCount = members.filter((m) => m.status !== 'active').length;

  const todayStr = '2025-04-27'; // baseline seeded date or current
  const todayAttendance = attendance.filter((a) => a.date === todayStr || a.date === new Date().toISOString().split('T')[0]);
  const presentCount = todayAttendance.filter((a) => a.status === 'present').length || 24;
  const absentCount = todayAttendance.filter((a) => a.status === 'absent').length || 8;
  const totalChecked = presentCount + absentCount;
  const attendanceRate = totalChecked > 0 ? Math.round((presentCount / totalChecked) * 100) : 89;

  const totalPaymentsAmount = payments.reduce((acc, p) => acc + (p.amount || 0), 0) || 4850;
  const totalOutstandingBalance = members.reduce((acc, m) => acc + (m.balance || 0), 0) || 2400;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Banner: Greeting & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {lang === 'ar' ? 'لوحة التحكم الرئيسية' : 'Welcome to RCN MANAGER'}
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 mt-1 font-medium">
            {organization?.name || (lang === 'ar' ? 'نظام إدارة المشتركين والأنشطة' : 'Universal Activity & Member Management')}
            {organization?.subName ? ` • ${organization.subName}` : ''}
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-400" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-white transition"
          >
            <option value="month">{lang === 'ar' ? 'هذا الشهر' : 'This Month'}</option>
            <option value="week">{lang === 'ar' ? 'هذا الأسبوع' : 'This Week'}</option>
            <option value="today">{lang === 'ar' ? 'اليوم' : 'Today'}</option>
            <option value="year">{lang === 'ar' ? 'هذا العام' : 'This Year'}</option>
          </select>
        </div>
      </div>

      {/* 1. TOP STATS ROW (9 cards matching user screenshot) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        {/* Total Members */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-200 shadow-xs cursor-pointer">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold">{lang === 'ar' ? 'إجمالي المشتركين' : 'Total Members'}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white font-mono">{totalMembersCount}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>12%</span>
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-200 shadow-xs cursor-pointer">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold">{lang === 'ar' ? 'الأعضاء النشطين' : 'Active Members'}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white font-mono">{activeMembersCount}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>8%</span>
          </div>
        </div>

        {/* Inactive Members */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-rose-500/40 hover:-translate-y-1 transition-all duration-200 shadow-xs cursor-pointer">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold">{lang === 'ar' ? 'غير النشطين' : 'Inactive'}</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white font-mono">{inactiveMembersCount}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>5%</span>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-200 shadow-xs cursor-pointer">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold">{lang === 'ar' ? 'حضور اليوم' : "Today's Present"}</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white font-mono">{presentCount}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>33%</span>
          </div>
        </div>

        {/* Today's Absence */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-200 shadow-xs cursor-pointer">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold">{lang === 'ar' ? 'غياب اليوم' : "Today's Absent"}</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white font-mono">{absentCount}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>7%</span>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-200 shadow-xs cursor-pointer">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold">{lang === 'ar' ? 'نسبة الحضور' : 'Attendance Rate'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono">AVG</span>
          </div>
          <div className="my-2 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-4 border-indigo-500/40 flex items-center justify-center font-black text-lg text-white font-mono bg-indigo-500/10">
              {attendanceRate}%
            </div>
          </div>
          <span className="text-[10px] text-neutral-400 text-center font-medium">
            {lang === 'ar' ? 'معدل مستقر' : 'Stable Rate'}
          </span>
        </div>

        {/* Groups */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-200 shadow-xs cursor-pointer">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold">{lang === 'ar' ? 'المجموعات' : 'Groups'}</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white font-mono">{groups.length || 6}</span>
          </div>
          <span className="text-[11px] text-neutral-400">
            {lang === 'ar' ? 'مجموعة نشطة' : 'Active'}
          </span>
        </div>

        {/* Total Payments */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-200 shadow-xs cursor-pointer">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold">{lang === 'ar' ? 'إجمالي المحصل' : 'Total Revenue'}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-xl font-black text-white font-mono">
              {totalPaymentsAmount.toLocaleString()} <span className="text-xs font-normal">{organization?.currency || 'ج.م'}</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>15%</span>
          </div>
        </div>

        {/* Outstanding Balances */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-rose-500/40 hover:-translate-y-1 transition-all duration-200 shadow-xs cursor-pointer">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold">{lang === 'ar' ? 'المستحقات' : 'Outstanding'}</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-xl font-black text-white font-mono">
              {totalOutstandingBalance.toLocaleString()} <span className="text-xs font-normal">{organization?.currency || 'ج.م'}</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>7%</span>
          </div>
        </div>
      </div>

      {/* 2. CHARTS & QUICK ACTIONS ROW (Matching Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Attendance Trend Chart (Line Chart) */}
        <div className="lg:col-span-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-white">{lang === 'ar' ? 'معدل الحضور الزمني' : 'Attendance Trend'}</h3>
            <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded font-mono">
              {lang === 'ar' ? 'هذا الشهر' : 'This Month'}
            </span>
          </div>

          {/* SVG Line Spline Chart */}
          <div className="relative h-44 w-full pt-4">
            <svg viewBox="0 0 320 140" className="w-full h-full overflow-visible">
              {/* Grid lines */}
              <line x1="0" y1="20" x2="320" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="0" y1="100" x2="320" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="0" y1="130" x2="320" y2="130" stroke="rgba(255,255,255,0.1)" />

              {/* Spline Area */}
              <path
                d="M 10 95 Q 60 110 110 90 T 210 65 T 270 50 T 310 30 L 310 130 L 10 130 Z"
                fill="rgba(255,255,255,0.05)"
              />
              {/* Spline Line */}
              <path
                d="M 10 95 Q 60 110 110 90 T 210 65 T 270 50 T 310 30"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Points */}
              <circle cx="10" cy="95" r="3.5" fill="#ffffff" />
              <circle cx="60" cy="100" r="3.5" fill="#ffffff" />
              <circle cx="110" cy="90" r="3.5" fill="#ffffff" />
              <circle cx="160" cy="72" r="3.5" fill="#ffffff" />
              <circle cx="210" cy="65" r="3.5" fill="#ffffff" />
              <circle cx="270" cy="50" r="3.5" fill="#ffffff" />
              <circle cx="310" cy="30" r="5" fill="#ffffff" stroke="#000000" strokeWidth="2" />
            </svg>
            {/* Float badge 89% */}
            <div className="absolute top-2 right-2 rtl:left-2 rtl:right-auto bg-white text-black px-2 py-0.5 rounded text-[11px] font-black font-mono shadow">
              89%
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-neutral-500 font-mono pt-2 border-t border-neutral-800">
            <span>1</span>
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20</span>
            <span>25</span>
            <span>30</span>
          </div>
        </div>

        {/* Revenue & Payments Bar Chart */}
        <div className="lg:col-span-3 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-white">{lang === 'ar' ? 'الإيرادات والتحصيل' : 'Revenue & Payments'}</h3>
            <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded font-mono">
              {lang === 'ar' ? 'هذا الشهر' : 'This Month'}
            </span>
          </div>

          {/* Bar Chart representation */}
          <div className="h-44 flex items-end justify-between gap-1.5 pt-4">
            {[
              { label: '1', v1: 75, v2: 60 },
              { label: '5', v1: 55, v2: 45 },
              { label: '10', v1: 45, v2: 40 },
              { label: '15', v1: 65, v2: 55 },
              { label: '20', v1: 80, v2: 70 },
              { label: '25', v1: 90, v2: 85 },
              { label: '30', v1: 70, v2: 50 }
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  <div
                    style={{ height: `${bar.v1}%` }}
                    className="w-2.5 bg-white rounded-t-sm"
                    title={`المستحق: ${bar.v1 * 100}`}
                  />
                  <div
                    style={{ height: `${bar.v2}%` }}
                    className="w-2.5 bg-neutral-600 rounded-t-sm"
                    title={`المحصل: ${bar.v2 * 100}`}
                  />
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">{bar.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-white rounded-sm" />
              <span>{lang === 'ar' ? 'المستحق' : 'Revenue'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-neutral-600 rounded-sm" />
              <span>{lang === 'ar' ? 'المحصل' : 'Collected'}</span>
            </div>
          </div>
        </div>

        {/* Group Distribution Donut Chart */}
        <div className="lg:col-span-2 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <h3 className="font-bold text-sm text-white mb-2">{lang === 'ar' ? 'توزيع المجموعات' : 'Group Distribution'}</h3>
          <div className="flex flex-col items-center justify-center my-auto">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#262626" strokeWidth="4" />
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ffffff" strokeWidth="4.5" strokeDasharray="30 70" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#a3a3a3" strokeWidth="4.5" strokeDasharray="25 75" strokeDashoffset="-30" />
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#525252" strokeWidth="4.5" strokeDasharray="20 80" strokeDashoffset="-55" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-black text-white font-mono">{totalMembersCount}</span>
                <span className="text-[9px] text-neutral-400">{lang === 'ar' ? 'إجمالي' : 'Total'}</span>
              </div>
            </div>
          </div>
          {/* Breakdown legend */}
          <div className="text-[11px] space-y-1 text-neutral-300 font-medium">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span>أولى ثانوي</span>
              </span>
              <span className="font-mono text-neutral-400">42</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-400" />
                <span>ثانية ثانوي</span>
              </span>
              <span className="font-mono text-neutral-400">36</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-600" />
                <span>ثالثة ثانوي</span>
              </span>
              <span className="font-mono text-neutral-400">28</span>
            </div>
          </div>
        </div>

        {/* Quick Actions (8 Grid Buttons matching screenshot) */}
        <div className="lg:col-span-3 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <h3 className="font-bold text-sm text-white mb-3">{lang === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('attendance')}
              className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-cyan-500/40 hover:bg-neutral-850 hover:-translate-y-0.5 active:scale-95 text-neutral-200 hover:text-white flex flex-col items-center justify-center text-center transition-all duration-200 group shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">{lang === 'ar' ? 'تسجيل الحضور' : 'Attendance'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('qr-scanner')}
              className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-pink-500/40 hover:bg-neutral-850 hover:-translate-y-0.5 active:scale-95 text-neutral-200 hover:text-white flex flex-col items-center justify-center text-center transition-all duration-200 group shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">{lang === 'ar' ? 'مسح كارت QR' : 'Scan QR'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddMember}
              className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 hover:bg-neutral-850 hover:-translate-y-0.5 active:scale-95 text-neutral-200 hover:text-white flex flex-col items-center justify-center text-center transition-all duration-200 group shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <PlusCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">{lang === 'ar' ? 'إضافة عضو' : 'Add Member'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenNewSession}
              className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 hover:bg-neutral-850 hover:-translate-y-0.5 active:scale-95 text-neutral-200 hover:text-white flex flex-col items-center justify-center text-center transition-all duration-200 group shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">{lang === 'ar' ? 'حصة جديدة' : 'New Session'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddPayment}
              className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-teal-500/40 hover:bg-neutral-850 hover:-translate-y-0.5 active:scale-95 text-neutral-200 hover:text-white flex flex-col items-center justify-center text-center transition-all duration-200 group shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">{lang === 'ar' ? 'تسجيل دفعة' : 'Add Payment'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenNewGroup}
              className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/40 hover:bg-neutral-850 hover:-translate-y-0.5 active:scale-95 text-neutral-200 hover:text-white flex flex-col items-center justify-center text-center transition-all duration-200 group shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">{lang === 'ar' ? 'مجموعة جديدة' : 'New Group'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-indigo-500/40 hover:bg-neutral-850 hover:-translate-y-0.5 active:scale-95 text-neutral-200 hover:text-white flex flex-col items-center justify-center text-center transition-all duration-200 group shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">{lang === 'ar' ? 'عرض التقارير' : 'Reports'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('backup')}
              className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-sky-500/40 hover:bg-neutral-850 hover:-translate-y-0.5 active:scale-95 text-neutral-200 hover:text-white flex flex-col items-center justify-center text-center transition-all duration-200 group shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Database className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">{lang === 'ar' ? 'نسخ احتياطي' : 'Backup'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. INTERMEDIATE ROW: Top Active Groups, QR Check-in Box, Recent Payments, Recent Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Most Active Groups */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
            <h3 className="font-bold text-sm text-white">{lang === 'ar' ? 'أعلى المجموعات نشاطاً' : 'Top Active Groups'}</h3>
            <button
              type="button"
              onClick={() => onNavigate('groups')}
              className="text-[11px] text-neutral-400 hover:text-white"
            >
              {lang === 'ar' ? 'عرض الكل' : 'View All'}
            </button>
          </div>
          <div className="space-y-2">
            {[
              { name: 'الصف الأول الثانوي', count: 42, rate: '95%' },
              { name: 'الصف الثاني الثانوي', count: 36, rate: '88%' },
              { name: 'الصف الثالث الثانوي', count: 28, rate: '85%' },
              { name: 'كورس الإنجليزي (Level 3)', count: 24, rate: '82%' },
              { name: 'أكاديمية الناشئين لكرة القدم', count: 22, rate: '78%' }
            ].map((g, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-black/60 border border-neutral-800 hover:border-neutral-700 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="font-semibold text-white">{g.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-400 font-mono text-[11px]">{g.count} مشترك</span>
                  <span className="text-emerald-400 font-mono font-bold">{g.rate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick QR Attendance Scan Card (Matches Screenshot!) */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between text-center">
          <h3 className="font-bold text-sm text-white mb-1">{lang === 'ar' ? 'تحضير سريع عبر الـ QR' : 'QR Attendance Check-in'}</h3>
          <p className="text-xs text-neutral-400 mb-3">{lang === 'ar' ? 'مرر بطاقة المشترك أمام الكاميرا' : 'Scan member unique QR card'}</p>
          <div className="my-auto p-4 bg-black border border-neutral-800 rounded-2xl inline-flex flex-col items-center justify-center">
            <div className="w-28 h-28 border-2 border-dashed border-neutral-600 rounded-xl flex items-center justify-center relative">
              <QrCode className="w-16 h-16 text-white" />
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('qr-scanner')}
            className="w-full mt-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <QrCode className="w-4 h-4" />
            <span>{lang === 'ar' ? 'بدء المسح بالكاميرا' : 'Start Camera Scan'}</span>
          </button>
        </div>

        {/* Recent Payments (Matching Screenshot) */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
            <h3 className="font-bold text-sm text-white">{lang === 'ar' ? 'آخر المدفوعات المسجلة' : 'Recent Payments'}</h3>
            <button
              type="button"
              onClick={() => onNavigate('payments')}
              className="text-[11px] text-neutral-400 hover:text-white"
            >
              {lang === 'ar' ? 'عرض الكل' : 'View All'}
            </button>
          </div>
          <div className="space-y-2">
            {payments.slice(0, 5).map((pay) => (
              <div
                key={pay.id}
                className="flex items-center justify-between p-2 rounded-xl bg-black/60 border border-neutral-800 hover:border-neutral-700 text-xs"
              >
                <div>
                  <div className="font-semibold text-white">{pay.memberName}</div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    {pay.date} • {pay.method === 'cash' ? 'نقدي' : pay.method === 'transfer' ? 'تحويل' : 'بطاقة'}
                  </div>
                </div>
                <div className="text-end">
                  <span className="font-mono font-bold text-white block">
                    {pay.amount.toLocaleString()} {organization?.currency || 'ج.م'}
                  </span>
                  <span className="text-[10px] text-emerald-400">تم السداد</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Members Registered */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
            <h3 className="font-bold text-sm text-white">{lang === 'ar' ? 'أحدث الأعضاء تسجيلاً' : 'Recent Members'}</h3>
            <button
              type="button"
              onClick={() => onNavigate('members')}
              className="text-[11px] text-neutral-400 hover:text-white"
            >
              {lang === 'ar' ? 'عرض الكل' : 'View All'}
            </button>
          </div>
          <div className="space-y-2">
            {members.slice(0, 5).map((mem) => (
              <div
                key={mem.id}
                onClick={() => onSelectMember(mem)}
                className="flex items-center justify-between p-2 rounded-xl bg-black/60 border border-neutral-800 hover:border-neutral-700 text-xs cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={mem.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(mem.fullName)}&background=222&color=fff`}
                    alt={mem.fullName}
                    className="w-7 h-7 rounded-full object-cover border border-neutral-700"
                  />
                  <div>
                    <div className="font-semibold text-white">{mem.fullName}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">{mem.memberCode}</div>
                  </div>
                </div>
                <div className="text-end">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    {mem.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : 'غير نشط'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. FOURTH ROW: Alerts & Notifications, Performance Tracking, Recent Sessions, Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Alerts & Notifications */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-white" />
              <span>{lang === 'ar' ? 'التنبيهات والمستحقات' : 'Alerts & Notifications'}</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('notifications')}
              className="text-[11px] text-neutral-400 hover:text-white"
            >
              {lang === 'ar' ? 'عرض الكل' : 'View All'}
            </button>
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 5).map((notif) => (
              <div
                key={notif.id}
                className="p-2.5 rounded-xl bg-black/60 border border-neutral-800 text-xs space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{notif.title}</span>
                  <span className="text-[10px] text-neutral-500">{notif.date}</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">{notif.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Tracking (Radial + Category Bars matching screenshot) */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-white" />
              <span>{lang === 'ar' ? 'متابعة مستوى الأداء' : 'Performance Tracking'}</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('performance')}
              className="text-[11px] text-neutral-400 hover:text-white"
            >
              {lang === 'ar' ? 'عرض الكل' : 'View All'}
            </button>
          </div>
          <div className="flex items-center gap-4 py-2">
            <div className="w-16 h-16 rounded-full border-4 border-white flex flex-col items-center justify-center shrink-0">
              <span className="font-black text-lg font-mono text-white">85%</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {lang === 'ar' ? 'متوسط أداء المشتركين' : 'Average Performance'}
              </span>
              <span className="text-[10px] text-neutral-400">
                {lang === 'ar' ? 'مستوى كفاءة ممتاز' : 'High Competency'}
              </span>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-neutral-800 text-xs">
            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>الالتزام والمواظبة</span>
                <span className="font-mono text-white">92%</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-white h-full rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>نتائج الاختبارات والتقييم</span>
                <span className="font-mono text-white">88%</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-white h-full rounded-full" style={{ width: '88%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>التفاعل والمشاركة</span>
                <span className="font-mono text-white">95%</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-white h-full rounded-full" style={{ width: '95%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white" />
              <span>{lang === 'ar' ? 'الحصص والمواعيد القادمة' : 'Recent Sessions'}</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('sessions')}
              className="text-[11px] text-neutral-400 hover:text-white"
            >
              {lang === 'ar' ? 'عرض الكل' : 'View All'}
            </button>
          </div>
          <div className="space-y-2">
            {sessions.slice(0, 4).map((ses) => (
              <div
                key={ses.id}
                className="p-2.5 rounded-xl bg-black/60 border border-neutral-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{ses.subject || ses.title}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">{ses.startTime}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>{ses.groupName || 'الصف الأول'}</span>
                  <span className="font-mono">{ses.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Timeline & Quick Reports */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
            <h3 className="font-bold text-sm text-white">{lang === 'ar' ? 'آخر العمليات' : 'Recent Activity'}</h3>
            <button
              type="button"
              onClick={() => onNavigate('activity-log')}
              className="text-[11px] text-neutral-400 hover:text-white"
            >
              {lang === 'ar' ? 'عرض الكل' : 'View All'}
            </button>
          </div>
          <div className="space-y-2.5">
            {logs.slice(0, 4).map((l) => (
              <div key={l.id} className="flex items-start gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-white font-medium text-[11px] leading-tight">{l.description}</p>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    {new Date(l.timestamp).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Quick Reports Shortcuts */}
          <div className="pt-3 border-t border-neutral-800 mt-2">
            <span className="text-[10px] font-bold text-neutral-400 block mb-1.5">
              {lang === 'ar' ? 'تقارير سريعة' : 'Quick Reports'}
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="p-1.5 rounded bg-black/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-start truncate"
              >
                {lang === 'ar' ? 'سجل الحضور اليومي' : 'Daily Attendance'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="p-1.5 rounded bg-black/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-start truncate"
              >
                {lang === 'ar' ? 'تقرير الإيرادات' : 'Payments Report'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
