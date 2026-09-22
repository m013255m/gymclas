import React, { useState } from 'react';
import {
  GraduationCap,
  Trophy,
  Briefcase,
  Building,
  Dumbbell,
  BookOpen,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Settings2,
  Clock,
  Coins
} from 'lucide-react';
import { ActivityType, OrganizationConfig } from '../types';
import { ACTIVITY_TERMINOLOGIES } from '../lib/translations';
import { dbService } from '../lib/db';

interface SetupWizardProps {
  onComplete: (config?: OrganizationConfig) => void;
  initialConfig?: OrganizationConfig | null;
  lang?: 'ar' | 'en';
}

const ACTIVITIES: { type: ActivityType; nameAr: string; nameEn: string; icon: any; descAr: string }[] = [
  { type: 'educational_academy', nameAr: 'أكاديمية تعليمية', nameEn: 'Educational Academy', icon: GraduationCap, descAr: 'طلاب، فصول، حصص، معلمون' },
  { type: 'educational_center', nameAr: 'سنتر تعليمي', nameEn: 'Educational Center', icon: BookOpen, descAr: 'مجموعات، محاضرات، حضور وانصراف' },
  { type: 'school', nameAr: 'مدرسة', nameEn: 'School', icon: Building, descAr: 'فصول دراسية، حصص، تقييم درجات' },
  { type: 'nursery', nameAr: 'حضانة أطفال', nameEn: 'Nursery / Preschool', icon: Sparkles, descAr: 'أطفال، قاعات، أنشطة وسلوك' },
  { type: 'language_center', nameAr: 'مركز لغات', nameEn: 'Language Center', icon: BookOpen, descAr: 'مستويات، ورش، طلاقة لغوية' },
  { type: 'training_center', nameAr: 'مركز تدريب', nameEn: 'Training Center', icon: Settings2, descAr: 'دورات، ورش عمل، كفاءات' },
  { type: 'sports_academy', nameAr: 'أكاديمية رياضية', nameEn: 'Sports Academy', icon: Trophy, descAr: 'لاعبين، فرق، تمرينات، كباتن' },
  { type: 'football_academy', nameAr: 'أكاديمية كرة قدم', nameEn: 'Football Academy', icon: Trophy, descAr: 'مواليد، فرق، حصص تدريب بالملعب' },
  { type: 'gym_fitness', nameAr: 'جيم ولياقة بدنية', nameEn: 'Gym & Fitness', icon: Dumbbell, descAr: 'مشتركين، باقات، كلاسات، قياسات' },
  { type: 'sports_club', nameAr: 'نادي رياضي', nameEn: 'Sports Club', icon: Trophy, descAr: 'قطاعات رياضية وبطولات' },
  { type: 'company', nameAr: 'شركة ومؤسسة', nameEn: 'Company / Enterprise', icon: Briefcase, descAr: 'موظفين، أقسام، شفتات عمل' },
  { type: 'employee_management', nameAr: 'شؤون موظفين', nameEn: 'Staff & HR', icon: Users, descAr: 'كادر وظيفي، فترات، تقييم' },
  { type: 'courses', nameAr: 'دورات وورش عمل', nameEn: 'Courses & Workshops', icon: BookOpen, descAr: 'مشاركين، دورات ومحاضرات' },
  { type: 'membership_org', nameAr: 'منظمة ذات عضوية', nameEn: 'Membership Org', icon: Users, descAr: 'أعضاء ولجان واجتماعات' },
  { type: 'custom', nameAr: 'نشاط مخصص', nameEn: 'Custom Activity', icon: Settings2, descAr: 'تخصيص كامل للمصطلحات' }
];

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, lang = 'ar' }) => {
  const [step, setStep] = useState(1);
  const [activityType, setActivityType] = useState<ActivityType>('educational_academy');
  const [orgName, setOrgName] = useState('أكاديمية النجاح الدولية');
  const [orgSubName, setOrgSubName] = useState('فرع مدينة نصر والمهندسين');
  const [phone, setPhone] = useState('01060474659');
  const [email, setEmail] = useState('info@rcnmanager.com');
  const [address, setAddress] = useState('القاهرة - مصر');
  const [currency, setCurrency] = useState('ج.م');
  const [loadDemo, setLoadDemo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedTerms = ACTIVITY_TERMINOLOGIES[activityType] || ACTIVITY_TERMINOLOGIES.custom;

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const config: OrganizationConfig = {
        id: 'org_main',
        name: orgName.trim() || 'RCN MANAGER',
        subName: orgSubName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        currency,
        language: lang,
        timezone: 'Africa/Cairo',
        activityType,
        contactSupportPhone: '01060474659',
        setupCompleted: true
      };
      await dbService.saveSettings(config);
      if (loadDemo) {
        await dbService.initializeDatabaseIfEmpty();
      }
      onComplete(config);
    } catch (e) {
      console.error(e);
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-black font-black flex items-center justify-center">
              RCN
            </div>
            <div>
              <h2 className="font-bold text-lg">
                {lang === 'ar' ? 'معالج تهيئة النظام والنشاط' : 'Initial System Setup Wizard'}
              </h2>
              <p className="text-xs text-neutral-400">
                {lang === 'ar' ? `الخطوة ${step} من 4` : `Step ${step} of 4`}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  step === i ? 'w-8 bg-white' : step > i ? 'w-4 bg-neutral-500' : 'w-2 bg-neutral-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Welcome & Overview */}
        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-700 mb-2">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white">
                {lang === 'ar' ? 'مرحباً بك في RCN MANAGER' : 'Welcome to RCN MANAGER'}
              </h3>
              <p className="text-neutral-300 text-sm leading-relaxed">
                {lang === 'ar'
                  ? 'منظومة إدارة المشتركين والأنشطة الشاملة (Offline-First) - واجهة أحادية اللون أنيقة باللونين الأبيض والأسود وسرعة فائقة.'
                  : 'Universal Activity & Member Management System - engineered offline-first with pristine black-and-white visual identity.'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="font-bold text-white block text-sm mb-1">
                  {lang === 'ar' ? 'الملف الرقمي الموحد' : 'One Digital File'}
                </span>
                <p className="text-xs text-neutral-400">
                  {lang === 'ar' ? 'ملف شامل لكل عضو يجمع الحضور والمدفوعات والملاحظات والتقييم' : 'Unified member file for history, payments & attendance'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="font-bold text-white block text-sm mb-1">
                  {lang === 'ar' ? 'ماسح الـ QR الذكي' : 'Advanced QR Scanner'}
                </span>
                <p className="text-xs text-neutral-400">
                  {lang === 'ar' ? 'تسجيل حضور بالكاميرا أو الباركود مع طباعة كروت فورية' : 'Camera-based check-in with card generation'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="font-bold text-white block text-sm mb-1">
                  {lang === 'ar' ? 'يعمل دون إنترنت 100%' : '100% Offline-First'}
                </span>
                <p className="text-xs text-neutral-400">
                  {lang === 'ar' ? 'قاعدة بيانات محلية على متصفحك مع ميزة النسخ الاحتياطي الكامل' : 'Local IndexedDB storage with full backup & restore'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Choose Activity Type */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div>
              <h3 className="text-base font-bold text-white">
                {lang === 'ar' ? 'اختر نوع النشاط أو المنشأة:' : 'Select Your Organization Activity Type:'}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {lang === 'ar'
                  ? 'يقوم النظام بضبط جميع المصطلحات تلقائياً (طالب/لاعب/عضو، حصة/تمرينة/جلسة...)'
                  : 'Terminology will automatically adapt to your chosen workflow.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
              {ACTIVITIES.map((act) => {
                const Icon = act.icon;
                const isSelected = activityType === act.type;
                return (
                  <button
                    key={act.type}
                    type="button"
                    onClick={() => setActivityType(act.type)}
                    className={`p-3 rounded-xl border text-start flex items-start gap-3 transition-all ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700 text-neutral-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-300'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">
                        {lang === 'ar' ? act.nameAr : act.nameEn}
                      </div>
                      <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-neutral-700' : 'text-neutral-400'}`}>
                        {act.descAr}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Terminology Preview */}
            <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs space-y-1.5">
              <span className="text-neutral-400 font-semibold block">
                {lang === 'ar' ? 'معاينة المصطلحات المعينة تلقائياً:' : 'Terminology Preview:'}
              </span>
              <div className="flex flex-wrap gap-2 text-neutral-300">
                <span className="px-2 py-1 bg-black rounded border border-neutral-700">
                  {lang === 'ar' ? `العضو: ${selectedTerms.termsAr.member}` : `Member: ${selectedTerms.termsEn.member}`}
                </span>
                <span className="px-2 py-1 bg-black rounded border border-neutral-700">
                  {lang === 'ar' ? `المجموعة: ${selectedTerms.termsAr.group}` : `Group: ${selectedTerms.termsEn.group}`}
                </span>
                <span className="px-2 py-1 bg-black rounded border border-neutral-700">
                  {lang === 'ar' ? `الحصة: ${selectedTerms.termsAr.session}` : `Session: ${selectedTerms.termsEn.session}`}
                </span>
                <span className="px-2 py-1 bg-black rounded border border-neutral-700">
                  {lang === 'ar' ? `المسؤول: ${selectedTerms.termsAr.instructor}` : `Instructor: ${selectedTerms.termsEn.instructor}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Organization Details */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <div>
              <h3 className="text-base font-bold text-white">
                {lang === 'ar' ? 'بيانات المنشأة والمطبوعات' : 'Organization Details'}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {lang === 'ar'
                  ? 'ستظهر هذه البيانات في ترويسة الإيصالات، بطاقات الـ QR، والتقارير المطبوعة.'
                  : 'These details appear on printed receipts, ID cards, and exports.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">
                  {lang === 'ar' ? 'اسم المؤسسة أو الأكاديمية' : 'Organization Name'}
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">
                  {lang === 'ar' ? 'العنوان الفرعي (الفرع / التخصص)' : 'Subtitle / Slogan'}
                </label>
                <input
                  type="text"
                  value={orgSubName}
                  onChange={(e) => setOrgSubName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">
                  {lang === 'ar' ? 'رقم الهاتف' : 'Phone'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">
                  {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">
                  {lang === 'ar' ? 'العنوان' : 'Address'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">
                  {lang === 'ar' ? 'العملة الافتراضية' : 'Currency'}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                >
                  <option value="ج.م">جنيه مصري (ج.م - EGP)</option>
                  <option value="ر.س">ريال سعودي (ر.س - SAR)</option>
                  <option value="د.إ">درهم إماراتي (د.إ - AED)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Finish & Demo Data */}
        {step === 4 && (
          <div className="space-y-5 py-2">
            <div className="text-center max-w-lg mx-auto">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-black font-black text-xl mb-3">
                ✓
              </div>
              <h3 className="text-xl font-bold text-white">
                {lang === 'ar' ? 'جاهز للبدء والتشغيل!' : 'Ready to Launch!'}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                {lang === 'ar'
                  ? 'تم ضبط كافة الإعدادات والمصطلحات. يمكنك الآن فتح لوحة التحكم الرئيسية.'
                  : 'Configuration complete. You can now launch your management console.'}
              </p>
            </div>
            {/* Demo data toggle */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-3 cursor-pointer" onClick={() => setLoadDemo(!loadDemo)}>
              <input
                type="checkbox"
                checked={loadDemo}
                onChange={() => {}}
                className="mt-1 w-4 h-4 rounded border-neutral-700 text-white bg-black accent-white cursor-pointer"
              />
              <div>
                <span className="text-sm font-bold text-white block">
                  {lang === 'ar' ? 'تحميل بيانات تجريبية واقعية (أعضاء، مجموعات، إيصالات، حضور)' : 'Load sample initial data (Members, Groups, Payments, Attendance)'}
                </span>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {lang === 'ar'
                    ? 'يُنصح به لاستعراض كافة الرسوم البيانية والجداول فوراً، ويمكنك حذفها أو تفريغها في أي وقت.'
                    : 'Recommended for exploring all charts and features. Can be cleared at any time.'}
                </p>
              </div>
            </div>
            {/* Summary Box */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs space-y-1.5 text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-500">{lang === 'ar' ? 'المنشأة:' : 'Organization:'}</span>
                <span className="font-semibold text-white">{orgName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">{lang === 'ar' ? 'نوع النشاط:' : 'Activity Type:'}</span>
                <span className="text-white">{selectedTerms.nameAr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">{lang === 'ar' ? 'المصطلحات:' : 'Terms:'}</span>
                <span className="text-white">{selectedTerms.termsAr.member} • {selectedTerms.termsAr.group} • {selectedTerms.termsAr.session}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-neutral-800 pt-5 mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 transition"
            >
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              <span>{lang === 'ar' ? 'السابق' : 'Previous'}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold flex items-center gap-1.5 transition"
            >
              <span>{lang === 'ar' ? 'التالي' : 'Next'}</span>
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-black flex items-center gap-2 shadow-lg transition"
            >
              <span>{isSaving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Setting up...') : (lang === 'ar' ? 'دخول لوحة التحكم' : 'Open Dashboard')}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
