import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Search,
  DollarSign,
  CreditCard,
  Printer,
  Download,
  Send,
  User,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Phone
} from 'lucide-react';
import { Group, Member, OrganizationConfig } from '../types';

interface DebtsViewProps {
  members: Member[];
  groups: Group[];
  organization: OrganizationConfig | null;
  lang: 'ar' | 'en';
  onSelectMember: (member: Member) => void;
  onAddPayment: (member: Member) => void;
  onRefresh: () => void;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  members,
  groups,
  organization,
  lang,
  onSelectMember,
  onAddPayment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [sortBy, setSortBy] = useState<'highest' | 'lowest' | 'name'>('highest');

  // Filter members who have outstanding balance > 0
  const debtors = useMemo(() => {
    return members.filter((m) => {
      const balance = m.balance ?? Math.max(0, (m.totalDue || 0) - (m.totalPaid || 0));
      return balance > 0;
    });
  }, [members]);

  // Apply search, group filter, and sorting
  const filteredDebtors = useMemo(() => {
    return debtors
      .filter((m) => {
        const matchesSearch =
          m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.memberCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.phone.includes(searchTerm);
        const matchesGroup = selectedGroupId === 'all' || m.currentGroupId === selectedGroupId;
        return matchesSearch && matchesGroup;
      })
      .sort((a, b) => {
        const balA = a.balance ?? Math.max(0, (a.totalDue || 0) - (a.totalPaid || 0));
        const balB = b.balance ?? Math.max(0, (b.totalDue || 0) - (b.totalPaid || 0));
        if (sortBy === 'highest') return balB - balA;
        if (sortBy === 'lowest') return balA - balB;
        return a.fullName.localeCompare(b.fullName, 'ar');
      });
  }, [debtors, searchTerm, selectedGroupId, sortBy]);

  // Summary Metrics
  const totalOutstanding = debtors.reduce((sum, m) => {
    const b = m.balance ?? Math.max(0, (m.totalDue || 0) - (m.totalPaid || 0));
    return sum + b;
  }, 0);

  const totalDueAll = debtors.reduce((sum, m) => sum + (m.totalDue || 0), 0);
  const totalPaidAll = debtors.reduce((sum, m) => sum + (m.totalPaid || 0), 0);

