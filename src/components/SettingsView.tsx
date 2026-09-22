import React, { useState } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldAlert,
  Phone,
  Building,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { OrganizationConfig, SystemUser } from '../types';
import { dbService } from '../lib/db';
import { seedInitialData } from '../lib/db';

interface SettingsViewProps {
  organization: OrganizationConfig | null;
  currentUser: SystemUser | null;
  lang: 'ar' | 'en';
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  organization,
  currentUser,
  lang,
  onRefresh
}) => {
  const [name, setName] = useState(organization?.name || '');
  const [subName, setSubName] = useState(organization?.subName || '');
  const [phone, setPhone] = useState(organization?.phone || '');
  const [address, setAddress] = useState(organization?.address || '');
  const [currency, setCurrency] = useState(organization?.currency || 'ج.م');
  const [activityType, setActivityType] = useState(organization?.activityType || 'sports_academy');
  const [isSaved, setIsSaved] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    const updated: OrganizationConfig = {
      ...organization,
      name: name.trim(),
      subName: subName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      currency: currency.trim(),
      activityType: activityType as any
    };
    await dbService.saveOrganization(updated);
    setIsSaved(true);
    setMsg(lang === 'ar' ? 'تم حفظ التعديلات بنجاح' : 'Settings saved successfully');
    setTimeout(() => setMsg(''), 3000);
    onRefresh();
  };

  // Export JSON Backup
  const handleExportBackup = async () => {
    const backupData = await dbService.exportFullBackup();
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rcn_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        await dbService.importFullBackup(parsed);
        alert(lang === 'ar' ? 'تم استرجاع النسخة الاحتياطية بنجاح!' : 'Backup restored successfully!');
        window.location.reload();
      } catch (err: any) {
        alert(lang === 'ar' ? 'ملف النسخة الاحتياطية غير صالح' : 'Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  // Reset demo data
  const handleResetData = async () => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من إعادة تعيين البيانات إلى البيانات التجريبية الأولية؟' : 'Reset database to demo seed data?')) {
      await seedInitialData(true);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Title */}
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="text-2xl font-black text-white">{lang === 'ar' ? 'إعدادات النظام والنسخ الاحتياطي' : 'System & Settings'}</h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          {lang === 'ar' ? 'تخصيص بيانات المنشأة، نوع النشاط، إدارة البيانات المحلية والترخيص' : 'Configure organization, local IndexedDB backups and license info'}
        </p>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Org Info Form */}
        <div className="lg:col-span-7 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span>{lang === 'ar' ? 'بيانات المنشأة والنشاط' : 'Organization Profile'}</span>
          </h2>

          <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">اسم المنشأة / الأكاديمية</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1">الاسم الفرعي / الوصف المختصر</label>
              <input
                type="text"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">نوع النشاط</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as any)}
                  className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="sports_academy">أكاديمية رياضية (كرة قدم، سباحة، إلخ)</option>
                  <option value="school_nursery">حضانة / مدرسة</option>
                  <option value="educational_center">سنتر تعليمي / دروس</option>
                  <option value="gym_fitness">جيم وصالة لياقة بدنية</option>
                  <option value="cultural_center">مركز تدريب وكورسات</option>
                  <option value="general_activity">نشاط عام / متعدد</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">رمز العملة</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">رقم هاتف المنشأة</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">العنوان</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-white text-black font-bold text-xs rounded-xl shadow hover:bg-neutral-200"
              >
                {lang === 'ar' ? 'حفظ بيانات المنشأة' : 'Save Organization Info'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Offline Database & License Management */}
        <div className="lg:col-span-5 space-y-4">
          {/* License Info Card with contact 01060474659 */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center justify-between">
              <span>{lang === 'ar' ? 'بيانات الترخيص والاشتراك' : 'License & Subscription'}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                نشط وسارٍ
              </span>
            </h2>
            <div className="text-xs space-y-2 text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-500">حساب الدخول:</span>
                <span className="font-bold text-white font-mono">{currentUser?.username || 'admin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">صلاحية الترخيص:</span>
                <span className="font-mono text-emerald-400 font-bold">{currentUser?.expiresAt || '2026-12-31'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">الدعم الفني المعتمد:</span>
                <span className="font-mono text-white font-bold">01060474659</span>
              </div>
            </div>
          </div>

          {/* Backup & Restore Card */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>{lang === 'ar' ? 'النسخ الاحتياطي (أوفلاين 100%)' : 'Local Offline Backup'}</span>
            </h2>
            <p className="text-xs text-neutral-400">
              {lang === 'ar'
                ? 'قاعدة البيانات مخزنة بالكامل محلياً على جهازك دون اتصال بالإنترنت. يمكنك حفظ نسخة احتياطية أو استعادتها في أي وقت.'
                : 'All data is stored securely in your browser IndexedDB offline.'}
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-neutral-700"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تصدير نسخة احتياطية كاملة (JSON)' : 'Export Full Backup'}</span>
              </button>

              <label className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-neutral-700 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{lang === 'ar' ? 'استرجاع نسخة احتياطية من ملف' : 'Restore Backup File'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleResetData}
                className="w-full py-2 bg-neutral-950 hover:bg-neutral-900 text-rose-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-neutral-800 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إعادة تعيين البيانات الأولية التجريبية' : 'Reset to Demo Seed Data'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
