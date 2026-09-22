import React, { useState, useRef } from 'react';
import {
  X,
  UserPlus,
  Calendar,
  CreditCard,
  Shield,
  AlertCircle,
  HeartPulse,
  QrCode,
  Camera,
  Upload,
  Trash2,
  Link2,
  Sparkles,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { Group, Member, OrganizationConfig } from '../types';
import { dbService } from '../lib/db';
import { processMemberPhoto, PRESET_AVATARS } from '../lib/image';

interface AddMemberModalProps {
  groups: Group[];
  allMembers: Member[];
  organization: OrganizationConfig | null;
  onClose: () => void;
  onSaved: (newMember: Member, openProfile?: boolean) => void;
  lang: 'ar' | 'en';
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  groups,
  allMembers,
  organization,
  onClose,
  onSaved,
  lang
}) => {
  // Generate next member code
  const nextNumber = allMembers.length + 1;
  const autoCode = `RCN-${String(nextNumber).padStart(6, '0')}`;

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to compute end date
  const computeEndDate = (start: string, monthsToAdd: number) => {
    const d = new Date(start || todayStr);
    d.setMonth(d.getMonth() + monthsToAdd);
    return d.toISOString().split('T')[0];
  };

  // Form states
  const [photoUrl, setPhotoUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [email, setEmail] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bloodType, setBloodType] = useState('O+');
  const [healthStatus, setHealthStatus] = useState('');
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [dateOfBirth, setDateOfBirth] = useState('2008-01-01');
  const [address, setAddress] = useState('');

  // Subscription details
  const [subscriptionPlan, setSubscriptionPlan] = useState('اشتراك شهري (30 يوم)');
  const [subscriptionStartDate, setSubscriptionStartDate] = useState(todayStr);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(computeEndDate(todayStr, 1));
  const [initialFee, setInitialFee] = useState('1500');
  const [paidNow, setPaidNow] = useState('1500');
  const [notes, setNotes] = useState('');

  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'subscription' | 'emergency'>('basic');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle local file selection
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      setError('');
      const compressedDataUrl = await processMemberPhoto(file);
      setPhotoUrl(compressedDataUrl);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || (lang === 'ar' ? 'حدث خطأ أثناء معالجة الصورة' : 'Error processing image'));
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle drag & drop
  const handleDropPhoto = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      setError('');
      const compressedDataUrl = await processMemberPhoto(file);
      setPhotoUrl(compressedDataUrl);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || (lang === 'ar' ? 'حدث خطأ أثناء معالجة الصورة' : 'Error processing image'));
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleApplyManualUrl = () => {
    if (!manualUrl.trim()) return;
    setPhotoUrl(manualUrl.trim());
    setManualUrl('');
    setShowUrlInput(false);
  };

  // Quick duration selection
  const handleSetDuration = (months: number, planLabel: string) => {
    setSubscriptionPlan(planLabel);
    setSubscriptionEndDate(computeEndDate(subscriptionStartDate, months));
  };

  const handleSubmit = async (e: React.FormEvent, openProfile = false, addAnother = false) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setError(lang === 'ar' ? 'يرجى كتابة الاسم ورقم الهاتف على الأقل' : 'Please enter full name and phone number');
      setActiveFormTab('basic');
      return;
    }

    setIsSubmitting(true);
    try {
      const fee = parseFloat(initialFee) || 0;
      const paid = parseFloat(paidNow) || 0;
      const balance = Math.max(0, fee - paid);

      const newMember: Member = {
        id: 'mem_' + Date.now(),
        memberCode: autoCode,
        fullName: fullName.trim(),
        photoUrl: photoUrl.trim() || undefined,
        phone: phone.trim(),
        nationalId: nationalId.trim(),
        email: email.trim(),
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        emergencyContact: emergencyContact.trim(),
        bloodType,
        healthStatus: healthStatus.trim(),
        address: address.trim(),
        dateOfBirth,
        gender,
        registrationDate: todayStr,
        status: 'active',
        currentGroupId: groupId,
        subscriptionPlan,
        subscriptionStartDate,
        subscriptionEndDate,
        subscriptionFee: fee,
        totalDue: fee,
        totalPaid: paid,
        balance,
        notes: notes.trim(),
        qrCodeSafeData: `RCN:${autoCode}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dbService.saveMember(newMember);

      // If initial payment was made, record payment receipt
      if (paid > 0) {
        await dbService.addPayment({
          id: 'pay_' + Date.now(),
          receiptNumber: `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
          memberId: newMember.id,
          memberName: newMember.fullName,
          memberCode: newMember.memberCode,
          amount: paid,
          date: todayStr,
          time: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
          method: 'cash',
          notes: `سداد رسوم اشتراك (${subscriptionPlan})`,
          recordedBy: 'المدير العام',
          previousBalance: fee,
          remainingBalance: balance,
          createdAt: new Date().toISOString()
        });
      }

      if (addAnother) {
        setFullName('');
        setPhotoUrl('');
        setShowUrlInput(false);
        setManualUrl('');
        setShowPresets(false);
        setPhone('');
        setNationalId('');
        setEmail('');
        setGuardianName('');
        setGuardianPhone('');
        setNotes('');
        setError('');
        setIsSubmitting(false);
      } else {
        onSaved(newMember, openProfile);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'خطأ أثناء الحفظ');
      setIsSubmitting(false);
    }
  };

  const calculatedRemaining = Math.max(0, (parseFloat(initialFee) || 0) - (parseFloat(paidNow) || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 md:p-4 overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-5 md:p-6 text-white max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white text-black font-black">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{lang === 'ar' ? 'إضافة مشترك جديد وتفاصيل العضوية' : 'Add New Member & Membership Details'}</h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                <span>{lang === 'ar' ? `كود العضوية: ${autoCode}` : `Assigned ID: ${autoCode}`}</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">{lang === 'ar' ? 'حفظ محلي فوري' : 'Instant Local Save'}</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white border border-neutral-800 hover:bg-neutral-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 border-b border-neutral-800 pb-3 mb-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveFormTab('basic')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeFormTab === 'basic'
                ? 'bg-white text-black shadow'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? '1. البيانات الأساسية' : '1. Basic Info'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFormTab('subscription')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeFormTab === 'subscription'
                ? 'bg-white text-black shadow'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? '2. تفاصيل الاشتراك والانتهاء' : '2. Subscription & Expiry'}</span>
            {calculatedRemaining > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono">
                مديونية
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveFormTab('emergency')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeFormTab === 'emergency'
                ? 'bg-white text-black shadow'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? '3. الطوارئ والمعلومات الإضافية' : '3. Emergency & Extras'}</span>
          </button>
        </div>

        {/* Form Body */}
        <form className="space-y-4 flex-1 overflow-y-auto pr-1 text-xs" onSubmit={(e) => handleSubmit(e, false, false)}>
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: BASIC INFORMATION */}
          {activeFormTab === 'basic' && (
            <div className="space-y-4">
              {/* MEMBER PHOTO SECTION */}
              <div
                className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 transition relative overflow-hidden"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={handleDropPhoto}
              >
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-neutral-700 bg-neutral-950 flex items-center justify-center shadow-lg relative">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="صورة المشترك"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-neutral-500 gap-1.5 p-2 text-center">
                          <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center text-neutral-400">
                            <Camera className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-medium leading-tight">
                            {lang === 'ar' ? 'بدون صورة' : 'No Photo'}
                          </span>
                        </div>
                      )}

                      {/* Processing Overlay */}
                      {isProcessingPhoto && (
                        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-1">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-[9px] text-white font-medium">
                            {lang === 'ar' ? 'جاري المعالجة' : 'Processing'}
                          </span>
                        </div>
                      )}
                    </div>

                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        title={lang === 'ar' ? 'إزالة الصورة' : 'Remove photo'}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Photo Actions & Controls */}
                  <div className="flex-1 space-y-2 text-center sm:text-start w-full">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5 justify-center sm:justify-start">
                          <Camera className="w-4 h-4 text-sky-400" />
                          <span>{lang === 'ar' ? 'الصورة الشخصية للمشترك / العضو' : 'Personal Member Photo'}</span>
                          {photoUrl && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              {lang === 'ar' ? 'تم تعيين الصورة' : 'Photo set'}
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {lang === 'ar'
                            ? 'ستظهر الصورة فوراً في بطاقة العضوية المطبوعة، وسجلات الحضور والـ QR'
                            : 'Will appear automatically on printed ID cards, attendance logs, and QR code'}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingPhoto}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center gap-1.5 transition shadow"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{photoUrl ? (lang === 'ar' ? 'تغيير الصورة' : 'Change Photo') : (lang === 'ar' ? 'رفع صورة من جهازك' : 'Upload Photo')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUrlInput(!showUrlInput);
                          setShowPresets(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition ${
                          showUrlInput
                            ? 'bg-neutral-800 text-white border-neutral-600'
                            : 'bg-neutral-900 text-neutral-300 hover:text-white border-neutral-700'
                        }`}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'رابط صورة (URL)' : 'Photo URL'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowPresets(!showPresets);
                          setShowUrlInput(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition ${
                          showPresets
                            ? 'bg-neutral-800 text-white border-neutral-600'
                            : 'bg-neutral-900 text-neutral-300 hover:text-white border-neutral-700'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{lang === 'ar' ? 'صور رمزية جاهزة' : 'Sample Avatars'}</span>
                      </button>

                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-medium flex items-center gap-1 border border-rose-800/60 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'حذف' : 'Remove'}</span>
                        </button>
                      )}
                    </div>

                    {/* Manual URL Input Bar */}
                    {showUrlInput && (
                      <div className="pt-2 flex items-center gap-2 animate-in fade-in">
                        <input
                          type="url"
                          value={manualUrl}
                          onChange={(e) => setManualUrl(e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleApplyManualUrl}
                          className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition"
                        >
                          {lang === 'ar' ? 'تطبيق' : 'Apply'}
                        </button>
                      </div>
                    )}

                    {/* Preset Avatars Drawer */}
                    {showPresets && (
                      <div className="pt-2 animate-in fade-in">
                        <span className="text-[11px] text-neutral-400 block mb-1.5">
                          {lang === 'ar' ? 'اختر صورة سريعة تناسب المشترك:' : 'Pick a quick preset avatar:'}
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {PRESET_AVATARS.map((av) => (
                            <button
                              key={av.id}
                              type="button"
                              onClick={() => {
                                setPhotoUrl(av.url);
                                setShowPresets(false);
                              }}
                              className="group relative shrink-0 rounded-xl overflow-hidden border-2 border-neutral-700 hover:border-white transition p-0.5"
                            >
                              <img src={av.url} alt={av.label} className="w-10 h-10 rounded-lg object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-center text-neutral-200 truncate py-0.5">
                                {av.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">
                    {lang === 'ar' ? 'الاسم الرباعي أو الكامل *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: محمد أحمد علي حسانين' : 'e.g. John Doe'}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white text-sm focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">
                    {lang === 'ar' ? 'رقم الهاتف الشخصي (واتساب) *' : 'Phone Number (WhatsApp) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">
                    {lang === 'ar' ? 'المجموعة / الفريق الرياضي' : 'Assigned Group'}
                  </label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white text-sm focus:border-white focus:outline-none"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.instructorName}) - {g.schedule}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">
                    {lang === 'ar' ? 'النوع' : 'Gender'}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white text-sm focus:border-white focus:outline-none"
                  >
                    <option value="male">{lang === 'ar' ? 'ذكر' : 'Male'}</option>
                    <option value="female">{lang === 'ar' ? 'أنثى' : 'Female'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">
                    {lang === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">
                    {lang === 'ar' ? 'الرقم القومي / إثبات الهوية' : 'National ID / Passport'}
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="2990101xxxxxxxx"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1 text-neutral-300">
                    {lang === 'ar' ? 'محل الإقامة / العنوان' : 'Residential Address'}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="المحافظة / المدينة / المنطقة السكنية"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white text-sm focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveFormTab('subscription')}
                  className="px-4 py-2 bg-white text-black font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <span>{lang === 'ar' ? 'التالي: تحديد مدة الاشتراك والرسوم' : 'Next: Subscription Details'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTION DATES & FINANCIALS */}
          {activeFormTab === 'subscription' && (
            <div className="space-y-4">
              {/* Plan Presets */}
              <div className="p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-2.5">
                <label className="block font-bold text-white text-xs">
                  {lang === 'ar' ? 'اختر خطة الاشتراك السريعة:' : 'Select Subscription Plan:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { labelAr: 'اشتراك شهري (30 يوم)', months: 1, fee: '1500' },
                    { labelAr: 'اشتراك 3 أشهر (ربع سنوي)', months: 3, fee: '4000' },
                    { labelAr: 'اشتراك 6 أشهر (نصف سنوي)', months: 6, fee: '7500' },
                    { labelAr: 'اشتراك سنوي (12 شهر)', months: 12, fee: '14000' }
                  ].map((preset) => (
                    <button
                      key={preset.labelAr}
                      type="button"
                      onClick={() => {
                        handleSetDuration(preset.months, preset.labelAr);
                        setInitialFee(preset.fee);
                        setPaidNow(preset.fee);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        subscriptionPlan === preset.labelAr
                          ? 'bg-white text-black font-bold border-white shadow'
                          : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-600'
                      }`}
                    >
                      <div className="text-[11px] font-semibold">{preset.labelAr}</div>
                      <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{preset.fee} {organization?.currency || 'ج.م'}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Dates Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-neutral-900/40 border border-neutral-800 rounded-2xl">
                <div>
                  <label className="block font-bold text-white mb-1">
                    {lang === 'ar' ? 'تاريخ بداية الاشتراك *' : 'Subscription Start Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={subscriptionStartDate}
                    onChange={(e) => {
                      setSubscriptionStartDate(e.target.value);
                      setSubscriptionEndDate(computeEndDate(e.target.value, 1));
                    }}
                    className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    {lang === 'ar' ? 'يبدأ احتساب الأيام من هذا التاريخ' : 'Counting begins from this date'}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-amber-400 mb-1">
                    {lang === 'ar' ? 'تاريخ انتهاء الاشتراك وتنبيه التجديد *' : 'Subscription End Date & Renewal Alert *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={subscriptionEndDate}
                    onChange={(e) => setSubscriptionEndDate(e.target.value)}
                    className="w-full bg-black border border-amber-500/60 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-amber-400"
                  />
                  <span className="text-[10px] text-amber-400/90 mt-1 block">
                    {lang === 'ar' ? 'سيصلك إشعار وتنبيه فوري عند حلول هذا التاريخ لتجديد العضوية' : 'System alerts you automatically upon reaching this date'}
                  </span>
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-3">
                <span className="font-bold text-white block text-xs">
                  {lang === 'ar' ? 'المعاملات المالية ورسوم التسجيل:' : 'Financials & Registration Fees:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1">
                      {lang === 'ar' ? 'إجمالي الرسوم المطلوبة' : 'Total Due Fee'}
                    </label>
                    <input
                      type="number"
                      value={initialFee}
                      onChange={(e) => setInitialFee(e.target.value)}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">
                      {lang === 'ar' ? 'المدفوع نقداً الآن (كاش)' : 'Amount Paid Now'}
                    </label>
                    <input
                      type="number"
                      value={paidNow}
                      onChange={(e) => setPaidNow(e.target.value)}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">
                      {lang === 'ar' ? 'المتبقي كمديونية' : 'Remaining Debt'}
                    </label>
                    <div className={`border rounded-xl px-3 py-2 font-mono text-sm font-bold ${
                      calculatedRemaining > 0
                        ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                        : 'bg-black text-emerald-400 border-neutral-800'
                    }`}>
                      {calculatedRemaining.toLocaleString()} {organization?.currency || 'ج.م'}
                    </div>
                  </div>
                </div>

                {calculatedRemaining > 0 && (
                  <p className="text-[11px] text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {lang === 'ar'
                        ? 'سيتم إدراج المشترك تلقائياً في قائمة "المتأخرات والمستحقات" بالشريط الجانبي'
                        : 'Member will automatically be tracked in Unpaid Overdues in Sidebar'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EMERGENCY & HEALTH & NOTES */}
          {activeFormTab === 'emergency' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">
                    {lang === 'ar' ? 'اسم ولي الأمر أو المسؤول' : 'Guardian Name'}
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder={lang === 'ar' ? 'الأب / الأم / الأخ' : 'Guardian Full Name'}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">
                    {lang === 'ar' ? 'هاتف ولي الأمر' : 'Guardian Phone'}
                  </label>
                  <input
                    type="text"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="011xxxxxxxx"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">
                    {lang === 'ar' ? 'رقم طوارئ بديل' : 'Emergency Contact Phone'}
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="012xxxxxxxx"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">
                    {lang === 'ar' ? 'فصيلة الدم' : 'Blood Type'}
                  </label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white text-sm"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1 text-neutral-300">
                    {lang === 'ar' ? 'الحالة الصحية / أي إصابات سابقة' : 'Health Conditions / Medical Notes'}
                  </label>
                  <input
                    type="text"
                    value={healthStatus}
                    onChange={(e) => setHealthStatus(e.target.value)}
                    placeholder={lang === 'ar' ? 'سليم تماماً / حساسية معينة / إصابة ركبة...' : 'e.g. Fit / Asthma / Knee injury'}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1 text-neutral-300">
                    {lang === 'ar' ? 'ملاحظات إدارية عامة' : 'General Administrative Notes'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={lang === 'ar' ? 'ملاحظات إضافية حول المشترك أو الاشتراك...' : 'Any extra notes...'}
                    rows={2}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Footer Buttons */}
          <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2.5">
            <div className="text-[11px] text-neutral-400 font-mono">
              {lang === 'ar' ? `المتبقي: ${calculatedRemaining} ج.م` : `Due: ${calculatedRemaining} EGP`}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-semibold rounded-xl text-xs"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleSubmit(e, false, true)}
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl border border-neutral-700 text-xs"
              >
                {lang === 'ar' ? 'حفظ وإضافة آخر' : 'Save & Add Another'}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleSubmit(e, true, false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'حفظ وعرض كود QR والبطاقة' : 'Save & View QR Card'}</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl shadow text-xs"
              >
                {lang === 'ar' ? 'حفظ المشترك' : 'Save Member'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
