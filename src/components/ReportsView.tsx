import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Users,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  Layers
} from 'lucide-react';
import { AttendanceRecord, Group, Member, OrganizationConfig, Payment, Expense } from '../types';

interface ReportsViewProps {
  members: Member[];
  groups: Group[];
  payments: Payment[];
  expenses: Expense[];
  attendance: AttendanceRecord[];
  organization: OrganizationConfig | null;
  lang: 'ar' | 'en';
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  members,
  groups,
  payments,
  expenses,
  attendance,
  organization,
  lang
}) => {
  const [reportType, setReportType] = useState<'attendance' | 'finance' | 'debts' | 'members'>('attendance');
  const [dateRange, setDateRange] = useState('all');

  const activeMembers = members.filter((m) => m.status === 'active');
  const totalRevenues = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalDebts = members.reduce((acc, m) => acc + (m.balance && m.balance > 0 ? m.balance : 0), 0);
  const debtorMembers = members.filter((m) => m.balance && m.balance > 0);

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;

  return (
    <div className="space-y-5 animate-in fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">{lang === 'ar' ? 'التقارير والإحصائيات الشاملة' : 'Comprehensive Reports'}</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {lang === 'ar' ? 'كشوفات تفصيلية جاهزة للطباعة والتصدير' : 'Printable and exportable administrative statements'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl flex items-center gap-1.5 shadow hover:bg-neutral-200"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ar' ? 'طباعة التقرير الحالي' : 'Print Report'}</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'attendance', label: 'تقرير الحضور ونسب الالتزام', icon: CheckCircle2 },
          { id: 'finance', label: 'التقرير المالي وحركة الخزينة', icon: TrendingUp },
          { id: 'debts', label: 'كشف المديونيات والمستحقات', icon: Clock },
          { id: 'members', label: 'بيان المشتركين والمجموعات', icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportType(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition ${
                reportType === tab.id
                  ? 'bg-white text-black'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Printable Sheet View */}
      <div id="printable-report" className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Report Official Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800 pb-4 gap-3">
          <div>
            <h2 className="text-xl font-black text-white">{organization?.name || 'RCN MANAGER'}</h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              {organization?.subName || 'نظام إدارة المنشآت والأنشطة'} • تاريخ الاستخراج: {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
            </p>
          </div>
          <div className="text-xs text-neutral-400 sm:text-end font-mono">
            <div>المسؤول: المدير العام</div>
            <div>هاتف الطوارئ / الدعم: {organization?.phone || '01060474659'}</div>
          </div>
        </div>

        {/* CONTENT 1: ATTENDANCE REPORT */}
        {reportType === 'attendance' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white">كشف الحضور العام ونسب التواجد</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-black border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-400 block">إجمالي التسجيلات</span>
                <span className="font-mono font-bold text-white text-base mt-1 block">{attendance.length}</span>
              </div>
              <div className="p-3 bg-black border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-400 block">إجمالي الحضور</span>
                <span className="font-mono font-bold text-emerald-400 text-base mt-1 block">{presentCount}</span>
              </div>
              <div className="p-3 bg-black border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-400 block">إجمالي الغياب</span>
                <span className="font-mono font-bold text-rose-400 text-base mt-1 block">{absentCount}</span>
              </div>
              <div className="p-3 bg-black border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-400 block">نسبة الالتزام العامة</span>
                <span className="font-mono font-bold text-white text-base mt-1 block">
                  {attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0}%
                </span>
              </div>
            </div>

            <table className="w-full text-xs text-start border border-neutral-800 rounded-xl overflow-hidden">
              <thead className="bg-black text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="p-2.5 text-start">التاريخ</th>
                  <th className="p-2.5 text-start">المشترك</th>
                  <th className="p-2.5 text-start">المجموعة</th>
                  <th className="p-2.5 text-start">الحالة</th>
                  <th className="p-2.5 text-start">المسجل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {attendance.slice(0, 30).map((a) => (
                  <tr key={a.id}>
                    <td className="p-2.5 font-mono text-neutral-300">{a.date} ({a.time})</td>
                    <td className="p-2.5 font-bold text-white">{a.memberName}</td>
                    <td className="p-2.5 text-neutral-400">{a.groupName || '-'}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.status === 'present' ? 'text-emerald-400 bg-emerald-950' : 'text-rose-400 bg-rose-950'
                      }`}>
                        {a.status === 'present' ? 'حاضر' : a.status === 'absent' ? 'غائب' : a.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-neutral-400">{a.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CONTENT 2: FINANCIAL REPORT */}
        {reportType === 'finance' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white">التقرير المالي الشامل وصافي الأرباح</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-black border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-400 block">إجمالي المقبوضات (الإيرادات)</span>
                <span className="font-mono font-bold text-emerald-400 text-lg mt-1 block">
                  +{totalRevenues.toLocaleString()} {organization?.currency || 'ج.م'}
                </span>
              </div>
              <div className="p-4 bg-black border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-400 block">إجمالي المدفوعات (المصروفات)</span>
                <span className="font-mono font-bold text-rose-400 text-lg mt-1 block">
                  -{totalExpenses.toLocaleString()} {organization?.currency || 'ج.م'}
                </span>
              </div>
              <div className="p-4 bg-black border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-400 block">صافي رصيد الخزينة</span>
                <span className="font-mono font-bold text-white text-lg mt-1 block">
                  {(totalRevenues - totalExpenses).toLocaleString()} {organization?.currency || 'ج.م'}
                </span>
              </div>
            </div>

            <div className="border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-start">
                <thead className="bg-black text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="p-2.5 text-start">رقم الإيصال</th>
                    <th className="p-2.5 text-start">المشترك</th>
                    <th className="p-2.5 text-start">التاريخ</th>
                    <th className="p-2.5 text-start">المبلغ</th>
                    <th className="p-2.5 text-start">طريقة الدفع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {payments.slice(0, 20).map((p) => (
                    <tr key={p.id}>
                      <td className="p-2.5 font-mono text-neutral-300">{p.receiptNumber}</td>
                      <td className="p-2.5 font-bold text-white">{p.memberName}</td>
                      <td className="p-2.5 font-mono text-neutral-400">{p.date}</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-400">
                        {p.amount.toLocaleString()} {organization?.currency || 'ج.م'}
                      </td>
                      <td className="p-2.5 text-neutral-400">{p.method === 'cash' ? 'كاش' : 'تحويل'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTENT 3: DEBTS REPORT */}
        {reportType === 'debts' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white">كشف المديونيات والمستحقات المتبقية</h3>
            <div className="p-4 bg-black border border-neutral-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 block">إجمالي المستحقات غير المحصلة</span>
                <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
                  {totalDebts.toLocaleString()} {organization?.currency || 'ج.م'}
                </span>
              </div>
              <div className="font-bold text-xs text-neutral-300">
                {debtorMembers.length} مشتركين عليهم مبالغ مؤجلة
              </div>
            </div>

            <table className="w-full text-xs text-start border border-neutral-800 rounded-xl overflow-hidden">
              <thead className="bg-black text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="p-2.5 text-start">المشترك</th>
                  <th className="p-2.5 text-start">كود المشترك</th>
                  <th className="p-2.5 text-start">الهاتف</th>
                  <th className="p-2.5 text-start">إجمالي الرسوم</th>
                  <th className="p-2.5 text-start">المسدد</th>
                  <th className="p-2.5 text-start">المتبقي (مدين به)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {debtorMembers.map((m) => (
                  <tr key={m.id}>
                    <td className="p-2.5 font-bold text-white">{m.fullName}</td>
                    <td className="p-2.5 font-mono text-neutral-300">{m.memberCode}</td>
                    <td className="p-2.5 font-mono text-neutral-400">{m.phone}</td>
                    <td className="p-2.5 font-mono text-neutral-400">{m.totalDue}</td>
                    <td className="p-2.5 font-mono text-emerald-400">{m.totalPaid}</td>
                    <td className="p-2.5 font-mono font-bold text-rose-400">{m.balance} {organization?.currency || 'ج.م'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CONTENT 4: MEMBERS OVERVIEW */}
        {reportType === 'members' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white">إجمالي المشتركين وتوزيع المجموعات</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-black border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-400 block">إجمالي الأعضاء</span>
                <span className="font-mono font-bold text-white text-base mt-1 block">{members.length}</span>
              </div>
              <div className="p-3 bg-black border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-400 block">النشطين</span>
                <span className="font-mono font-bold text-emerald-400 text-base mt-1 block">{activeMembers.length}</span>
              </div>
              <div className="p-3 bg-black border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-400 block">المجموعات والفرق</span>
                <span className="font-mono font-bold text-white text-base mt-1 block">{groups.length}</span>
              </div>
              <div className="p-3 bg-black border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-400 block">الأعضاء المؤرشفين</span>
                <span className="font-mono font-bold text-neutral-400 text-base mt-1 block">
                  {members.filter((m) => m.status === 'archived').length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
