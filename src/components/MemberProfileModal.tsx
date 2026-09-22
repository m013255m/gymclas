import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  User as UserIcon,
  QrCode,
  Award,
  History,
  FileText,
  AlertCircle,
  Plus,
  ArrowRightLeft,
  Download,
  RefreshCw,
  Share2,
  HeartPulse,
  Shield,
  Send,
  Camera,
  Upload,
  Trash2,
  Link2,
  Sparkles,
  Check
} from 'lucide-react';
import {
  AttendanceRecord,
  Group,
  GroupMembershipHistory,
  Member,
  OrganizationConfig,
  Payment,
  PerformanceEvaluation
} from '../types';
import { generateQRCodeDataUrl } from '../lib/qr';
import { dbService } from '../lib/db';
import { getSubscriptionStatus } from '../lib/subscriptions';
import { processMemberPhoto, PRESET_AVATARS } from '../lib/image';

interface MemberProfileModalProps {
  member: Member;
  organization: OrganizationConfig | null;
  groups: Group[];
  onClose: () => void;
  onRecordAttendance: (member: Member) => void;
  onAddPayment: (member: Member) => void;
  lang: 'ar' | 'en';
  onMemberUpdated: () => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member,
  organization,
  groups,
  onClose,
  onRecordAttendance,
  onAddPayment,
  lang,
  onMemberUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'subscription' | 'attendance' | 'payments' | 'performance' | 'notes' | 'timeline' | 'card'>('overview');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [groupHistory, setGroupHistory] = useState<GroupMembershipHistory[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showTransferGroup, setShowTransferGroup] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState('');

  // Member photo editing states
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>(member.photoUrl || '');
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState('');
  const [showProfilePresets, setShowProfilePresets] = useState(false);
  const [showProfileUrlInput, setShowProfileUrlInput] = useState(false);
  const [profileManualUrl, setProfileManualUrl] = useState('');
  const photoFileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync photo if member prop updates
  useEffect(() => {
    setCurrentPhotoUrl(member.photoUrl || '');
  }, [member.photoUrl]);

  // Handle saving new photo to db
  const handleUpdateMemberPhoto = async (newUrl?: string) => {
    try {
      setIsUpdatingPhoto(true);
      setPhotoMessage('');
      await dbService.updateMember(member.id, {
        photoUrl: newUrl,
        updatedAt: new Date().toISOString()
      });
      setCurrentPhotoUrl(newUrl || '');
      setPhotoMessage(lang === 'ar' ? 'تم تحديث الصورة بنجاح' : 'Photo updated successfully');
      onMemberUpdated();
      setTimeout(() => setPhotoMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setPhotoMessage(lang === 'ar' ? 'فشل حفظ الصورة' : 'Failed to save photo');
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  const handleProfilePhotoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUpdatingPhoto(true);
      const compressed = await processMemberPhoto(file);
      await handleUpdateMemberPhoto(compressed);
    } catch (err: any) {
      console.error(err);
      setPhotoMessage(err?.message || (lang === 'ar' ? 'خطأ في معالجة الصورة' : 'Error processing photo'));
      setIsUpdatingPhoto(false);
    } finally {
      if (photoFileInputRef.current) {
        photoFileInputRef.current.value = '';
      }
    }
  };

  // Renewal form modal state
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewFee, setRenewFee] = useState('1500');
  const [renewPaid, setRenewPaid] = useState('1500');
  const [isRenewing, setIsRenewing] = useState(false);

  const currentGroup = groups.find((g) => g.id === member.currentGroupId);
  const subStatus = getSubscriptionStatus(member);

  // Generate QR code and load historical records
  useEffect(() => {
    generateQRCodeDataUrl(member.qrCodeSafeData || `RCN:${member.memberCode}`).then((url) => setQrDataUrl(url));
    const loadData = async () => {
      const allAtt = await dbService.getAttendance();
      setAttendanceRecords(allAtt.filter((a) => a.memberId === member.id));
      const allPay = await dbService.getPayments();
      setPayments(allPay.filter((p) => p.memberId === member.id));
      const allPerf = await dbService.getPerformance(member.id);
      setEvaluations(allPerf);
      const allHist = await dbService.getGroupHistory(member.id);
      setGroupHistory(allHist);
    };
    loadData();
  }, [member]);

  // Handle member group transfer with historical logging
  const handleTransferGroup = async () => {
    if (!targetGroupId || targetGroupId === member.currentGroupId) return;
    const targetGroup = groups.find((g) => g.id === targetGroupId);
    const historyRecord: GroupMembershipHistory = {
      id: 'gh_' + Date.now(),
      memberId: member.id,
      previousGroupId: member.currentGroupId,
      previousGroupName: currentGroup?.name || (lang === 'ar' ? 'بدون مجموعة' : 'No Group'),
      newGroupId: targetGroupId,
      newGroupName: targetGroup?.name || targetGroupId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      changedBy: 'المدير العام',
      reason: 'نقل إداري للمشترك'
    };
    await dbService.addGroupHistory(historyRecord);

    const updated: Member = {
      ...member,
      currentGroupId: targetGroupId
    };
    await dbService.saveMember(updated);
    setShowTransferGroup(false);
    onMemberUpdated();
  };

