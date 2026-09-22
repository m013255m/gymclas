import React, { useState, useEffect } from 'react';
import { Lock, User as UserIcon, Key, Eye, EyeOff, ShieldCheck, AlertCircle, Phone, Calendar, Info, Copy, Check, Sparkles, UserPlus } from 'lucide-react';
import { User } from '../types';
import { dbService } from '../lib/db';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
  lang?: 'ar' | 'en';
  onLanguageToggle?: () => void;
  onLicenseExpired?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, lang = 'ar', onLanguageToggle, onLicenseExpired }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // New User / Edit User Form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'reception' | 'coach_teacher' | 'accountant'>('admin');
  const [newExpiresAt, setNewExpiresAt] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [userSuccessMsg, setUserSuccessMsg] = useState('');
  const contactPhone = '01060474659';

  const englishPromptText = `Please configure RCN MANAGER with a secure authentication and licensing gateway:
1. Provide an initial professional login screen with username and password authentication before accessing the dashboard or setup wizard.
2. Store user credentials, account creation date, and expiration date in the local persistent database.
3. When the user's expiration date is reached, lock access and display a high-prestige subscription expiration notice informing them to renew.
4. Display the developer's renewal phone number prominently: 01060474659 with direct call and WhatsApp actions.
5. Provide administrative management to create accounts and adjust expiration dates.`;

  const loadUsers = async () => {
    try {
      const users = await dbService.getUsers();
      setAllUsers(users);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const users = await dbService.getUsers();
      const user = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (!user) {
        setError(lang === 'ar' ? 'اسم المستخدم غير مسجل' : 'Username not found');
        setIsLoading(false);
        return;
      }

      if (user.password && user.password !== password) {
        setError(lang === 'ar' ? 'كلمة المرور غير صحيحة' : 'Incorrect password');
        setIsLoading(false);
        return;
      }

      // Check if account is expired
      const now = new Date();
      const expiryStr = user.expiresAt || user.licenseExpiresAt || '2027-12-31';
      const expiry = new Date(expiryStr);

      if (expiry < now) {
        // Expired account
        if (onLicenseExpired) {
          onLicenseExpired();
          setIsLoading(false);
          return;
        }
        const expiredUser = { ...user, isExpired: true };
        onLoginSuccess(expiredUser);
        setIsLoading(false);
        return;
      }

      onLoginSuccess(user);
    } catch (err) {
      console.error('Login error:', err);
      setError(lang === 'ar' ? 'حدث خطأ أثناء تسجيل الدخول' : 'Error during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newName) {
      setError(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    try {
      const newUser: User = {
        id: 'user_' + Date.now(),
        username: newUsername.trim(),
        password: newPassword,
        name: newName.trim(),
        role: newRole,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(newExpiresAt).toISOString()
      };
      await dbService.saveUser(newUser);
      await loadUsers();
      setUserSuccessMsg(lang === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'User account created successfully');
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setTimeout(() => setUserSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setError(lang === 'ar' ? 'فشل حفظ الحساب' : 'Failed to save account');
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(englishPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4 overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0,transparent_70%)] pointer-events-none" />

      {/* Language Switcher Top Corner */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 z-20">
        <button
          type="button"
          onClick={onLanguageToggle}
          className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 border border-neutral-700 transition-colors"
        >
          {lang === 'ar' ? 'English (EN)' : 'عربي (AR)'}
        </button>
        <button
          type="button"
          onClick={() => setShowPromptModal(true)}
          className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 border border-neutral-700 transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
          <span>{lang === 'ar' ? 'برومبت التجديد' : 'English Prompt'}</span>
        </button>
      </div>

      <div className="w-full max-w-md my-8 relative z-10">
        {/* Main Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative">
          {/* Logo Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-black font-black text-xl mb-3 shadow-lg">
              RCN
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              RCN MANAGER
            </h1>
            <p className="text-xs font-medium text-neutral-400 mt-1">
              نظام إدارة الأنشطة والأعضاء الشامل
            </p>
          </div>

          {/* Quick Notice Banner */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 mb-6 text-xs text-neutral-300 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-white shrink-0" />
            <span>
              {lang === 'ar'
                ? 'النظام يعمل دون اتصال إنترنت (Offline-First) بحسابات وبيانات محلية آمنة.'
                : 'System runs fully offline with encrypted local accounts and license verification.'}
            </span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                {lang === 'ar' ? 'اسم المستخدم' : 'Username'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition"
                />
                <UserIcon className="absolute top-3 left-3 w-4 h-4 text-neutral-500 rtl:right-3 rtl:left-auto" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-3 left-3 rtl:right-3 rtl:left-auto text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/50 border border-red-900/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-sm shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>
                {isLoading
                  ? (lang === 'ar' ? 'جاري التحقق...' : 'Verifying...')
                  : (lang === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
              </span>
            </button>
          </form>

          {/* Quick Demo Credentials helper */}
          <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <button
              type="button"
              onClick={() => {
                setUsername('admin');
                setPassword('admin');
              }}
              className="hover:text-white underline"
            >
              {lang === 'ar' ? 'بيانات الدخول الافتراضية (admin / admin)' : 'Fill default credentials (admin / admin)'}
            </button>
          </div>

          {/* User & License Management Toggle */}
          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowUserManagement(!showUserManagement)}
              className="text-neutral-400 hover:text-white flex items-center gap-1 font-medium"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>
                {showUserManagement
                  ? (lang === 'ar' ? 'إخفاء إدارة الحسابات' : 'Hide Account Manager')
                  : (lang === 'ar' ? 'إدارة المستخدمين والتواريخ' : 'Manage Users & Expirations')}
              </span>
            </button>
            <span className="text-[11px] text-neutral-500 font-mono">v1.0.0</span>
          </div>

          {/* Expandable User & Expiration Creation Panel */}
          {showUserManagement && (
            <div className="mt-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 text-xs">
              <h3 className="font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>{lang === 'ar' ? 'إضافة حساب جديد وتاريخ صلاحيته' : 'Create Account & Expiry Date'}</span>
              </h3>
              <p className="text-neutral-400 text-[11px]">
                {lang === 'ar'
                  ? 'يمكنك إضافة مستخدم وتحديد تاريخ انتهاء لاختبار شاشة انتهاء الاشتراك فوراً.'
                  : 'Add new system users and specify exact expiration dates.'}
              </p>

              <form onSubmit={handleCreateUser} className="space-y-2">
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'الاسم الكامل (الموظف)' : 'Full Name'}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'اسم المستخدم' : 'Username'}
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white"
                  />
                  <input
                    type="password"
                    placeholder={lang === 'ar' ? 'كلمة المرور' : 'Password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    {lang === 'ar' ? 'تاريخ انتهاء الصلاحية (Expiry Date):' : 'Account Expiration Date:'}
                  </label>
                  <input
                    type="date"
                    value={newExpiresAt}
                    onChange={(e) => setNewExpiresAt(e.target.value)}
                    className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition"
                  >
                    {lang === 'ar' ? 'حفظ الحساب' : 'Save Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Set an expired date to test the expiration screen immediately!
                      setNewExpiresAt('2024-01-01');
                    }}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[11px]"
                    title="تعيين تاريخ قديم لاختبار شاشة القفل"
                  >
                    {lang === 'ar' ? 'تعيين منتهي' : 'Set Past Date'}
                  </button>
                </div>
                {userSuccessMsg && <p className="text-emerald-400 text-[11px] font-medium">{userSuccessMsg}</p>}
              </form>

              {/* Current Users List */}
              <div className="pt-2 border-t border-neutral-800">
                <span className="text-[11px] text-neutral-400 font-semibold block mb-1.5">
                  {lang === 'ar' ? 'الحسابات المسجلة بالمكتبة المحلية:' : 'Registered Accounts:'}
                </span>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {allUsers.map((u) => {
                    const expiryStr = u.expiresAt || u.licenseExpiresAt || '2027-12-31';
                    const isExp = new Date(expiryStr) < new Date();
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-2 rounded bg-black/60 border border-neutral-800 cursor-pointer hover:border-neutral-600"
                        onClick={() => {
                          setUsername(u.username);
                          setPassword(u.password || '');
                        }}
                      >
                        <div>
                          <span className="font-semibold text-white block">{u.username}</span>
                          <span className="text-[10px] text-neutral-400">{u.name} • {u.role}</span>
                        </div>
                        <div className="text-end">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isExp ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-neutral-800 text-neutral-300'}`}>
                            {isExp ? (lang === 'ar' ? 'منتهي' : 'Expired') : expiryStr.split('T')[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Contact Support Footer */}
          <div className="mt-6 pt-4 border-t border-neutral-800/80 text-center text-xs text-neutral-500">
            <span>{lang === 'ar' ? 'للتجديد والدعم الفني:' : 'Support & Renewal Line:'} </span>
            <a href={`tel:${contactPhone}`} className="font-mono text-neutral-300 hover:text-white font-bold ml-1">
              {contactPhone}
            </a>
          </div>
        </div>
      </div>

      {/* English Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                <span>English Prompt for System License & Expiration</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPromptModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Here is the exact prompt requested to configure the professional login screen, account expiration date enforcement, and the renewal contact phone <code className="text-white">01060474659</code>:
            </p>
            <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-4 font-mono text-xs text-neutral-200 max-h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {englishPromptText}
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={copyPrompt}
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-black text-xs font-semibold rounded-lg hover:bg-neutral-200 transition"
              >
                {copiedPrompt ? <Check className="w-4 h-4 text-green-700" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPrompt ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
