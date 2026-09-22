import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  CreditCard,
  Volume2,
  VolumeX,
  Keyboard,
  Eye
} from 'lucide-react';
import jsQR from 'jsqr';
import { AttendanceRecord, Group, Member, OrganizationConfig } from '../types';
import { dbService } from '../lib/db';
import { playScanSound } from '../lib/qr';

interface QRScannerViewProps {
  members: Member[];
  groups: Group[];
  organization: OrganizationConfig | null;
  lang: 'ar' | 'en';
  onSelectMember: (m: Member) => void;
  onRefresh: () => void;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({
  members,
  groups,
  organization,
  lang,
  onSelectMember,
  onRefresh
}) => {
  const [isScanning, setIsScanning] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedMember, setLastScannedMember] = useState<Member | null>(null);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{ member: Member; time: string; status: string }>>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize camera
  useEffect(() => {
    let active = true;
    async function startCamera() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err: any) {
        console.warn('Camera access error:', err);
        setCameraError(lang === 'ar' ? 'تعذر تشغيل الكاميرا (يمكنك إدخال الكود يدوياً أو بماسح الباركود)' : 'Camera not accessible. You can use manual or USB scanner.');
      }
    }

    if (isScanning) {
      startCamera();
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScanning, lang]);

  // Frame processing loop with jsQR
  useEffect(() => {
    let lastScanTime = 0;
    const scanLoop = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        if (canvas) {
          const video = videoRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            });

            if (code && Date.now() - lastScanTime > 2500) {
              lastScanTime = Date.now();
              handleCodeScanned(code.data);
            }
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(scanLoop);
    };

    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(scanLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScanning, members]);

  // Process Scanned Data
  const handleCodeScanned = async (rawData: string) => {
    const cleanData = rawData.trim();
    // Support formats: "RCN:RCN-000152", "RCN-000152", or raw code
    const memberCode = cleanData.replace('RCN:', '').trim();
    const matched = members.find(
      (m) =>
        m.memberCode.toLowerCase() === memberCode.toLowerCase() ||
        m.qrCodeSafeData === cleanData ||
        m.phone === cleanData
    );

    if (!matched) {
      if (soundEnabled) playScanSound('error');
      setScanMessage({
        type: 'error',
        text: lang === 'ar' ? `كود غير مسجل: ${cleanData}` : `Unknown code: ${cleanData}`
      });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    const group = groups.find((g) => g.id === matched.currentGroupId);

    // Record attendance in IndexedDB
    const record: AttendanceRecord = {
      id: `att_${todayStr}_${matched.id}`,
      memberId: matched.id,
      memberName: matched.fullName,
      memberCode: matched.memberCode,
      groupId: matched.currentGroupId || '',
      groupName: group?.name || '',
      date: todayStr,
      time: timeNow,
      status: 'present',
      recordedBy: 'ماسح الـ QR',
      createdAt: new Date().toISOString()
    };
    await dbService.recordAttendance(record);

    if (soundEnabled) playScanSound('success');
    setLastScannedMember(matched);

    let statusText = lang === 'ar' ? 'تم تسجيل الحضور بنجاح' : 'Attendance recorded successfully';
    if (matched.balance && matched.balance > 0) {
      statusText += ` (تنبيه: متبقي مستحقات ${matched.balance} ${organization?.currency || 'ج.م'})`;
    }

    setScanMessage({
      type: matched.balance && matched.balance > 0 ? 'warning' : 'success',
      text: statusText
    });

    setScanHistory((prev) => [
      { member: matched, time: timeNow, status: 'حاضر' },
      ...prev.slice(0, 9)
    ]);

    onRefresh();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeScanned(manualCode);
    setManualCode('');
  };

  return (
    <div className="space-y-5 animate-in fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">{lang === 'ar' ? 'ماسح الـ QR الذكي' : 'QR Attendance Scanner'}</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {lang === 'ar' ? 'تحضير فوري عبر الكاميرا أو قارئ الباركود مع التنبيه الصوتي' : 'Scan member card using camera or barcode scanner'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white"
            title={soundEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left/Main Column: Camera Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col items-center justify-center">
            {/* Camera Frame Container */}
            <div className="relative w-full max-w-md aspect-video sm:aspect-square bg-black rounded-2xl overflow-hidden border-2 border-neutral-700 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Target Scan Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-52 h-52 border-2 border-white/60 rounded-2xl relative flex items-center justify-center">
                  <div className="w-full h-0.5 bg-white shadow-[0_0_12px_#ffffff] animate-pulse" />
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />
                </div>
              </div>

              {cameraError && (
                <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center text-xs space-y-3">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                  <p className="text-neutral-300 max-w-xs">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setIsScanning(false)}
                    className="px-3 py-1.5 bg-neutral-800 rounded-lg text-white"
                  >
                    إيقاف المحاولة
                  </button>
                </div>
              )}
            </div>

            {/* Manual Scanner Barcode Gun Input */}
            <form onSubmit={handleManualSubmit} className="w-full max-w-md mt-4 flex gap-2">
              <div className="relative flex-1">
                <Keyboard className="w-4 h-4 text-neutral-500 absolute top-3 left-3 rtl:right-3 rtl:left-auto" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder={lang === 'ar' ? 'إدخال الكود أو المسح بمسدس الباركود (مثال: RCN-000152)...' : 'Scan barcode or enter ID...'}
                  className="w-full bg-black border border-neutral-700 rounded-xl px-9 py-2 text-xs text-white placeholder:text-neutral-500 font-mono focus:outline-none focus:border-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-white text-black font-bold text-xs rounded-xl hover:bg-neutral-200"
              >
                {lang === 'ar' ? 'تأكيد' : 'Submit'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Scanned Result Card & Recent History */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Result Card */}
          {lastScannedMember ? (
            <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-5 space-y-4 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  {lang === 'ar' ? 'نتيجة المسح الحالية' : 'Live Scan Result'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم الحضور</span>
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <img
                  src={lastScannedMember.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(lastScannedMember.fullName)}&background=222&color=fff`}
                  alt={lastScannedMember.fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow"
                />
                <div>
                  <h3 className="font-bold text-base text-white">{lastScannedMember.fullName}</h3>
                  <div className="text-xs text-neutral-400 font-mono mt-0.5">
                    <span className="text-white font-bold">{lastScannedMember.memberCode}</span> • {lastScannedMember.phone}
                  </div>
                  <span className="text-[11px] text-neutral-400 block mt-1">
                    المجموعة: {groups.find((g) => g.id === lastScannedMember.currentGroupId)?.name || 'عامة'}
                  </span>
                </div>
              </div>

              {/* Status Alert Banner */}
              {scanMessage && (
                <div className={`p-3 rounded-xl text-xs font-medium ${
                  scanMessage.type === 'warning'
                    ? 'bg-amber-950 border border-amber-800 text-amber-300'
                    : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                }`}>
                  {scanMessage.text}
                </div>
              )}

              {/* Financial alert if balance due */}
              {lastScannedMember.balance && lastScannedMember.balance > 0 ? (
                <div className="p-3 bg-black border border-neutral-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-rose-400">
                    <CreditCard className="w-4 h-4" />
                    <span>مستحقات متأخرة:</span>
                  </div>
                  <span className="font-mono font-bold text-rose-400">
                    {lastScannedMember.balance} {organization?.currency || 'ج.م'}
                  </span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => onSelectMember(lastScannedMember)}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-neutral-700"
              >
                <Eye className="w-4 h-4" />
                <span>{lang === 'ar' ? 'عرض الملف الشخصي الكامل' : 'Open Member Profile'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-500 text-xs space-y-2">
              <QrCode className="w-12 h-12 mx-auto text-neutral-700" />
              <p>{lang === 'ar' ? 'في انتظار مسح كارت الـ QR...' : 'Waiting for scan...'}</p>
            </div>
          )}

          {/* Today's Scanned Log */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-xs text-white border-b border-neutral-800 pb-2">
              {lang === 'ar' ? 'سجل حضور هذه الجلسة' : "Today's Check-ins"}
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {scanHistory.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-black/60 border border-neutral-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <div>
                      <span className="font-bold text-white block">{item.member.fullName}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{item.member.memberCode}</span>
                    </div>
                  </div>
                  <span className="font-mono text-neutral-400 text-[10px]">{item.time}</span>
                </div>
              ))}
              {scanHistory.length === 0 && (
                <p className="text-neutral-500 text-center text-xs py-4">
                  {lang === 'ar' ? 'لم يتم مسح بطاقات بعد في هذه الجلسة' : 'No scans yet in this session'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
