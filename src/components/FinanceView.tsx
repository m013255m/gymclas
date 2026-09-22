import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  Plus,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Expense, Member, OrganizationConfig, Payment } from '../types';
import { dbService } from '../lib/db';

interface FinanceViewProps {
  payments: Payment[];
  expenses: Expense[];
  members: Member[];
  organization: OrganizationConfig | null;
  lang: 'ar' | 'en';
  onRefresh: () => void;
  onOpenReceipt: (payment: Payment) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  payments,
  expenses,
  members,
  organization,
  lang,
  onRefresh,
  onOpenReceipt
}) => {
  const [activeTab, setActiveTab] = useState<'revenues' | 'expenses' | 'debts'>('revenues');
  const [search, setSearch] = useState('');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // New Payment Form State
  const [payMemberId, setPayMemberId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [payNotes, setPayNotes] = useState('سداد قسط اشتراك');

  // New Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('أدوات ومهمات');
  const [expNotes, setExpNotes] = useState('');

  // Computations
  const totalRevenues = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenues - totalExpenses;
  const totalDebts = members.reduce((acc, m) => acc + (m.balance && m.balance > 0 ? m.balance : 0), 0);

  // Filtered lists
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (p.memberName || '').toLowerCase().includes(q) ||
        (p.memberCode || '').toLowerCase().includes(q) ||
        (p.receiptNumber || '').toLowerCase().includes(q)
      );
    });
  }, [payments, search]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    });
  }, [expenses, search]);

  const debtorMembers = useMemo(() => {
    return members.filter((m) => m.balance && m.balance > 0 && m.status !== 'archived');
  }, [members]);

  // Handle Submit Payment
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payMemberId || !payAmount) return;
    const member = members.find((m) => m.id === payMemberId);
    if (!member) return;

    const amountNum = parseFloat(payAmount) || 0;
    const currentBal = member.balance || 0;
    const remaining = Math.max(0, currentBal - amountNum);

    const newPayment: Payment = {
      id: 'pay_' + Date.now(),
      receiptNumber: `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      memberId: member.id,
      memberName: member.fullName,
      memberCode: member.memberCode,
      amount: amountNum,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      method: payMethod,
      notes: payNotes,
      recordedBy: 'المدير العام',
      previousBalance: currentBal,
      remainingBalance: remaining,
      createdAt: new Date().toISOString()
    };

    await dbService.addPayment(newPayment);

    // Update member balance
    await dbService.saveMember({
      ...member,
      totalPaid: (member.totalPaid || 0) + amountNum,
      balance: remaining
    });

    setShowAddPaymentModal(false);
    setPayAmount('');
    onRefresh();
    onOpenReceipt(newPayment);
  };

  // Handle Submit Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;

    const newExp: Expense = {
      id: 'exp_' + Date.now(),
      title: expTitle.trim(),
      amount: parseFloat(expAmount) || 0,
      category: expCategory,
      date: new Date().toISOString().split('T')[0],
      recordedBy: 'المدير العام',
      notes: expNotes.trim(),
      createdAt: new Date().toISOString()
    };

    await dbService.addExpense(newExp);
    setShowAddExpenseModal(false);
    setExpTitle('');
    setExpAmount('');
    setExpNotes('');
    onRefresh();
  };

  return (
    <div className="space-y-5 animate-in fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">{lang === 'ar' ? 'الإدارة المالية والخزينة' : 'Financial Management'}</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {lang === 'ar' ? 'تسجيل الإيرادات، المصروفات، متابعة المديونيات وإصدار إيصالات القبض' : 'Track revenue, expenses, balances & print receipts'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddExpenseModal(true)}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 flex items-center gap-1.5"
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>{lang === 'ar' ? 'تسجيل مصروف' : 'Add Expense'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddPaymentModal(true)}
            className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'سداد قسط / إيصال' : 'New Payment'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>{lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {totalRevenues.toLocaleString()} {organization?.currency || 'ج.م'}
          </div>
          <span className="text-[10px] text-neutral-500 font-semibold">{payments.length} عملية تحصيل</span>
        </div>

        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>{lang === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {totalExpenses.toLocaleString()} {organization?.currency || 'ج.م'}
          </div>
          <span className="text-[10px] text-neutral-500 font-semibold">{expenses.length} بند مصروف</span>
        </div>

        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>{lang === 'ar' ? 'صافي الخزينة' : 'Net Cashflow'}</span>
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className={`text-xl font-bold font-mono ${netProfit >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {netProfit.toLocaleString()} {organization?.currency || 'ج.م'}
          </div>
          <span className="text-[10px] text-neutral-500 font-semibold">الرصيد الفعلي الحالي</span>
        </div>

        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>{lang === 'ar' ? 'المستحقات المتأخرة' : 'Outstanding Debts'}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400">
            {totalDebts.toLocaleString()} {organization?.currency || 'ج.م'}
          </div>
          <span className="text-[10px] text-neutral-500 font-semibold">{debtorMembers.length} مشترك مدين</span>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'revenues', labelAr: `سجل الإيرادات (${payments.length})`, labelEn: 'Revenues' },
            { id: 'expenses', labelAr: `سجل المصروفات (${expenses.length})`, labelEn: 'Expenses' },
            { id: 'debts', labelAr: `المشتركين المدينين (${debtorMembers.length})`, labelEn: 'Debts' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-white text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {lang === 'ar' ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 pb-1">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute top-2 left-2 rtl:right-2 rtl:left-auto" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-7 py-1 text-xs text-white"
          />
        </div>
      </div>

      {/* TAB 1: REVENUES */}
      {activeTab === 'revenues' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-xs text-start">
            <thead className="bg-black/60 text-neutral-400 border-b border-neutral-800 font-semibold">
              <tr>
                <th className="p-3 text-start">رقم الإيصال</th>
                <th className="p-3 text-start">اسم المشترك</th>
                <th className="p-3 text-start">المبلغ المسدد</th>
                <th className="p-3 text-start">التاريخ والوقت</th>
                <th className="p-3 text-start">طريقة الدفع</th>
                <th className="p-3 text-start">المسؤول</th>
                <th className="p-3 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-black/40">
                  <td className="p-3 font-mono font-bold text-white">{p.receiptNumber}</td>
                  <td className="p-3">
                    <span className="font-bold text-white block">{p.memberName}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">{p.memberCode}</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-400">
                    +{p.amount.toLocaleString()} {organization?.currency || 'ج.م'}
                  </td>
                  <td className="p-3 font-mono text-neutral-400">{p.date} ({p.time})</td>
                  <td className="p-3 text-neutral-300">
                    {p.method === 'cash' ? 'نقدي (كاش)' : p.method === 'transfer' ? 'تحويل بنكي/فودافون كاش' : 'بطاقة بنكية'}
                  </td>
                  <td className="p-3 text-neutral-400">{p.recordedBy}</td>
                  <td className="p-3 text-end">
                    <button
                      type="button"
                      onClick={() => onOpenReceipt(p)}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 border border-neutral-700"
                    >
                      <Printer className="w-3 h-3" />
                      <span>إيصال</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    لا توجد مدفوعات مسجلة مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-xs text-start">
            <thead className="bg-black/60 text-neutral-400 border-b border-neutral-800 font-semibold">
              <tr>
                <th className="p-3 text-start">بند المصروف</th>
                <th className="p-3 text-start">التصنيف</th>
                <th className="p-3 text-start">المبلغ</th>
                <th className="p-3 text-start">التاريخ</th>
                <th className="p-3 text-start">المسؤول</th>
                <th className="p-3 text-start">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-black/40">
                  <td className="p-3 font-bold text-white">{e.title}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">
                      {e.category}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-rose-400">
                    -{e.amount.toLocaleString()} {organization?.currency || 'ج.م'}
                  </td>
                  <td className="p-3 font-mono text-neutral-400">{e.date}</td>
                  <td className="p-3 text-neutral-400">{e.recordedBy}</td>
                  <td className="p-3 text-neutral-400">{e.notes || '-'}</td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    لا توجد مصروفات مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: DEBTS */}
      {activeTab === 'debts' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-xs text-start">
            <thead className="bg-black/60 text-neutral-400 border-b border-neutral-800 font-semibold">
              <tr>
                <th className="p-3 text-start">اسم المشترك</th>
                <th className="p-3 text-start">كود المشترك</th>
                <th className="p-3 text-start">الهاتف</th>
                <th className="p-3 text-start">المستحق الإجمالي</th>
                <th className="p-3 text-start">المسدد</th>
                <th className="p-3 text-start">المتبقي (مديونية)</th>
                <th className="p-3 text-end">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {debtorMembers.map((m) => (
                <tr key={m.id} className="hover:bg-black/40">
                  <td className="p-3 font-bold text-white">{m.fullName}</td>
                  <td className="p-3 font-mono text-neutral-300">{m.memberCode}</td>
                  <td className="p-3 font-mono text-neutral-400">{m.phone}</td>
                  <td className="p-3 font-mono text-neutral-300">{(m.totalDue || 0).toLocaleString()} {organization?.currency || 'ج.م'}</td>
                  <td className="p-3 font-mono text-emerald-400">{(m.totalPaid || 0).toLocaleString()} {organization?.currency || 'ج.م'}</td>
                  <td className="p-3 font-mono font-bold text-rose-400">
                    {(m.balance || 0).toLocaleString()} {organization?.currency || 'ج.م'}
                  </td>
                  <td className="p-3 text-end">
                    <button
                      type="button"
                      onClick={() => {
                        setPayMemberId(m.id);
                        setPayAmount(String(m.balance || 0));
                        setShowAddPaymentModal(true);
                      }}
                      className="px-3 py-1 bg-white hover:bg-neutral-200 text-black font-bold rounded-lg text-[11px]"
                    >
                      تحصيل الآن
                    </button>
                  </td>
                </tr>
              ))}
              {debtorMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    رائع! لا توجد أي مديونيات متأخرة على المشتركين
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: ADD PAYMENT */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4 text-white">
            <h2 className="text-base font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>سداد دفعة / إصدار إيصال تحصيل</span>
            </h2>
            <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">المشترك *</label>
                <select
                  required
                  value={payMemberId}
                  onChange={(e) => {
                    setPayMemberId(e.target.value);
                    const m = members.find((mem) => mem.id === e.target.value);
                    if (m && m.balance && m.balance > 0) {
                      setPayAmount(String(m.balance));
                    }
                  }}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">-- اختر المشترك --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.memberCode}) {m.balance && m.balance > 0 ? `[متبقي: ${m.balance}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">المبلغ المطلوب تحصيله *</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">طريقة الدفع</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="cash">نقدي (كاش بالخزينة)</option>
                  <option value="transfer">تحويل محفظة (فودافون كاش / إنستاباي)</option>
                  <option value="card">بطاقة بنكية / فيزا</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">بيان السداد والملاحظات</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-3.5 py-1.5 bg-neutral-900 text-neutral-300 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-white text-black font-bold rounded-xl hover:bg-neutral-200"
                >
                  حفظ وطباعة الإيصال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXPENSE */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4 text-white">
            <h2 className="text-base font-bold flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>تسجيل بند مصروف جديد</span>
            </h2>
            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">اسم بند الصرف *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="مثال: شراء كرات تدريب أو فواتير صيانة"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">المبلغ *</label>
                <input
                  type="number"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">التصنيف</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="أدوات ومهمات">أدوات ومهمات</option>
                  <option value="رواتب ومكافآت">رواتب ومكافآت</option>
                  <option value="إيجار ومرافق">إيجار ومرافق</option>
                  <option value="صيانة ونظافة">صيانة ونظافة</option>
                  <option value="دعاية وتسويق">دعاية وتسويق</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">ملاحظات إضافية</label>
                <input
                  type="text"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-3.5 py-1.5 bg-neutral-900 text-neutral-300 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-white text-black font-bold rounded-xl hover:bg-neutral-200"
                >
                  حفظ المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
