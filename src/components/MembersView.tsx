import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  MoreVertical,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  QrCode,
  CreditCard,
  CheckCircle2,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Group, Member, OrganizationConfig } from '../types';
import { dbService } from '../lib/db';
import { getSubscriptionStatus } from '../lib/subscriptions';

interface MembersViewProps {
  members: Member[];
  groups: Group[];
  organization: OrganizationConfig | null;
  lang: 'ar' | 'en';
  onRefresh: () => void;
  onSelectMember: (m: Member) => void;
  onRecordAttendance: (m: Member) => void;
  onAddPayment: (m: Member) => void;
  onOpenAddMember: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  groups,
  organization,
  lang,
  onRefresh,
  onSelectMember,
  onRecordAttendance,
  onAddPayment,
  onOpenAddMember
}) => {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filtered members list
  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (selectedGroup !== 'all' && m.currentGroupId !== selectedGroup) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = m.fullName.toLowerCase().includes(q);
        const matchesCode = m.memberCode.toLowerCase().includes(q);
        const matchesPhone = m.phone.includes(q);
        if (!matchesName && !matchesCode && !matchesPhone) return false;
      }
      return true;
    });
  }, [members, search, selectedGroup, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageMembers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Archive Member
  const handleArchive = async (m: Member, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(lang === 'ar' ? `هل أنت متأكد من أرشفة ${m.fullName}؟` : `Archive member ${m.fullName}?`)) {
      await dbService.archiveMember(m.id);
      onRefresh();
    }
  };

  // Restore Member
  const handleRestore = async (m: Member, e: React.MouseEvent) => {
    e.stopPropagation();
    await dbService.restoreMember(m.id);
    onRefresh();
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ['ID', 'Code', 'Full Name', 'Phone', 'Group', 'Status', 'Registration Date', 'Balance'];
    const rows = filtered.map((m) => {
      const g = groups.find((grp) => grp.id === m.currentGroupId);
      return [
        m.id,
        m.memberCode,
        `"${m.fullName}"`,
        m.phone,
        `"${g?.name || ''}"`,
        m.status,
        m.registrationDate,
        m.balance || 0
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `members_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">
            {lang === 'ar' ? 'إدارة المشتركين' : 'Member Management'}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {lang === 'ar'
              ? `إجمالي المسجلين: ${members.length} • المعروض: ${filtered.length} مشترك`
              : `Total: ${members.length} members • ${filtered.length} matching filters`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportToCSV}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddMember}
            className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة مشترك جديد' : 'Add Member'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-500 absolute top-3 left-3 rtl:right-3 rtl:left-auto" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={lang === 'ar' ? 'البحث بالاسم، الكود، أو رقم الهاتف...' : 'Search by name, ID or phone...'}
            className="w-full bg-black border border-neutral-800 rounded-xl px-9 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600"
          />
        </div>
        {/* Group Selector */}
        <div className="w-full md:w-48">
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
          >
            <option value="all">{lang === 'ar' ? 'كل المجموعات' : 'All Groups'}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        {/* Status Selector */}
        <div className="w-full md:w-36">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
          >
            <option value="all">{lang === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="active">{lang === 'ar' ? 'النشطين فقط' : 'Active'}</option>
            <option value="inactive">{lang === 'ar' ? 'غير النشطين' : 'Inactive'}</option>
            <option value="archived">{lang === 'ar' ? 'المؤرشفين' : 'Archived'}</option>
          </select>
        </div>
      </div>

      {/* Members List Container */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Mobile View: Clean Touch Cards */}
        <div className="block md:hidden divide-y divide-neutral-800/80">
          {pageMembers.map((m) => {
            const group = groups.find((g) => g.id === m.currentGroupId);
            return (
              <div
                key={m.id}
                onClick={() => onSelectMember(m)}
                className="p-3.5 hover:bg-black/40 active:bg-black/60 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={m.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName)}&background=222&color=fff`}
                    alt={m.fullName}
                    className="w-12 h-12 rounded-xl object-cover border border-neutral-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <h3 className="font-bold text-sm text-white truncate">{m.fullName}</h3>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                          m.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : m.status === 'archived'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {m.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : m.status === 'archived' ? (lang === 'ar' ? 'مؤرشف' : 'Archived') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                        </span>
                        {(() => {
                          const sub = getSubscriptionStatus(m);
                          return (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${sub.badgeClass}`}>
                              {lang === 'ar' ? sub.labelAr : sub.labelEn}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400 flex-wrap">
                      <span className="font-mono text-white font-bold bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 text-[11px]">
                        {m.memberCode}
                      </span>
                      <span>•</span>
                      <span className="text-neutral-300 truncate max-w-[120px]">{group?.name || (lang === 'ar' ? 'بدون مجموعة' : 'None')}</span>
                      <span>•</span>
                      <span className="font-mono text-neutral-400">{m.phone}</span>
                    </div>

                    {m.subscriptionEndDate && (
                      <div className="mt-1 text-[11px] text-neutral-400 font-mono">
                        {lang === 'ar' ? `ينتهي في: ${m.subscriptionEndDate}` : `Expires: ${m.subscriptionEndDate}`}
                      </div>
                    )}

                    {m.balance && m.balance > 0 ? (
                      <div className="mt-1 text-[11px] text-rose-400 font-semibold font-mono">
                        {lang === 'ar' ? `المتبقي: ${m.balance} ج.م` : `Due: ${m.balance} EGP`}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Quick Touch Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-neutral-800/60 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onRecordAttendance(m)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'ar' ? 'حضور' : 'Attendance'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddPayment(m)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                    <span>{lang === 'ar' ? 'سداد' : 'Pay'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectMember(m)}
                    className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-[11px] font-bold flex items-center justify-center gap-1 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'الملف' : 'Profile'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {pageMembers.length === 0 && (
            <div className="p-8 text-center text-neutral-500 text-xs">
              {lang === 'ar' ? 'لا توجد نتائج مطابقة للبحث' : 'No matching members found'}
            </div>
          )}
        </div>

        {/* Desktop View: Full Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-black/60 text-neutral-400 border-b border-neutral-800 font-semibold">
              <tr>
                <th className="p-3.5 text-start">{lang === 'ar' ? 'المشترك' : 'Member'}</th>
                <th className="p-3.5 text-start">{lang === 'ar' ? 'كود المشترك' : 'Member ID'}</th>
                <th className="p-3.5 text-start">{lang === 'ar' ? 'المجموعة' : 'Group'}</th>
                <th className="p-3.5 text-start">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</th>
                <th className="p-3.5 text-start">{lang === 'ar' ? 'تاريخ التسجيل' : 'Registered'}</th>
                <th className="p-3.5 text-start">{lang === 'ar' ? 'المتبقي' : 'Balance'}</th>
                <th className="p-3.5 text-start">{lang === 'ar' ? 'انتهاء الاشتراك' : 'Expiry'}</th>
                <th className="p-3.5 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {pageMembers.map((m) => {
                const group = groups.find((g) => g.id === m.currentGroupId);
                const sub = getSubscriptionStatus(m);
                return (
                  <tr
                    key={m.id}
                    onClick={() => onSelectMember(m)}
                    className="hover:bg-black/40 cursor-pointer transition-colors"
                  >
                    {/* Member photo + name */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName)}&background=222&color=fff`}
                          alt={m.fullName}
                          className="w-9 h-9 rounded-xl object-cover border border-neutral-700 shadow-sm"
                        />
                        <div>
                          <div className="font-bold text-white text-xs">{m.fullName}</div>
                          {m.guardianName && (
                            <div className="text-[10px] text-neutral-400">ولي الأمر: {m.guardianName}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="p-3.5 font-mono font-bold text-neutral-300">
                      {m.memberCode}
                    </td>

                    {/* Group */}
                    <td className="p-3.5 text-neutral-300 font-medium">
                      {group?.name || (lang === 'ar' ? 'بدون مجموعة' : 'None')}
                    </td>

                    {/* Phone */}
                    <td className="p-3.5 font-mono text-neutral-400">
                      {m.phone}
                    </td>

                    {/* Reg Date */}
                    <td className="p-3.5 font-mono text-neutral-400">
                      {m.registrationDate}
                    </td>

                    {/* Balance */}
                    <td className="p-3.5 font-mono">
                      {m.balance && m.balance > 0 ? (
                        <span className="text-rose-400 font-bold">
                          {m.balance} {organization?.currency || 'ج.م'}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">0</span>
                      )}
                    </td>

                    {/* Subscription Expiry & Renewal alert */}
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-mono text-neutral-300 text-[11px] block">
                          {m.subscriptionEndDate || m.registrationDate}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold inline-block ${sub.badgeClass}`}>
                          {lang === 'ar' ? sub.labelAr : sub.labelEn}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.status === 'active'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : m.status === 'inactive'
                          ? 'bg-neutral-800 text-neutral-400'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {m.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : m.status === 'inactive' ? (lang === 'ar' ? 'غير نشط' : 'Inactive') : (lang === 'ar' ? 'مؤرشف' : 'Archived')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onRecordAttendance(m)}
                          title={lang === 'ar' ? 'تسجيل حضور' : 'Attendance'}
                          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onAddPayment(m)}
                          title={lang === 'ar' ? 'تسجيل دفعة' : 'Payment'}
                          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectMember(m)}
                          title={lang === 'ar' ? 'الملف الشخصي' : 'View Profile'}
                          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {m.status === 'archived' ? (
                          <button
                            type="button"
                            onClick={(e) => handleRestore(m, e)}
                            title={lang === 'ar' ? 'استعادة' : 'Restore'}
                            className="p-1.5 rounded-lg hover:bg-neutral-800 text-emerald-400"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleArchive(m, e)}
                            title={lang === 'ar' ? 'أرشفة' : 'Archive'}
                            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-rose-400"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageMembers.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-500 text-xs">
                    {lang === 'ar' ? 'لا توجد نتائج مطابقة للبحث' : 'No matching members found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>
              {lang === 'ar'
                ? `صفحة ${currentPage} من ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1.5 rounded-lg bg-black border border-neutral-800 text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1.5 rounded-lg bg-black border border-neutral-800 text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
