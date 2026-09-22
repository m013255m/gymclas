import React, { useState, useEffect } from 'react';
import { Home, Users, CheckSquare, QrCode, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ActivityLog,
  AttendanceRecord,
  Expense,
  Group,
  InternalNotification,
  Member,
  OrganizationConfig,
  Payment,
  PerformanceEvaluation,
  Session,
  SystemUser
} from './types';
import { dbService, seedInitialData } from './lib/db';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MembersView } from './components/MembersView';
import { AttendanceView } from './components/AttendanceView';
import { QRScannerView } from './components/QRScannerView';
import { GroupsView } from './components/GroupsView';
import { FinanceView } from './components/FinanceView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { SetupWizard } from './components/SetupWizard';
import { LoginModal } from './components/LoginModal';
import { LicenseExpiredModal } from './components/LicenseExpiredModal';
import { MemberProfileModal } from './components/MemberProfileModal';
import { AddMemberModal } from './components/AddMemberModal';
import { ReceiptModal } from './components/ReceiptModal';
import { DebtsView } from './components/DebtsView';
import { syncSubscriptionNotifications } from './lib/subscriptions';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [organization, setOrganization] = useState<OrganizationConfig | null>(null);
  const [isLicenseExpired, setIsLicenseExpired] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // App Layout State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  // Loaded Data Entities
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [performance, setPerformance] = useState<PerformanceEvaluation[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<InternalNotification[]>([]);

  // Active Modals
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<Payment | null>(null);

  // Initial Boot & Data Hydration
  const refreshData = async () => {
    try {
      const org = await dbService.getOrganization();
      setOrganization(org);

      const memList = await dbService.getMembers();
      setMembers(memList);

      const grpList = await dbService.getGroups();
      setGroups(grpList);

      const sesList = await dbService.getSessions();
      setSessions(sesList);

      const attList = await dbService.getAttendance();
      setAttendance(attList);

      const payList = await dbService.getPayments();
      setPayments(payList);

      const expList = await dbService.getExpenses();
      setExpenses(expList);

      const perfList = await dbService.getPerformance();
      setPerformance(perfList);

      const logList = await dbService.getLogs();
      setLogs(logList);

      // Sync subscription expiry notifications so admin is alerted for expiring members
      await syncSubscriptionNotifications(memList, lang);
      const notifList = await dbService.getNotifications();
      setNotifications(notifList);

      // Keep selectedMember in sync if modal is open
      setSelectedMember((prev) => {
        if (!prev) return null;
        return memList.find((m) => m.id === prev.id) || prev;
      });
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        await seedInitialData(false);

        // Check organization
        const org = await dbService.getOrganization();
        setOrganization(org);

        // Check if there is an active session
        const users = await dbService.getUsers();
        const savedUserId = localStorage.getItem('rcn_logged_in_user');
        if (savedUserId) {
          const matched = users.find((u) => u.id === savedUserId || u.username === savedUserId);
          if (matched) {
            // Check expiry
            if (matched.expiresAt && new Date(matched.expiresAt).getTime() < new Date().getTime()) {
              setIsLicenseExpired(true);
            } else {
              setCurrentUser(matched);
            }
          }
        }

        await refreshData();
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // Update HTML document title and lang direction
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (organization?.name) {
      document.title = `${organization.name} | RCN MANAGER`;
    }
  }, [lang, organization]);

  // Handle Login
  const handleLoginSuccess = (user: SystemUser) => {
    localStorage.setItem('rcn_logged_in_user', user.id);
    if (user.expiresAt && new Date(user.expiresAt).getTime() < new Date().getTime()) {
      setIsLicenseExpired(true);
    } else {
      setCurrentUser(user);
      setIsLicenseExpired(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('rcn_logged_in_user');
    setCurrentUser(null);
  };

  // Handle Renewal of expired license
  const handleRenewSuccess = async (newExpiryDate: string) => {
    if (currentUser) {
      const updated = { ...currentUser, expiresAt: newExpiryDate };
      await dbService.saveUser(updated);
      setCurrentUser(updated);
    }
    setIsLicenseExpired(false);
    alert(lang === 'ar' ? 'تم تجديد الاشتراك والترخيص بنجاح!' : 'Subscription renewed successfully!');
  };

  // Handle Quick Attendance directly from profile or member item
  const handleQuickAttendance = async (member: Member) => {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    const grp = groups.find((g) => g.id === member.currentGroupId);

    const record: AttendanceRecord = {
      id: `att_${today}_${member.id}`,
      memberId: member.id,
      memberName: member.fullName,
      memberCode: member.memberCode,
      groupId: member.currentGroupId || '',
      groupName: grp?.name || '',
      date: today,
      time,
      status: 'present',
      recordedBy: currentUser?.name || 'المدير العام',
      createdAt: new Date().toISOString()
    };
    await dbService.recordAttendance(record);
    await refreshData();
    alert(lang === 'ar' ? `تم تسجيل حضور ${member.fullName} بنجاح` : `Attendance recorded for ${member.fullName}`);
  };

  // If initial loading
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-white text-black font-black flex items-center justify-center text-xl shadow-2xl animate-pulse">
          RCN
        </div>
        <div className="text-center">
          <h1 className="font-bold text-base tracking-wider">RCN MANAGER</h1>
          <p className="text-xs text-neutral-500 font-mono mt-1">جاري تحميل قاعدة البيانات المحلية...</p>
        </div>
      </div>
    );
  }

  // 1. If Setup Wizard is requested or not configured yet
  if (!organization || showSetupWizard) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <SetupWizard
          onComplete={async (cfg) => {
            if (cfg) {
              await dbService.saveOrganization(cfg);
              setOrganization(cfg);
            }
            setShowSetupWizard(false);
            await refreshData();
          }}
          initialConfig={organization}
          lang={lang}
        />
      </div>
    );
  }

  // 2. If License Expired Modal
  if (isLicenseExpired) {
    return (
      <LicenseExpiredModal
        user={currentUser}
        onRenewSuccess={handleRenewSuccess}
        onLogout={handleLogout}
        supportPhone="01060474659"
        lang={lang}
      />
    );
  }

  // 3. If Not Logged In
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <LoginModal
          onLoginSuccess={handleLoginSuccess}
          lang={lang}
          onLanguageToggle={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          onLicenseExpired={() => setIsLicenseExpired(true)}
        />
      </div>
    );
  }

  // 4. Main Unified Workspace Layout
  const unreadCount = notifications.filter((n) => !n.read).length;
  const unpaidDebtsCount = members.filter((m) => {
    const bal = m.balance ?? Math.max(0, (m.totalDue || 0) - (m.totalPaid || 0));
    return bal > 0;
  }).length;

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-neutral-950 text-white' : 'theme-light bg-slate-50 text-slate-900'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
          }
        }}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        lang={lang}
        organization={organization}
        unreadNotifsCount={unreadCount}
        unpaidDebtsCount={unpaidDebtsCount}
        onOpenSetupWizard={() => setShowSetupWizard(true)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header Bar */}
        <Header
          currentUser={currentUser}
          organization={organization}
          notifications={notifications}
          theme={theme}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          lang={lang}
          onLanguageToggle={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onLogout={handleLogout}
          onSelectMember={(m) => setSelectedMember(m)}
          allMembers={members}
          onNavigate={(tab) => setActiveTab(tab)}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-3.5 pb-24 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* VIEW ROUTING WITH SILKY MOTION TRANSITION */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                {activeTab === 'dashboard' && (
                  <Dashboard
                    members={members}
                    groups={groups}
                    sessions={sessions}
                    attendance={attendance}
                    payments={payments}
                    performance={performance}
                    logs={logs}
                    notifications={notifications}
                    organization={organization}
                    lang={lang}
                    onNavigate={(tab) => setActiveTab(tab)}
                    onOpenAddMember={() => setShowAddMemberModal(true)}
                    onOpenAddPayment={() => setActiveTab('payments')}
                    onOpenNewGroup={() => setActiveTab('groups')}
                    onOpenNewSession={() => setActiveTab('attendance')}
                    onSelectMember={(m) => setSelectedMember(m)}
                  />
                )}

                {activeTab === 'members' && (
                  <MembersView
                    members={members}
                    groups={groups}
                    organization={organization}
                    lang={lang}
                    onRefresh={refreshData}
                    onSelectMember={(m) => setSelectedMember(m)}
                    onRecordAttendance={handleQuickAttendance}
                    onAddPayment={() => setActiveTab('payments')}
                    onOpenAddMember={() => setShowAddMemberModal(true)}
                  />
                )}

                {activeTab === 'debts' && (
                  <DebtsView
                    members={members}
                    groups={groups}
                    organization={organization}
                    lang={lang}
                    onSelectMember={(m) => setSelectedMember(m)}
                    onAddPayment={(m) => {
                      setSelectedMember(m);
                      setActiveTab('payments');
                    }}
                    onRefresh={refreshData}
                  />
                )}

                {activeTab === 'attendance' && (
                  <AttendanceView
                    members={members}
                    groups={groups}
                    sessions={sessions}
                    organization={organization}
                    lang={lang}
                    onRefresh={refreshData}
                  />
                )}

                {(activeTab === 'qr-scanner' || activeTab === 'qr_scanner') && (
                  <QRScannerView
                    members={members}
                    groups={groups}
                    organization={organization}
                    lang={lang}
                    onSelectMember={(m) => setSelectedMember(m)}
                    onRefresh={refreshData}
                  />
                )}

                {activeTab === 'groups' && (
                  <GroupsView
                    groups={groups}
                    members={members}
                    organization={organization}
                    lang={lang}
                    onRefresh={refreshData}
                    onFilterByGroup={() => setActiveTab('members')}
                  />
                )}

                {(activeTab === 'payments' || activeTab === 'finance') && (
                  <FinanceView
                    payments={payments}
                    expenses={expenses}
                    members={members}
                    organization={organization}
                    lang={lang}
                    onRefresh={refreshData}
                    onOpenReceipt={(p) => setActiveReceiptPayment(p)}
                  />
                )}

                {activeTab === 'reports' && (
                  <ReportsView
                    members={members}
                    groups={groups}
                    payments={payments}
                    expenses={expenses}
                    attendance={attendance}
                    organization={organization}
                    lang={lang}
                  />
                )}

                {(activeTab === 'settings' || activeTab === 'backup' || activeTab === 'users') && (
                  <SettingsView
                    organization={organization}
                    currentUser={currentUser}
                    lang={lang}
                    onRefresh={refreshData}
                  />
                )}

                {(activeTab === 'notifications' || activeTab === 'activity-log' || activeTab === 'sessions' || activeTab === 'performance') && (
                  <ReportsView
                    members={members}
                    groups={groups}
                    payments={payments}
                    expenses={expenses}
                    attendance={attendance}
                    organization={organization}
                    lang={lang}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Phone Bottom Navigation Bar */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 flex items-center justify-around px-2 py-1.5 shadow-2xl"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
              activeTab === 'dashboard'
                ? 'text-blue-500 font-bold bg-blue-500/10 border border-blue-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
              activeTab === 'members'
                ? 'text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">{lang === 'ar' ? 'المشتركين' : 'Members'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
              activeTab === 'attendance'
                ? 'text-cyan-500 font-bold bg-cyan-500/10 border border-cyan-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">{lang === 'ar' ? 'الحضور' : 'Attendance'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr-scanner')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
              activeTab === 'qr-scanner'
                ? 'text-pink-500 font-bold bg-pink-500/10 border border-pink-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">{lang === 'ar' ? 'كود QR' : 'QR Scan'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-neutral-400 hover:text-white transition-all duration-200 active:scale-95"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">{lang === 'ar' ? 'القائمة' : 'Menu'}</span>
          </button>
        </nav>
      </div>

      {/* POPUP MODALS */}

      {/* 1. Member Profile Modal */}
      {selectedMember && (
        <MemberProfileModal
          member={selectedMember}
          organization={organization}
          groups={groups}
          onClose={() => setSelectedMember(null)}
          onRecordAttendance={handleQuickAttendance}
          onAddPayment={() => {
            setSelectedMember(null);
            setActiveTab('payments');
          }}
          lang={lang}
          onMemberUpdated={refreshData}
        />
      )}

      {/* 2. Add Member Modal */}
      {showAddMemberModal && (
        <AddMemberModal
          groups={groups}
          allMembers={members}
          organization={organization}
          onClose={() => setShowAddMemberModal(false)}
          onSaved={(newMem, openProfile) => {
            setShowAddMemberModal(false);
            refreshData();
            if (openProfile) {
              setSelectedMember(newMem);
            }
          }}
          lang={lang}
        />
      )}

      {/* 3. Official Receipt Modal */}
      {activeReceiptPayment && (
        <ReceiptModal
          payment={activeReceiptPayment}
          organization={organization}
          onClose={() => setActiveReceiptPayment(null)}
          lang={lang}
        />
      )}
    </div>
  );
}