  // Handle subscription renewal
  const handleRenewSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRenewing(true);
    try {
      const fee = parseFloat(renewFee) || 0;
      const paid = parseFloat(renewPaid) || 0;
      const addedBalance = Math.max(0, fee - paid);

      // Calculate new end date based on either current end date (if still in future) or today
      const baseDate = member.subscriptionEndDate && new Date(member.subscriptionEndDate) > new Date()
        ? new Date(member.subscriptionEndDate)
        : new Date();

      baseDate.setMonth(baseDate.getMonth() + renewMonths);
      const newEndDate = baseDate.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];

      const updatedMember: Member = {
        ...member,
        subscriptionEndDate: newEndDate,
        subscriptionPlan: renewMonths === 1 ? 'اشتراك شهري (تجديد)' : `تجديد اشتراك (${renewMonths} أشهر)`,
        totalDue: (member.totalDue || 0) + fee,
        totalPaid: (member.totalPaid || 0) + paid,
        balance: (member.balance || 0) + addedBalance,
        status: 'active',
        updatedAt: new Date().toISOString()
      };

      await dbService.saveMember(updatedMember);

      // Record payment receipt if paid > 0
      if (paid > 0) {
        await dbService.addPayment({
          id: 'pay_' + Date.now(),
          receiptNumber: `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
          memberId: member.id,
          memberName: member.fullName,
          memberCode: member.memberCode,
          amount: paid,
          date: todayStr,
          time: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
          method: 'cash',
          notes: `سداد تجديد اشتراك حتى ${newEndDate}`,
          recordedBy: 'المدير العام',
          previousBalance: member.balance || 0,
          remainingBalance: updatedMember.balance || 0,
          createdAt: new Date().toISOString()
        });
      }

      setIsRenewing(false);
      setShowRenewModal(false);
      onMemberUpdated();
      alert(lang === 'ar' ? `تم تجديد الاشتراك بنجاح حتى تاريخ ${newEndDate}` : `Subscription renewed until ${newEndDate}`);
    } catch (err: any) {
      console.error(err);
      setIsRenewing(false);
      alert(err?.message || 'خطأ أثناء التجديد');
    }
  };

  // Add note to member
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const existing = member.notes ? `${member.notes}\n• [${new Date().toLocaleDateString()}]: ${newNote.trim()}` : `• [${new Date().toLocaleDateString()}]: ${newNote.trim()}`;
    await dbService.saveMember({ ...member, notes: existing });
    member.notes = existing;
    setNewNote('');
    onMemberUpdated();
  };

  // Download QR Code PNG Image directly
  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `QR_${member.memberCode}_${member.fullName.replace(/\s+/g, '_')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  // Download Full ID Card as image
  const handleDownloadCard = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 650;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 650, 420);

    // Outer Border
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(6, 6, 638, 408);

    // Top Header band
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(10, 10, 630, 62);

    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial, Cairo, sans-serif';
    ctx.fillText(organization?.name || 'RCN MANAGER', 30, 48);

    ctx.fillStyle = '#a3a3a3';
    ctx.font = '13px Arial, Cairo, sans-serif';
    ctx.fillText('بطاقة عضوية رسمية - Official Member ID', 350, 46);

    // Member Name & Code
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial, Cairo, sans-serif';
    ctx.fillText(member.fullName, 30, 125);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#404040';
    ctx.fillText(`ID: ${member.memberCode}`, 30, 155);

    // Details list
    ctx.font = '15px Arial, Cairo, sans-serif';
    ctx.fillStyle = '#171717';
    ctx.fillText(`المجموعة: ${currentGroup?.name || 'بدون مجموعة'}`, 30, 195);
    ctx.fillText(`الهاتف: ${member.phone}`, 30, 230);
    if (member.subscriptionEndDate) {
      ctx.fillText(`صالح حتى: ${member.subscriptionEndDate}`, 30, 265);
    }

    // Draw QR Code
    if (qrDataUrl) {
      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, 450, 100, 160, 160);

        // Footer Band
        ctx.fillStyle = '#000000';
        ctx.fillRect(10, 360, 630, 48);
        ctx.fillStyle = '#ffffff';
        ctx.font = '13px Arial, Cairo, sans-serif';
        ctx.fillText('صالح للاستخدام الرسمي والمطابقة الرقمية السريعة عبر الباركود', 30, 390);

        const link = document.createElement('a');
        link.download = `IDCard_${member.memberCode}_${member.fullName.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      qrImg.src = qrDataUrl;
      return;
    }

    const link = document.createElement('a');
    link.download = `IDCard_${member.memberCode}_${member.fullName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const presentCount = attendanceRecords.filter((a) => a.status === 'present').length;
  const absentCount = attendanceRecords.filter((a) => a.status === 'absent').length;
  const lateCount = attendanceRecords.filter((a) => a.status === 'late').length;
  const totalAtt = presentCount + absentCount + lateCount;
  const attRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 100;
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  // Clean phone for WhatsApp
  const cleanPhone = member.phone ? member.phone.replace(/[^0-9]/g, '') : '';
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone}?text=${encodeURIComponent(
        `مرحباً بك كابتن ${member.fullName}، كود عضويتك هو: ${member.memberCode} لدى ${organization?.name || 'النادي'}.`
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 md:p-6 overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-white">
        {/* Header Bar with Photo, Name, Code, Status & Quick Action Buttons */}
        <div className="p-4 md:p-5 border-b border-neutral-800 bg-neutral-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Interactive Avatar with Photo Upload */}
            <div className="relative group shrink-0">
              <img
                src={currentPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=222&color=fff`}
                alt={member.fullName}
                className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover border-2 border-neutral-700 shadow shrink-0"
              />
              <button
                type="button"
                onClick={() => photoFileInputRef.current?.click()}
                title={lang === 'ar' ? 'تغيير الصورة' : 'Change photo'}
                className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition cursor-pointer"
              >
                <Camera className="w-5 h-5 text-white" />
                <span className="text-[9px] text-white font-medium">
                  {lang === 'ar' ? 'تعديل' : 'Edit'}
                </span>
              </button>

              {isUpdatingPhoto && (
                <div className="absolute inset-0 bg-black/75 rounded-2xl flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <input
              type="file"
              ref={photoFileInputRef}
              accept="image/*"
              onChange={handleProfilePhotoFileSelect}
              className="hidden"
            />

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg md:text-xl font-bold text-white">{member.fullName}</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                  member.status === 'active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {member.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                </span>
                {/* Subscription Expiry Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${subStatus.badgeClass}`}>
                  {lang === 'ar' ? subStatus.labelAr : subStatus.labelEn}
                </span>
              </div>
              <div className="text-xs text-neutral-400 font-mono mt-1 flex flex-wrap items-center gap-2">
                <span className="text-white font-bold">{member.memberCode}</span>
                <span>•</span>
                <span>{currentGroup?.name || (lang === 'ar' ? 'بدون مجموعة' : 'No Group')}</span>
                <span>•</span>
                <span>{member.phone}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Close */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => onRecordAttendance(member)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تسجيل حضور' : 'Attendance'}</span>
            </button>
            <button
              type="button"
              onClick={() => onAddPayment(member)}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>{lang === 'ar' ? 'سداد دفعة' : 'Payment'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowRenewModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تجديد الاشتراك' : 'Renew'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('card')}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 transition"
            >
              <QrCode className="w-4 h-4" />
              <span>{lang === 'ar' ? 'الكارت و QR' : 'Card / QR'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Tabs Navigation */}
        <div className="flex items-center gap-1 px-4 border-b border-neutral-800 bg-neutral-950 overflow-x-auto text-xs">
          {[
            { id: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview' },
            { id: 'personal', labelAr: 'البيانات الشخصية', labelEn: 'Personal Info' },
            { id: 'subscription', labelAr: 'بيانات وتجديد الاشتراك', labelEn: 'Subscription' },
            { id: 'attendance', labelAr: `سجل الحضور (${attendanceRecords.length})`, labelEn: `Attendance (${attendanceRecords.length})` },
            { id: 'payments', labelAr: `المدفوعات (${payments.length})`, labelEn: `Payments (${payments.length})` },
            { id: 'card', labelAr: 'كود QR وطباعة الكارت', labelEn: 'QR & ID Card' },
            { id: 'performance', labelAr: `التقييمات (${evaluations.length})`, labelEn: `Performance (${evaluations.length})` },
            { id: 'notes', labelAr: 'الملاحظات', labelEn: 'Notes' },
            { id: 'timeline', labelAr: 'سجل الحركات', labelEn: 'Timeline' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-3 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-white text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {lang === 'ar' ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="p-4 md:p-5 flex-1 overflow-y-auto space-y-5 text-sm">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Subscription Status Card */}
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-sm text-white">
                      {lang === 'ar' ? 'حالة الاشتراك وموعد التجديد:' : 'Subscription & Renewal Date:'}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${subStatus.badgeClass}`}>
                      {lang === 'ar' ? subStatus.labelAr : subStatus.labelEn}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-1.5 flex flex-wrap gap-4 font-mono">
                    <span>{lang === 'ar' ? 'البداية:' : 'Start:'} <strong className="text-white">{member.subscriptionStartDate || member.registrationDate}</strong></span>
                    <span>{lang === 'ar' ? 'الانتهاء:' : 'Expires:'} <strong className="text-amber-400">{member.subscriptionEndDate || 'غير محدد'}</strong></span>
                    <span>{lang === 'ar' ? 'الخطة:' : 'Plan:'} <strong className="text-neutral-200">{member.subscriptionPlan || 'اشتراك شهري'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRenewModal(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 transition shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تجديد الاشتراك الآن' : 'Renew Subscription'}</span>
                  </button>
                </div>
              </div>

              {/* Top KPI Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <span className="text-xs text-neutral-400 block">{lang === 'ar' ? 'تاريخ التسجيل' : 'Registration Date'}</span>
                  <span className="font-mono font-bold text-white text-base mt-1 block">{member.registrationDate}</span>
                </div>
                <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <span className="text-xs text-neutral-400 block">{lang === 'ar' ? 'إجمالي المدفوع' : 'Total Paid'}</span>
                  <span className="font-mono font-bold text-white text-base mt-1 block">
                    {totalPaid.toLocaleString()} {organization?.currency || 'ج.م'}
                  </span>
                </div>
                <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <span className="text-xs text-neutral-400 block">{lang === 'ar' ? 'المتبقي (المستحقات)' : 'Balance'}</span>
                  <span className={`font-mono font-bold text-base mt-1 block ${member.balance && member.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {(member.balance || 0).toLocaleString()} {organization?.currency || 'ج.م'}
                  </span>
                </div>
                <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <span className="text-xs text-neutral-400 block">{lang === 'ar' ? 'نسبة الالتزام' : 'Attendance Rate'}</span>
                  <span className="font-mono font-bold text-white text-base mt-1 block">{attRate}%</span>
                </div>
              </div>

              {/* Group Transfer Card */}
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-neutral-400 block">{lang === 'ar' ? 'المجموعة الحالية:' : 'Current Group:'}</span>
                  <span className="font-bold text-white text-base">{currentGroup?.name || 'بدون مجموعة'}</span>
                  <p className="text-xs text-neutral-400 mt-0.5">{currentGroup?.schedule || ''}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTransferGroup(!showTransferGroup)}
                  className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto border border-neutral-700 transition"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'نقل لمجموعة أخرى' : 'Transfer Group'}</span>
                </button>
              </div>

              {showTransferGroup && (
                <div className="p-4 bg-black border border-neutral-700 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-white block">
                    {lang === 'ar' ? 'اختر المجموعة الجديدة للتحويل:' : 'Select New Group:'}
                  </span>
                  <div className="flex gap-2">
                    <select
                      value={targetGroupId}
                      onChange={(e) => setTargetGroupId(e.target.value)}
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">{lang === 'ar' ? '-- اختر المجموعة --' : '-- Select Group --'}</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.instructorName})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleTransferGroup}
                      className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200"
                    >
                      {lang === 'ar' ? 'تأكيد النقل' : 'Confirm Transfer'}
                    </button>
                  </div>
                </div>
              )}

              {/* Attendance & Payments Snapshot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2">
                  <h3 className="font-bold text-xs text-neutral-300 flex items-center justify-between">
                    <span>{lang === 'ar' ? 'آخر الحصص المسجلة' : 'Recent Attendance'}</span>
                    <button onClick={() => setActiveTab('attendance')} className="text-neutral-400 hover:text-white underline text-[11px]">
                      {lang === 'ar' ? 'عرض الكل' : 'All'}
                    </button>
                  </h3>
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.slice(0, 3).map((a) => (
                      <div key={a.id} className="p-2 rounded bg-black/50 border border-neutral-800 text-xs flex justify-between">
                        <span>{a.date} ({a.time})</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          a.status === 'present' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                        }`}>
                          {a.status === 'present' ? 'حاضر' : a.status === 'absent' ? 'غائب' : a.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-500">{lang === 'ar' ? 'لا توجد تسجيلات بعد' : 'No records yet'}</p>
                  )}
                </div>

                <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2">
                  <h3 className="font-bold text-xs text-neutral-300 flex items-center justify-between">
                    <span>{lang === 'ar' ? 'آخر الإيصالات المسددة' : 'Recent Payments'}</span>
                    <button onClick={() => setActiveTab('payments')} className="text-neutral-400 hover:text-white underline text-[11px]">
                      {lang === 'ar' ? 'عرض الكل' : 'All'}
                    </button>
                  </h3>
                  {payments.length > 0 ? (
                    payments.slice(0, 3).map((p) => (
                      <div key={p.id} className="p-2 rounded bg-black/50 border border-neutral-800 text-xs flex justify-between">
                        <div>
                          <span className="font-semibold block">{p.amount} {organization?.currency || 'ج.م'}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">{p.receiptNumber} • {p.date}</span>
                        </div>
                        <span className="text-emerald-400 text-[11px] self-center font-bold">مسدد</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-500">{lang === 'ar' ? 'لا توجد دفعات بعد' : 'No payments yet'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL INFO */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              {/* Photo Management Card */}
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-neutral-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-sky-400" />
                    <h3 className="font-bold text-white text-sm">
                      {lang === 'ar' ? 'إدارة وتحديث الصورة الشخصية للمشترك' : 'Member Personal Photo'}
                    </h3>
                  </div>
                  {photoMessage && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      {photoMessage}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar Display */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-neutral-700 bg-neutral-950 flex items-center justify-center shadow-lg relative">
                      <img
                        src={currentPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=222&color=fff`}
                        alt={member.fullName}
                        className="w-full h-full object-cover"
                      />
                      {isUpdatingPhoto && (
                        <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex-1 space-y-2 text-center sm:text-start w-full">
                    <p className="text-xs text-neutral-400">
                      {lang === 'ar'
                        ? 'يمكنك تغيير صورة المشترك أو رفع صورة جديدة من جهازك أو استخدام رابط مباشر، لتظهر في الكارت الذكي وسجلات الحضور.'
                        : 'Change or upload a new photo from your device or use an image URL to appear on ID cards and attendance logs.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => photoFileInputRef.current?.click()}
                        disabled={isUpdatingPhoto}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center gap-1.5 transition shadow"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'رفع صورة من جهازك' : 'Upload Photo'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileUrlInput(!showProfileUrlInput);
                          setShowProfilePresets(false);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 border border-neutral-700 transition"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'رابط صورة (URL)' : 'Photo URL'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowProfilePresets(!showProfilePresets);
                          setShowProfileUrlInput(false);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 border border-neutral-700 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{lang === 'ar' ? 'صور رمزية جاهزة' : 'Sample Avatars'}</span>
                      </button>

                      {currentPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => handleUpdateMemberPhoto(undefined)}
                          disabled={isUpdatingPhoto}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-medium flex items-center gap-1 border border-rose-800/60 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'حذف الصورة' : 'Remove Photo'}</span>
                        </button>
                      )}
                    </div>

                    {/* Manual URL input */}
                    {showProfileUrlInput && (
                      <div className="pt-1.5 flex items-center gap-2 animate-in fade-in">
                        <input
                          type="url"
                          value={profileManualUrl}
                          onChange={(e) => setProfileManualUrl(e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (profileManualUrl.trim()) {
                              handleUpdateMemberPhoto(profileManualUrl.trim());
                              setProfileManualUrl('');
                              setShowProfileUrlInput(false);
                            }
                          }}
                          className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition"
                        >
                          {lang === 'ar' ? 'تطبيق' : 'Apply'}
                        </button>
                      </div>
                    )}

                    {/* Presets */}
                    {showProfilePresets && (
                      <div className="pt-1.5 animate-in fade-in">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {PRESET_AVATARS.map((av) => (
                            <button
                              key={av.id}
                              type="button"
                              onClick={() => {
                                handleUpdateMemberPhoto(av.url);
                                setShowProfilePresets(false);
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-white block border-b border-neutral-800 pb-2">
                    {lang === 'ar' ? 'بيانات الهوية والتواصل' : 'Identification & Contact'}
                  </span>
                  <div className="text-xs space-y-2.5 text-neutral-300">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{lang === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                      <span className="font-mono text-white">{member.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{lang === 'ar' ? 'الرقم القومي / إثبات الهوية:' : 'National ID:'}</span>
                      <span className="font-mono text-white">{member.nationalId || 'غير مسجل'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{lang === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</span>
                      <span className="font-mono text-white">{member.email || 'غير مسجل'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{lang === 'ar' ? 'العنوان ومحل الإقامة:' : 'Address:'}</span>
                      <span>{member.address || 'القاهرة - مصر'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{lang === 'ar' ? 'تاريخ الميلاد:' : 'Date of Birth:'}</span>
                      <span className="font-mono">{member.dateOfBirth || '2008-05-15'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{lang === 'ar' ? 'النوع:' : 'Gender:'}</span>
                      <span>{member.gender === 'female' ? 'أنثى' : 'ذكر'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-white block border-b border-neutral-800 pb-2">
                    {lang === 'ar' ? 'بيانات ولي الأمر والطوارئ والصحة' : 'Guardian, Emergency & Health'}
                  </span>
                  <div className="text-xs space-y-2.5 text-neutral-300">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{lang === 'ar' ? 'اسم ولي الأمر:' : 'Guardian Name:'}</span>
                      <span className="font-semibold text-white">{member.guardianName || 'غير مسجل'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{lang === 'ar' ? 'هاتف ولي الأمر:' : 'Guardian Phone:'}</span>
                      <span className="font-mono text-white">{member.guardianPhone || 'غير مسجل'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{lang === 'ar' ? 'هاتف طوارئ بديل:' : 'Emergency Contact:'}</span>
                      <span className="font-mono text-white">{member.emergencyContact || 'غير مسجل'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{lang === 'ar' ? 'فصيلة الدم:' : 'Blood Type:'}</span>
                      <span className="font-mono font-bold text-red-400">{member.bloodType || 'O+'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{lang === 'ar' ? 'الحالة الصحية:' : 'Health Status:'}</span>
                      <span className="text-white">{member.healthStatus || 'سليم / لا توجد موانع'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUBSCRIPTION & RENEWAL */}
          {activeTab === 'subscription' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">{lang === 'ar' ? 'بيانات الاشتراك الحالية' : 'Current Subscription'}</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">{member.subscriptionPlan || 'اشتراك منتظم'}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-xl font-bold ${subStatus.badgeClass}`}>
                    {lang === 'ar' ? subStatus.labelAr : subStatus.labelEn}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <div className="p-3 bg-black/60 rounded-xl border border-neutral-800">
                    <span className="text-neutral-400 block">{lang === 'ar' ? 'تاريخ بداية الاشتراك' : 'Start Date'}</span>
                    <span className="font-mono font-bold text-white text-sm mt-1 block">{member.subscriptionStartDate || member.registrationDate}</span>
                  </div>
                  <div className="p-3 bg-black/60 rounded-xl border border-neutral-800">
                    <span className="text-neutral-400 block">{lang === 'ar' ? 'تاريخ نهاية الاشتراك' : 'End Date'}</span>
                    <span className="font-mono font-bold text-amber-400 text-sm mt-1 block">{member.subscriptionEndDate || 'غير محدد'}</span>
                  </div>
                  <div className="p-3 bg-black/60 rounded-xl border border-neutral-800">
                    <span className="text-neutral-400 block">{lang === 'ar' ? 'الأيام المتبقية' : 'Days Remaining'}</span>
                    <span className="font-mono font-bold text-white text-sm mt-1 block">
                      {subStatus.daysRemaining > 0 ? `${subStatus.daysRemaining} يوم` : subStatus.daysRemaining === 0 ? 'ينتهي اليوم' : `منتهي منذ ${Math.abs(subStatus.daysRemaining)} يوم`}
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRenewModal(true)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs flex items-center gap-2 shadow"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'تجديد الاشتراك وتحديث الصلاحية' : 'Renew Subscription'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE HISTORY */}
          {activeTab === 'attendance' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {lang === 'ar' ? 'سجل الحضور الكامل' : 'Attendance History'}
                </span>
                <button
                  type="button"
                  onClick={() => onRecordAttendance(member)}
                  className="px-3 py-1 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200"
                >
                  + {lang === 'ar' ? 'تسجيل حضور جديد' : 'New Attendance'}
                </button>
              </div>

              <div className="border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-start">
                  <thead className="bg-neutral-900 text-neutral-400">
                    <tr>
                      <th className="p-2.5 text-start font-semibold">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                      <th className="p-2.5 text-start font-semibold">{lang === 'ar' ? 'الوقت' : 'Time'}</th>
                      <th className="p-2.5 text-start font-semibold">{lang === 'ar' ? 'الحصة / المجموعة' : 'Session'}</th>
                      <th className="p-2.5 text-start font-semibold">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th className="p-2.5 text-start font-semibold">{lang === 'ar' ? 'المسجل' : 'Recorded By'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {attendanceRecords.map((a) => (
                      <tr key={a.id} className="hover:bg-neutral-900/50">
                        <td className="p-2.5 font-mono text-white">{a.date}</td>
                        <td className="p-2.5 font-mono text-neutral-400">{a.time}</td>
                        <td className="p-2.5 text-neutral-300">{a.sessionTitle || a.groupName || 'حصة عامة'}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.status === 'present'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : a.status === 'late'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {a.status === 'present' ? 'حاضر' : a.status === 'absent' ? 'غائب' : a.status === 'late' ? 'متأخر' : 'مبرر'}
                          </span>
                        </td>
                        <td className="p-2.5 text-neutral-400">{a.recordedBy || 'المدير'}</td>
                      </tr>
                    ))}
                    {attendanceRecords.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-neutral-500">
                          {lang === 'ar' ? 'لا توجد تسجيلات بعد' : 'No records yet'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS HISTORY */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {lang === 'ar' ? 'سجل المدفوعات والإيصالات' : 'Payment History'}
                </span>
                <button
                  type="button"
                  onClick={() => onAddPayment(member)}
                  className="px-3 py-1 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200"
                >
                  + {lang === 'ar' ? 'سداد دفعة جديدة' : 'Add Payment'}
                </button>
              </div>

              <div className="border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-start">
                  <thead className="bg-neutral-900 text-neutral-400">
                    <tr>
                      <th className="p-2.5 text-start font-semibold">{lang === 'ar' ? 'رقم الإيصال' : 'Receipt #'}</th>
                      <th className="p-2.5 text-start font-semibold">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                      <th className="p-2.5 text-start font-semibold">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                      <th className="p-2.5 text-start font-semibold">{lang === 'ar' ? 'طريقة السداد' : 'Method'}</th>
                      <th className="p-2.5 text-start font-semibold">{lang === 'ar' ? 'المسؤول' : 'Admin'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-900/50">
                        <td className="p-2.5 font-mono text-white font-bold">{p.receiptNumber}</td>
                        <td className="p-2.5 font-mono text-white font-bold">{p.amount.toLocaleString()} {organization?.currency || 'ج.م'}</td>
                        <td className="p-2.5 font-mono text-neutral-400">{p.date}</td>
                        <td className="p-2.5 text-neutral-300">
                          {p.method === 'cash' ? 'نقدي (كاش)' : p.method === 'transfer' ? 'تحويل' : 'بطاقة'}
                        </td>
                        <td className="p-2.5 text-neutral-400">{p.recordedBy}</td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-neutral-500">
                          {lang === 'ar' ? 'لا توجد دفعات' : 'No payments'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: PRINTABLE ID CARD & DOWNLOADABLE QR */}
          {activeTab === 'card' && (
            <div className="space-y-5 flex flex-col items-center">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-white block">
                  {lang === 'ar' ? 'بطاقة العضوية الرسمية وكود الـ QR الذكي' : 'Official Member ID Card & QR Code'}
                </span>
                <p className="text-neutral-400 text-xs">
                  {lang === 'ar' ? 'يمكنك طباعة البطاقة مباشرة، أو تحميل صورة كود QR، أو تحميل البطاقة كاملة كصورة' : 'Print the card, download high-res QR code PNG, or export the card image'}
                </p>
              </div>

              {/* Physical Card Mockup with crisp professional styling */}
              <div
                id="printable-member-card"
                className="w-full max-w-sm bg-white text-black p-5 rounded-2xl border-2 border-black shadow-2xl space-y-4 relative overflow-hidden"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <div>
                    <h3 className="font-black text-base uppercase tracking-wider">{organization?.name || 'RCN MANAGER'}</h3>
                    <span className="text-[10px] text-neutral-600 font-bold block">{organization?.subName || 'نظام إدارة شامل'}</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-black text-white font-black text-xs flex items-center justify-center">
                    RCN
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex gap-3 items-center">
                  <img
                    src={currentPhotoUrl || member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=000&color=fff`}
                    alt={member.fullName}
                    className="w-20 h-20 rounded-xl object-cover border-2 border-black shrink-0"
                  />
                  <div className="text-xs space-y-1 text-black font-semibold">
                    <div className="font-black text-sm text-black">{member.fullName}</div>
                    <div className="font-mono text-neutral-800 font-bold">{member.memberCode}</div>
                    <div className="text-[11px] text-neutral-700">{currentGroup?.name || 'بدون مجموعة'}</div>
                    <div className="text-[10px] text-neutral-600 font-mono">{member.phone}</div>
                    {member.subscriptionEndDate && (
                      <div className="text-[10px] text-neutral-800 font-mono font-bold">
                        صالح حتى: {member.subscriptionEndDate}
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="flex items-center justify-between border-t-2 border-black pt-3">
                  <div className="text-start">
                    <span className="text-[9px] font-bold text-neutral-600 uppercase block">Safe QR Code</span>
                    <span className="text-[11px] font-mono font-black">{member.memberCode}</span>
                    <span className="text-[9px] text-emerald-700 font-bold block">✓ Verified Active Member</span>
                  </div>
                  {qrDataUrl && (
                    <img src={qrDataUrl} alt="QR Code" className="w-16 h-16 border-2 border-black p-0.5 rounded-lg shrink-0" />
                  )}
                </div>
              </div>

              {/* Action Buttons: Print, Download QR, Download Card, Send WhatsApp */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-white text-black font-bold text-xs rounded-xl shadow hover:bg-neutral-200 flex items-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'طباعة البطاقة' : 'Print Card'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تحميل كود QR (صورة PNG)' : 'Download QR Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCard}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl border border-neutral-700 flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تحميل البطاقة كصورة' : 'Download ID Card'}</span>
                </button>

                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-semibold text-xs rounded-xl flex items-center gap-2 transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'إرسال بيانات الكارت بالواتساب' : 'Send via WhatsApp'}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-white block">
                {lang === 'ar' ? 'سجل التقييمات ومستوى الأداء' : 'Performance & Evaluations'}
              </span>
              <div className="space-y-2">
                {evaluations.map((ev) => (
                  <div key={ev.id} className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{ev.category}</span>
                      <span className="font-mono font-bold text-white px-2 py-0.5 bg-neutral-800 rounded">
                        {ev.score} / 100 ({ev.rating})
                      </span>
                    </div>
                    <div className="text-neutral-400 text-[11px] flex justify-between">
                      <span>{lang === 'ar' ? `المقيم: ${ev.evaluator}` : `Evaluator: ${ev.evaluator}`}</span>
                      <span className="font-mono">{ev.date}</span>
                    </div>
                    {ev.notes && <p className="text-neutral-300 text-[11px] pt-1">{ev.notes}</p>}
                  </div>
                ))}
                {evaluations.length === 0 && (
                  <p className="text-xs text-neutral-500 text-center py-6">
                    {lang === 'ar' ? 'لا توجد تقييمات بعد' : 'No evaluations yet'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-white block">
                {lang === 'ar' ? 'الملاحظات الإدارية والسلوكية' : 'Member Notes & Remarks'}
              </span>
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl min-h-[100px] text-xs whitespace-pre-wrap text-neutral-300">
                {member.notes || (lang === 'ar' ? 'لا توجد ملاحظات مسجلة' : 'No notes')}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={lang === 'ar' ? 'أضف ملاحظة جديدة...' : 'Add a note...'}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-white text-black font-semibold rounded-lg text-xs hover:bg-neutral-200"
                >
                  {lang === 'ar' ? 'إضافة' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 9: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-white block">
                {lang === 'ar' ? 'سجل الحركات والتنقلات' : 'Full Activity Timeline'}
              </span>
              <div className="space-y-3 border-s-2 border-neutral-800 ps-4 text-xs">
                {groupHistory.map((gh) => (
                  <div key={gh.id} className="relative">
                    <span className="absolute -start-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white" />
                    <div className="font-bold text-white">
                      تم النقل من {gh.previousGroupName} إلى {gh.newGroupName}
                    </div>
                    <div className="text-neutral-500 text-[10px] font-mono">{gh.date} • {gh.changedBy}</div>
                  </div>
                ))}
                <div className="relative">
                  <span className="absolute -start-[21px] top-1 w-2.5 h-2.5 rounded-full bg-neutral-600" />
                  <div className="font-bold text-white">تسجيل العضو في النظام</div>
                  <div className="text-neutral-500 text-[10px] font-mono">{member.registrationDate} • النظام</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RENEWAL MODAL POPUP */}
      {showRenewModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-700 rounded-2xl p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  {lang === 'ar' ? `تجديد اشتراك: ${member.fullName}` : `Renew: ${member.fullName}`}
                </h3>
              </div>
              <button onClick={() => setShowRenewModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenewSubscription} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1.5 font-semibold">
                  {lang === 'ar' ? 'مدة التجديد المطلوبة:' : 'Renewal Duration:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'شهر (30 يوم)', months: 1, fee: '1500' },
                    { label: '3 أشهر', months: 3, fee: '4000' },
                    { label: '6 أشهر', months: 6, fee: '7500' },
                    { label: 'سنة كاملة', months: 12, fee: '14000' }
                  ].map((p) => (
                    <button
                      key={p.months}
                      type="button"
                      onClick={() => {
                        setRenewMonths(p.months);
                        setRenewFee(p.fee);
                        setRenewPaid(p.fee);
                      }}
                      className={`p-2 rounded-xl border text-center transition ${
                        renewMonths === p.months
                          ? 'bg-white text-black font-bold border-white'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-800'
                      }`}
                    >
                      <div>{p.label}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{p.fee} ج.م</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-neutral-400 mb-1">
                    {lang === 'ar' ? 'رسوم التجديد' : 'Fee'}
                  </label>
                  <input
                    type="number"
                    value={renewFee}
                    onChange={(e) => setRenewFee(e.target.value)}
                    className="w-full bg-black border border-neutral-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">
                    {lang === 'ar' ? 'المسدد نقداً الآن' : 'Paid Now'}
                  </label>
                  <input
                    type="number"
                    value={renewPaid}
                    onChange={(e) => setRenewPaid(e.target.value)}
                    className="w-full bg-black border border-neutral-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between text-neutral-400">
                <span>{lang === 'ar' ? 'تاريخ الانتهاء الجديد المتوقع:' : 'Expected Expiry:'}</span>
                <span className="font-mono font-bold text-amber-400">
                  {(() => {
                    const d = member.subscriptionEndDate && new Date(member.subscriptionEndDate) > new Date()
                      ? new Date(member.subscriptionEndDate)
                      : new Date();
                    d.setMonth(d.getMonth() + renewMonths);
                    return d.toISOString().split('T')[0];
                  })()}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="px-4 py-2 bg-neutral-900 text-neutral-400 rounded-xl font-semibold hover:bg-neutral-800"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isRenewing}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl shadow"
                >
                  {isRenewing ? (lang === 'ar' ? 'جاري التجديد...' : 'Renewing...') : (lang === 'ar' ? 'تأكيد التجديد الآن' : 'Confirm Renewal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
