import React from 'react';
import { X, Printer, CheckCircle2, Building, ShieldCheck } from 'lucide-react';
import { OrganizationConfig, Payment } from '../types';

interface ReceiptModalProps {
  payment: Payment;
  organization: OrganizationConfig | null;
  onClose: () => void;
  lang: 'ar' | 'en';
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  organization,
  onClose,
  lang
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-6 text-white space-y-5 shadow-2xl">
        {/* Top Actions */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <span className="text-xs font-bold text-neutral-400">
            {lang === 'ar' ? 'معاينة إيصال التحصيل والقبض' : 'Payment Receipt Preview'}
          </span>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Printable Receipt Body */}
        <div
          id="printable-receipt"
          className="bg-white text-black p-6 rounded-2xl border-2 border-black space-y-4 font-sans shadow-lg"
        >
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-3 space-y-1">
            <h2 className="text-xl font-black uppercase tracking-wider">{organization?.name || 'RCN MANAGER'}</h2>
            <p className="text-xs text-neutral-700">{organization?.subName || 'نظام إدارة الأنشطة الذكي'}</p>
            <div className="text-[11px] font-mono text-neutral-600 mt-1">
              هاتف: {organization?.phone || '01060474659'} • العنوان: {organization?.address || 'جمهورية مصر العربية'}
            </div>
            <div className="inline-block px-3 py-1 bg-black text-white font-bold text-xs rounded-full mt-2">
              إيصال استلام نقدية (سند قبض)
            </div>
          </div>

          {/* Receipt Info */}
          <div className="text-xs space-y-2 border-b border-dashed border-neutral-400 pb-3">
            <div className="flex justify-between">
              <span className="text-neutral-600">رقم الإيصال:</span>
              <span className="font-mono font-bold text-black">{payment.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">التاريخ والوقت:</span>
              <span className="font-mono">{payment.date} - {payment.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">استلمنا من السيد/ة:</span>
              <span className="font-bold text-black">{payment.memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">كود المشترك:</span>
              <span className="font-mono">{payment.memberCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">طريقة السداد:</span>
              <span>
                {payment.method === 'cash' ? 'نقداً بالخزينة' : payment.method === 'transfer' ? 'تحويل إلكتروني' : 'بطاقة بنكية'}
              </span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-neutral-100 border border-neutral-300 rounded-xl p-3 text-center space-y-1">
            <span className="text-[11px] text-neutral-600 font-semibold block">المبلغ المدفوع وقدره:</span>
            <span className="text-2xl font-black font-mono text-black">
              {payment.amount.toLocaleString()} {organization?.currency || 'ج.م'}
            </span>
          </div>

          {/* Balance breakdown */}
          <div className="text-xs space-y-1.5 border-b border-dashed border-neutral-400 pb-3 text-neutral-700">
            <div className="flex justify-between">
              <span>البيان:</span>
              <span className="font-medium text-black">{payment.notes || 'سداد رسوم اشتراك'}</span>
            </div>
            {payment.remainingBalance !== undefined && (
              <div className="flex justify-between">
                <span>المتبقي في الحساب بعد هذا السداد:</span>
                <span className="font-mono font-bold text-black">
                  {payment.remainingBalance.toLocaleString()} {organization?.currency || 'ج.م'}
                </span>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="pt-2 flex justify-between items-end text-xs">
            <div className="text-center">
              <span className="block text-neutral-500 text-[10px] mb-6">توقيع المستلم / الخزينة</span>
              <span className="font-bold text-neutral-800">{payment.recordedBy}</span>
            </div>
            <div className="text-center">
              <span className="block text-neutral-500 text-[10px] mb-6">ختم الإدارة / المركز</span>
              <div className="w-16 h-8 border border-neutral-400 border-dashed rounded flex items-center justify-center text-[9px] text-neutral-400">
                RCN SEAL
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 text-neutral-300 text-xs font-semibold rounded-xl"
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2 bg-white text-black font-bold text-xs rounded-xl hover:bg-neutral-200 flex items-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ar' ? 'طباعة الإيصال' : 'Print Receipt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