  // WhatsApp reminder generator
  const getWhatsAppReminderUrl = (member: Member, balance: number) => {
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) return null;
    const phoneWithCountry = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
    const orgName = organization?.name || 'النادي';
    const message =
      lang === 'ar'
        ? `السلام عليكم كابتن ${member.fullName}،\nنود تذكيركم بلطف بأن هناك مبلغ مستحق قدره ${balance.toLocaleString()} ${organization?.currency || 'ج.م'} مقابل اشتراككم لدى (${orgName}).\nبرجاء التكرم بالسداد في أقرب وقت. خالص الشكر والتقدير لتعاونكم.`
        : `Dear ${member.fullName},\nKindly be reminded that you have an outstanding balance of ${balance.toLocaleString()} ${organization?.currency || 'EGP'} at ${orgName}.\nPlease arrange payment at your earliest convenience. Thank you.`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
  };

  // CSV export
  const handleExportCSV = () => {
    const headers = ['Member Code', 'Full Name', 'Phone', 'Group', 'Total Due', 'Total Paid', 'Remaining Balance', 'End Date'];
    const rows = filteredDebtors.map((m) => {
      const g = groups.find((grp) => grp.id === m.currentGroupId);
      const bal = m.balance ?? Math.max(0, (m.totalDue || 0) - (m.totalPaid || 0));
      return [
        `"${m.memberCode}"`,
        `"${m.fullName}"`,
        `"${m.phone}"`,
        `"${g?.name || ''}"`,
        m.totalDue || 0,
        m.totalPaid || 0,
        bal,
        `"${m.subscriptionEndDate || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Unpaid_Members_Debts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Banner & KPI Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {lang === 'ar' ? 'كشف المشتركين المتبقي عليهم مبالغ (المديونيات)' : 'Unpaid Members & Outstanding Balances'}
              </h1>
              <p className="text-xs text-neutral-400">
                {lang === 'ar'
                  ? 'متابعة المشتركين الذين لم يسددوا كامل الرسوم مع إمكانية التحصيل الفوري وإرسال تذكيرات'
                  : 'Track members with pending balances, collect instant payments and send reminders'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-neutral-800 transition"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ar' ? 'طباعة الكشف' : 'Print Statement'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-neutral-800 transition"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'ar' ? 'تصدير Excel / CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-neutral-950 border border-rose-900/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {lang === 'ar' ? 'إجمالي المبالغ المستحقة غير المسددة' : 'Total Outstanding Debt'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-950 text-rose-400 flex items-center justify-center font-bold text-xs">
              !
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400 mt-2">
            {totalOutstanding.toLocaleString()} {organization?.currency || 'ج.م'}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            {lang === 'ar' ? `موزعة على ${debtors.length} مشتركين مدينين` : `Across ${debtors.length} debtor members`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-lg">
          <span className="text-xs text-neutral-400 font-medium block">
            {lang === 'ar' ? 'إجمالي الرسوم الأصلية للمشتركين' : 'Total Due Fees'}
          </span>
          <div className="text-2xl font-black font-mono text-white mt-2">
            {totalDueAll.toLocaleString()} {organization?.currency || 'ج.م'}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            {lang === 'ar' ? 'قيمة الاشتراكات المتفق عليها' : 'Contracted subscription totals'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-lg">
          <span className="text-xs text-neutral-400 font-medium block">
            {lang === 'ar' ? 'المدفوع جزئياً منهم' : 'Partially Collected'}
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
            {totalPaidAll.toLocaleString()} {organization?.currency || 'ج.م'}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            {lang === 'ar' ? 'تم تحصيله بالفعل ودخل الخزينة' : 'Already received in treasury'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالاسم، الكود، أو الهاتف...' : 'Search by name, code, phone...'}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl ps-9 pe-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Group Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">{lang === 'ar' ? 'جميع المجموعات' : 'All Groups'}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="highest">{lang === 'ar' ? 'الأعلى مديونية أولاً' : 'Highest Debt First'}</option>
              <option value="lowest">{lang === 'ar' ? 'الأقل مديونية أولاً' : 'Lowest Debt First'}</option>
              <option value="name">{lang === 'ar' ? 'أبجدياً بالاسم' : 'Alphabetical'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Debtors List Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-neutral-900/80 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="p-3.5 text-start font-semibold">{lang === 'ar' ? 'المشترك' : 'Member'}</th>
                <th className="p-3.5 text-start font-semibold">{lang === 'ar' ? 'المجموعة' : 'Group'}</th>
                <th className="p-3.5 text-start font-semibold">{lang === 'ar' ? 'الهاتف' : 'Phone'}</th>
                <th className="p-3.5 text-start font-semibold">{lang === 'ar' ? 'إجمالي الرسوم' : 'Total Due'}</th>
                <th className="p-3.5 text-start font-semibold">{lang === 'ar' ? 'المدفوع' : 'Paid'}</th>
                <th className="p-3.5 text-start font-semibold">{lang === 'ar' ? 'المتبقي (المطلوب)' : 'Remaining Balance'}</th>
                <th className="p-3.5 text-start font-semibold">{lang === 'ar' ? 'انتهاء الاشتراك' : 'Expiry'}</th>
                <th className="p-3.5 text-center font-semibold">{lang === 'ar' ? 'إجراءات التحصيل' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredDebtors.map((m) => {
                const group = groups.find((g) => g.id === m.currentGroupId);
                const balance = m.balance ?? Math.max(0, (m.totalDue || 0) - (m.totalPaid || 0));
                const waUrl = getWhatsAppReminderUrl(m, balance);

                return (
                  <tr key={m.id} className="hover:bg-neutral-900/40 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName)}&background=222&color=fff`}
                          alt={m.fullName}
                          className="w-9 h-9 rounded-xl object-cover border border-neutral-700 shrink-0"
                        />
                        <div>
                          <button
                            type="button"
                            onClick={() => onSelectMember(m)}
                            className="font-bold text-white hover:underline text-start block"
                          >
                            {m.fullName}
                          </button>
                          <span className="font-mono text-[11px] text-neutral-400">{m.memberCode}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                        {group?.name || (lang === 'ar' ? 'بدون مجموعة' : 'None')}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{m.phone}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-neutral-300 font-semibold">
                      {(m.totalDue || 0).toLocaleString()} {organization?.currency || 'ج.م'}
                    </td>

                    <td className="p-3.5 font-mono text-emerald-400 font-semibold">
                      {(m.totalPaid || 0).toLocaleString()} {organization?.currency || 'ج.م'}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 font-mono font-bold text-xs inline-block">
                        {balance.toLocaleString()} {organization?.currency || 'ج.م'}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-neutral-400 text-[11px]">
                      {m.subscriptionEndDate || m.registrationDate}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Instant Payment Collection */}
                        <button
                          type="button"
                          onClick={() => onAddPayment(m)}
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center gap-1 shadow"
                          title={lang === 'ar' ? 'سداد دفعة للمشترك' : 'Collect Payment'}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{lang === 'ar' ? 'تحصيل' : 'Collect'}</span>
                        </button>

                        {/* WhatsApp Reminder */}
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition"
                            title={lang === 'ar' ? 'إرسال تذكير بالواتساب' : 'WhatsApp Reminder'}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Open Profile */}
                        <button
                          type="button"
                          onClick={() => onSelectMember(m)}
                          className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800"
                          title={lang === 'ar' ? 'عرض الملف' : 'View Profile'}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDebtors.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-neutral-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                    <div className="text-sm font-bold text-white">
                      {debtors.length === 0
                        ? (lang === 'ar' ? 'ممتاز! لا يوجد أي مشترك عليه متأخرات أو مديونيات حالياً.' : 'Excellent! No members with outstanding balances.')
                        : (lang === 'ar' ? 'لا توجد نتائج تطابق بحثك.' : 'No results match your filter.')}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
