import {
  ActivityLog,
  AttendanceRecord,
  BackupData,
  CustomField,
  Expense,
  Group,
  GroupMembershipHistory,
  InternalNotification,
  Member,
  OrganizationConfig,
  Payment,
  PerformanceEvaluation,
  Session,
  Subscription,
  User
} from '../types';

const DB_NAME = 'RCN_MANAGER_OFFLINE_DB';
const DB_VERSION = 2;

let dbInstance: IDBDatabase | null = null;

export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const stores = [
        'members',
        'groups',
        'sessions',
        'attendance',
        'payments',
        'expenses',
        'subscriptions',
        'performance',
        'logs',
        'notifications',
        'users',
        'settings',
        'groupHistory',
        'customFields'
      ];
      for (const store of stores) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      }
    };
    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };
    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Low-level helper: getAll
async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`Error reading ${storeName}:`, err);
    return [];
  }
}

// Low-level helper: put
async function putInStore<T extends { id: string }>(storeName: string, item: T): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

// Low-level helper: delete
async function deleteFromStore(storeName: string, id: string): Promise<boolean> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Clear store
async function clearStore(storeName: string): Promise<boolean> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Default initial organization settings
const DEFAULT_ORG_SETTINGS: OrganizationConfig = {
  id: 'org_main',
  name: 'أكاديمية النجاح الدولية',
  subName: 'فرع مدينة نصر والمهندسين',
  phone: '01060474659',
  email: 'info@rcnmanager.com',
  address: 'القاهرة - مصر',
  currency: 'ج.م',
  language: 'ar',
  timezone: 'Africa/Cairo',
  activityType: 'educational_academy',
  contactSupportPhone: '01060474659',
  setupCompleted: true
};

// Default Administrator User with account creation & expiration dates and specified duration
const DEFAULT_ADMIN_USER: User = {
  id: 'user_admin_01',
  username: 'admin',
  password: 'admin',
  name: 'المدير العام',
  role: 'admin',
  phone: '01060474659',
  email: 'admin@rcnmanager.com',
  status: 'active',
  createdAt: '2025-01-01T00:00:00Z',
  expiresAt: '2027-12-31T23:59:59Z',
  duration: 'سنة كاملة (365 يوم)',
  durationDays: 365
};

// Seeding realistic initial data matching screenshot: 152 members, groups, sessions, etc.
export async function seedInitialData(force: boolean = false): Promise<void> {
  if (force) {
    const stores = [
      'members',
      'groups',
      'sessions',
      'attendance',
      'payments',
      'expenses',
      'subscriptions',
      'performance',
      'logs',
      'notifications',
      'users',
      'settings',
      'groupHistory',
      'customFields'
    ];
    for (const s of stores) {
      await clearStore(s);
    }
  }
  await initializeDatabaseIfEmpty();
}

export async function initializeDatabaseIfEmpty(): Promise<void> {
  const users = await getAllFromStore<User>('users');
  if (users.length > 0) {
    // Ensure any user missing duration gets their specified duration stored
    for (const u of users) {
      if (!u.duration) {
        u.duration = u.role === 'admin' ? 'سنة كاملة (365 يوم)' : '6 أشهر (180 يوم)';
        u.durationDays = u.role === 'admin' ? 365 : 180;
        await putInStore('users', u);
      }
    }
    return; // Already initialized
  }

  console.log('Seeding initial RCN MANAGER dataset...');

  // 1. Settings
  await putInStore('settings', DEFAULT_ORG_SETTINGS);

  // 2. Default Users with specified duration
  await putInStore('users', DEFAULT_ADMIN_USER);
  await putInStore('users', {
    id: 'user_manager_02',
    username: 'manager',
    password: 'password123',
    name: 'سارة أحمد',
    role: 'manager',
    phone: '01099887766',
    email: 'sarah@rcnmanager.com',
    status: 'active',
    createdAt: '2025-01-15T00:00:00Z',
    expiresAt: '2027-12-31T23:59:59Z',
    duration: '6 أشهر (180 يوم)',
    durationDays: 180
  });

  // 3. Groups (Matching screenshot: الصف الأول، الثاني، الثالث، إلخ)
  const initialGroups: Group[] = [
    {
      id: 'grp_01',
      code: 'GRP-101',
      name: 'الصف الأول الثانوي (مجموعة A)',
      instructorName: 'أ/ محمد حسام',
      schedule: 'السبت والثلاثاء (05:00 م - 07:00 م)',
      location: 'قاعة A',
      capacity: 50,
      description: 'منهج الفيزياء والكيمياء المتقدم',
      status: 'active',
      createdAt: '2025-01-10T10:00:00Z',
      updatedAt: '2025-04-20T12:00:00Z'
    },
    {
      id: 'grp_02',
      code: 'GRP-102',
      name: 'الصف الثاني الثانوي (مجموعة B)',
      instructorName: 'أ/ شريف عبد الرحمن',
      schedule: 'الأحد والأربعاء (06:00 م - 08:00 م)',
      location: 'قاعة B',
      capacity: 45,
      description: 'منهج الرياضيات المتقدمة',
      status: 'active',
      createdAt: '2025-01-12T11:00:00Z',
      updatedAt: '2025-04-22T10:00:00Z'
    },
    {
      id: 'grp_03',
      code: 'GRP-103',
      name: 'الصف الثالث الثانوي (مجموعة متميزة)',
      instructorName: 'د/ مصطفى كمال',
      schedule: 'الإثنين والخميس (04:00 م - 06:00 م)',
      location: 'مدرج C',
      capacity: 35,
      description: 'مراجعات نهائية وثانوية عامة',
      status: 'active',
      createdAt: '2025-01-15T09:00:00Z',
      updatedAt: '2025-04-24T14:00:00Z'
    },
    {
      id: 'grp_04',
      code: 'GRP-104',
      name: 'كورس التحدث بالإنجليزية (Level 3)',
      instructorName: 'م/ نورهان إبراهيم',
      schedule: 'الجمعة والسبت (05:00 م - 07:00 م)',
      location: 'معمل اللغات D',
      capacity: 30,
      description: 'المحادثة والنطق السليم',
      status: 'active',
      createdAt: '2025-01-18T10:00:00Z',
      updatedAt: '2025-04-25T11:00:00Z'
    },
    {
      id: 'grp_05',
      code: 'GRP-105',
      name: 'أكاديمية الناشئين لكرة القدم (مواليد 2012)',
      instructorName: 'كابتن / إسلام فتحي',
      schedule: 'السبت والإثنين (02:00 م - 05:00 م)',
      location: 'الملعب الرئيسي',
      capacity: 30,
      description: 'اللياقة والمهارات الكروية',
      status: 'active',
      createdAt: '2025-01-20T10:00:00Z',
      updatedAt: '2025-04-26T12:00:00Z'
    },
    {
      id: 'grp_06',
      code: 'GRP-106',
      name: 'كلاس اللياقة البدنية والكروس فيت',
      instructorName: 'كابتن / أحمد عز',
      schedule: 'يومياً (07:00 م - 08:30 م)',
      location: 'صالة VIP',
      capacity: 20,
      description: 'حرق دهون وبناء عضلي',
      status: 'active',
      createdAt: '2025-02-01T10:00:00Z',
      updatedAt: '2025-04-26T15:00:00Z'
    }
  ];

  for (const g of initialGroups) {
    await putInStore('groups', g);
  }

  // 4. Initial Members
  const sampleMembers: Partial<Member>[] = [
    { fullName: 'أحمد محمود إبراهيم', phone: '01012345678', guardianName: 'محمود إبراهيم', guardianPhone: '01011223344', currentGroupId: 'grp_01', status: 'active', totalPaid: 1500, balance: 0 },
    { fullName: 'محمد علي عبد الله', phone: '01123456789', guardianName: 'علي عبد الله', guardianPhone: '01133445566', currentGroupId: 'grp_01', status: 'active', totalPaid: 1000, balance: 500 },
    { fullName: 'يوسف طارق حسن', phone: '01234567890', guardianName: 'طارق حسن', guardianPhone: '01244556677', currentGroupId: 'grp_02', status: 'active', totalPaid: 750, balance: 0 },
    { fullName: 'مريم شريف عبد الرحمن', phone: '01098765432', guardianName: 'شريف عبد الرحمن', guardianPhone: '01088776655', currentGroupId: 'grp_02', status: 'active', totalPaid: 1500, balance: 0 },
    { fullName: 'سارة خالد خليل', phone: '01555667788', guardianName: 'خالد خليل', guardianPhone: '01599887711', currentGroupId: 'grp_03', status: 'active', totalPaid: 1000, balance: 400 },
    { fullName: 'عمر مصطفى فاروق', phone: '01022334455', guardianName: 'مصطفى فاروق', guardianPhone: '01033221144', currentGroupId: 'grp_03', status: 'active', totalPaid: 500, balance: 1000 },
    { fullName: 'نور الدين سامي', phone: '01144556677', guardianName: 'سامي عبد الغني', guardianPhone: '01155667788', currentGroupId: 'grp_02', status: 'active', totalPaid: 1200, balance: 0 },
    { fullName: 'حسام نادر السيد', phone: '01277889900', guardianName: 'نادر السيد', guardianPhone: '01288990011', currentGroupId: 'grp_01', status: 'active', totalPaid: 800, balance: 200 },
    { fullName: 'جنا وائل محمود', phone: '01066554433', guardianName: 'وائل محمود', guardianPhone: '01077665544', currentGroupId: 'grp_04', status: 'active', totalPaid: 1500, balance: 0 },
    { fullName: 'كريم حسام الدين', phone: '01188990022', guardianName: 'حسام الدين فؤاد', guardianPhone: '01199001122', currentGroupId: 'grp_04', status: 'active', totalPaid: 1000, balance: 300 },
    { fullName: 'فاطمة الزهراء عادل', phone: '01511223399', guardianName: 'عادل محمد', guardianPhone: '01522334488', currentGroupId: 'grp_05', status: 'active', totalPaid: 600, balance: 0 },
    { fullName: 'زياد عمرو البدري', phone: '01044332211', guardianName: 'عمرو البدري', guardianPhone: '01055443322', currentGroupId: 'grp_05', status: 'inactive', totalPaid: 0, balance: 0 }
  ];

  // We seed the total members to reach 152 members with realistic codes from RCN-000001 up to RCN-000152
  const membersToInsert: Member[] = [];
  for (let i = 1; i <= 152; i++) {
    const code = `RCN-${String(i).padStart(6, '0')}`;
    const sample = sampleMembers[(i - 1) % sampleMembers.length];
    const isInactive = i > 128; // 128 active, 24 inactive = 152 total
    const groupIndex = ((i - 1) % 5) + 1;
    const groupId = `grp_0${groupIndex}`;
    const member: Member = {
      id: `mem_${i}`,
      memberCode: code,
      fullName: i <= sampleMembers.length ? sample.fullName! : `${sample.fullName} (${i})`,
      photoUrl: `https://images.unsplash.com/photo-${1534528741775 + (i * 77) % 50000}?w=150&auto=format&fit=crop&q=80`,
      phone: sample.phone || `010${String(10000000 + i)}`,
      guardianName: sample.guardianName,
      guardianPhone: sample.guardianPhone,
      address: 'القاهرة - مدينة نصر',
      dateOfBirth: '2008-05-15',
      gender: i % 3 === 0 ? 'female' : 'male',
      registrationDate: '2025-04-20',
      status: isInactive ? 'inactive' : 'active',
      currentGroupId: groupId,
      subscriptionPlan: 'اشتراك شهري منتظم',
      notes: i === 1 ? 'مشترك متميز وملتزم بالحضور' : undefined,
      qrCodeSafeData: `RCN:${code}`,
      totalPaid: isInactive ? 0 : (i % 2 === 0 ? 1500 : 1000),
      totalDue: 1500,
      balance: isInactive ? 0 : (i % 3 === 0 ? 500 : 0),
      createdAt: '2025-04-20T08:00:00Z',
      updatedAt: '2025-04-27T10:00:00Z'
    };
    membersToInsert.push(member);
    await putInStore('members', member);
  }

  // 5. Recent Sessions
  const initialSessions: Session[] = [
    {
      id: 'ses_01',
      title: 'مراجعة الميكانيكا وقوانين الحركة',
      subject: 'فيزياء',
      groupId: 'grp_01',
      groupName: 'الصف الأول الثانوي',
      instructorName: 'أ/ محمد حسام',
      date: '2025-04-27',
      startTime: '06:00 م',
      endTime: '07:30 م',
      location: 'قاعة 1',
      topic: 'قوانين نيوتن وحل التدريبات',
      status: 'completed',
      createdAt: '2025-04-27T08:00:00Z'
    },
    {
      id: 'ses_02',
      title: 'التفاضل وحساب المثلثات المتقدم',
      subject: 'رياضيات',
      groupId: 'grp_02',
      groupName: 'الصف الثاني الثانوي',
      instructorName: 'أ/ شريف عبد الرحمن',
      date: '2025-04-26',
      startTime: '05:00 م',
      endTime: '06:30 م',
      location: 'قاعة B',
      topic: 'تطبيقات النهايات',
      status: 'completed',
      createdAt: '2025-04-26T08:00:00Z'
    },
    {
      id: 'ses_03',
      title: 'حل نماذج امتحانات الثانوية العامة',
      subject: 'كيمياء',
      groupId: 'grp_03',
      groupName: 'الصف الثالث الثانوي',
      instructorName: 'د/ مصطفى كمال',
      date: '2025-04-25',
      startTime: '04:00 م',
      endTime: '05:30 م',
      location: 'مدرج C',
      topic: 'الكيمياء العضوية',
      status: 'completed',
      createdAt: '2025-04-25T08:00:00Z'
    },
    {
      id: 'ses_04',
      title: 'محادثة وتطبيقات الإنجليزية الحية',
      subject: 'لغات',
      groupId: 'grp_01',
      groupName: 'الصف الأول الثانوي',
      instructorName: 'م/ نورهان إبراهيم',
      date: '2025-04-24',
      startTime: '06:30 م',
      endTime: '08:00 م',
      location: 'معمل اللغات',
      topic: 'العروض التقديمية',
      status: 'completed',
      createdAt: '2025-04-24T08:00:00Z'
    }
  ];

  for (const s of initialSessions) {
    await putInStore('sessions', s);
  }

  // 6. Recent Payments
  const initialPayments: Payment[] = [
    {
      id: 'pay_01',
      receiptNumber: 'REC-2025-0041',
      memberId: 'mem_1',
      memberName: 'أحمد محمود إبراهيم',
      memberCode: 'RCN-000001',
      amount: 1500,
      date: '2025-04-27',
      time: '12:30 م',
      method: 'cash',
      notes: 'اشتراك شهر كامل',
      recordedBy: 'المدير العام',
      previousBalance: 1500,
      remainingBalance: 0,
      createdAt: '2025-04-27T12:30:00Z'
    },
    {
      id: 'pay_02',
      receiptNumber: 'REC-2025-0040',
      memberId: 'mem_2',
      memberName: 'محمد علي عبد الله',
      memberCode: 'RCN-000002',
      amount: 1000,
      date: '2025-04-26',
      time: '04:15 م',
      method: 'transfer',
      notes: 'دفعة مقدمة من الاشتراك',
      recordedBy: 'المدير العام',
      previousBalance: 1500,
      remainingBalance: 500,
      createdAt: '2025-04-26T16:15:00Z'
    },
    {
      id: 'pay_03',
      receiptNumber: 'REC-2025-0039',
      memberId: 'mem_3',
      memberName: 'يوسف طارق حسن',
      memberCode: 'RCN-000003',
      amount: 750,
      date: '2025-04-26',
      time: '02:20 م',
      method: 'cash',
      notes: 'سداد نصف الرسوم',
      recordedBy: 'سارة أحمد',
      previousBalance: 750,
      remainingBalance: 0,
      createdAt: '2025-04-26T14:20:00Z'
    },
    {
      id: 'pay_04',
      receiptNumber: 'REC-2025-0038',
      memberId: 'mem_4',
      memberName: 'مريم شريف عبد الرحمن',
      memberCode: 'RCN-000004',
      amount: 1500,
      date: '2025-04-25',
      time: '05:45 م',
      method: 'card',
      notes: 'اشتراك سنوي جزئي',
      recordedBy: 'المدير العام',
      previousBalance: 1500,
      remainingBalance: 0,
      createdAt: '2025-04-25T17:45:00Z'
    },
    {
      id: 'pay_05',
      receiptNumber: 'REC-2025-0037',
      memberId: 'mem_5',
      memberName: 'سارة خالد خليل',
      memberCode: 'RCN-000005',
      amount: 1000,
      date: '2025-04-24',
      time: '11:10 ص',
      method: 'cash',
      notes: 'سداد جزئي للاشتراك',
      recordedBy: 'سارة أحمد',
      previousBalance: 1400,
      remainingBalance: 400,
      createdAt: '2025-04-24T11:10:00Z'
    }
  ];

  for (const p of initialPayments) {
    await putInStore('payments', p);
  }

  // 7. Attendance Records
  const today = '2025-04-27';
  for (let i = 1; i <= 35; i++) {
    const mem = membersToInsert[i - 1];
    let status: 'present' | 'absent' | 'late' | 'excused' = 'present';
    if (i === 15 || i === 22) status = 'absent';
    else if (i === 8 || i === 19) status = 'late';
    else if (i === 30) status = 'excused';

    const att: AttendanceRecord = {
      id: `att_today_${i}`,
      memberId: mem.id,
      memberName: mem.fullName,
      memberCode: mem.memberCode,
      sessionId: 'ses_01',
      sessionTitle: 'مراجعة الميكانيكا',
      groupId: mem.currentGroupId || 'grp_01',
      groupName: 'الصف الأول الثانوي',
      date: today,
      time: '05:10 م',
      status,
      recordedBy: 'ماسح الـ QR السريع',
      createdAt: new Date().toISOString()
    };
    await putInStore('attendance', att);
  }

  // 8. Performance Evaluations
  const evaluations: PerformanceEvaluation[] = [
    {
      id: 'perf_01',
      memberId: 'mem_1',
      memberName: 'أحمد محمود إبراهيم',
      date: '2025-04-25',
      evaluator: 'أ/ محمد حسام',
      category: 'الامتحان الأسبوعي الأول',
      score: 92,
      rating: 'ممتاز',
      notes: 'إجابة نموذجية وتركيز ممتاز في المسائل الحسابية',
      createdAt: '2025-04-25T10:00:00Z'
    },
    {
      id: 'perf_02',
      memberId: 'mem_1',
      memberName: 'أحمد محمود إبراهيم',
      date: '2025-04-25',
      evaluator: 'كابتن / إسلام فتحي',
      category: 'اللياقة البدنية وسرعة الجري',
      score: 88,
      rating: 'جيد جداً',
      notes: 'تطور ملحوظ في السرعة والتحمل',
      createdAt: '2025-04-25T10:00:00Z'
    },
    {
      id: 'perf_03',
      memberId: 'mem_2',
      memberName: 'محمد علي عبد الله',
      date: '2025-04-24',
      evaluator: 'أ/ شريف عبد الرحمن',
      category: 'اختبار الرياضيات الشامل',
      score: 95,
      rating: 'ممتاز مرتفع',
      notes: 'الأول على المجموعة في حساب المثلثات',
      createdAt: '2025-04-24T12:00:00Z'
    }
  ];

  for (const ev of evaluations) {
    await putInStore('performance', ev);
  }

  // 9. Activity Logs
  const logs: ActivityLog[] = [
    {
      id: 'log_01',
      timestamp: '2025-04-27T17:10:00Z',
      userId: 'user_admin_01',
      userName: 'المدير العام',
      action: 'تسجيل حضور',
      entityType: 'attendance',
      description: 'تسجيل حضور أحمد محمود إبراهيم عبر ماسح QR',
      newValue: 'حاضر'
    },
    {
      id: 'log_02',
      timestamp: '2025-04-27T16:45:00Z',
      userId: 'user_admin_01',
      userName: 'المدير العام',
      action: 'تحصيل إيصال',
      entityType: 'payment',
      description: 'استلام دفعة نقدية 500 ج.م من محمد علي عبد الله',
      newValue: '500 ج.م'
    },
    {
      id: 'log_03',
      timestamp: '2025-04-27T14:30:00Z',
      userId: 'user_admin_01',
      userName: 'المدير العام',
      action: 'إضافة عضو',
      entityType: 'member',
      description: 'تسجيل مشترك جديد برقم كود RCN-000152',
      newValue: 'RCN-000152'
    },
    {
      id: 'log_04',
      timestamp: '2025-04-27T12:15:00Z',
      userId: 'user_admin_01',
      userName: 'المدير العام',
      action: 'تعديل مجموعة',
      entityType: 'group',
      description: 'تعديل موعد مجموعة الصف الأول الثانوي',
      previousValue: '04:00 م',
      newValue: '05:00 م'
    }
  ];

  for (const l of logs) {
    await putInStore('logs', l);
  }

  // 10. Internal Notifications
  const notifications: InternalNotification[] = [
    {
      id: 'notif_01',
      title: 'مستحقات متأخرة',
      message: '17 مشترك لديهم مبالغ متأخرة تجاوزت موعد الاستحقاق',
      type: 'balance',
      date: 'اليوم',
      read: false
    },
    {
      id: 'notif_02',
      title: 'انتهاء اشتراكات',
      message: '3 اشتراكات تنتهي خلال هذا الأسبوع',
      type: 'expiry',
      date: 'اليوم',
      read: false
    },
    {
      id: 'notif_03',
      title: 'تنبيه غياب متكرر',
      message: '8 طلاب غائبين لأكثر من حصتين متتاليتين',
      type: 'absence',
      date: 'أمس',
      read: false
    },
    {
      id: 'notif_04',
      title: 'تحصيل اليوم',
      message: 'تم تحصيل 5 إيصالات بإجمالي 4,850 ج.م اليوم بنجاح',
      type: 'payment',
      date: 'أمس',
      read: true
    },
    {
      id: 'notif_05',
      title: 'تقرير الحضور العام',
      message: 'نسبة الحضور لهذا الشهر بلغت 89% وهي أعلى من الشهر الماضي',
      type: 'info',
      date: 'منذ يومين',
      read: true
    }
  ];

  for (const n of notifications) {
    await putInStore('notifications', n);
  }

  console.log('RCN MANAGER Database initialization complete.');
}

// ----------------------------------------------------
// Exported Repository API
// ----------------------------------------------------
export const dbService = {
  // Members
  async getMembers(): Promise<Member[]> {
    return getAllFromStore<Member>('members');
  },
  async getMemberById(id: string): Promise<Member | undefined> {
    const all = await getAllFromStore<Member>('members');
    return all.find((m) => m.id === id || m.memberCode === id);
  },
  async updateMember(id: string, updates: Partial<Member>): Promise<Member | undefined> {
    const existing = await this.getMemberById(id);
    if (!existing) return undefined;
    const updated: Member = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString()
    };
    await putInStore('members', updated);
    return updated;
  },
  async saveMember(member: Member): Promise<Member> {
    const existing = await this.getMemberById(member.id);
    const updated = {
      ...member,
      updatedAt: new Date().toISOString()
    };
    await putInStore('members', updated);
    // Audit log
    await this.addLog({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: 'user_admin_01',
      userName: 'المدير العام',
      action: existing ? 'تعديل مشترك' : 'إضافة مشترك جديد',
      entityType: 'member',
      entityId: member.id,
      description: existing
        ? `تعديل بيانات المشترك ${member.fullName} (${member.memberCode})`
        : `تسجيل العضو الجديد ${member.fullName} بكود ${member.memberCode}`
    });
    return updated;
  },
  async archiveMember(id: string): Promise<boolean> {
    const member = await this.getMemberById(id);
    if (!member) return false;
    member.status = 'archived';
    await putInStore('members', member);
    await this.addLog({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: 'user_admin_01',
      userName: 'المدير العام',
      action: 'أرشفة مشترك',
      entityType: 'member',
      entityId: id,
      description: `أرشفة حساب ${member.fullName}`
    });
    return true;
  },
  async restoreMember(id: string): Promise<boolean> {
    const member = await this.getMemberById(id);
    if (!member) return false;
    member.status = 'active';
    await putInStore('members', member);
    return true;
  },
  async deleteMemberPermanently(id: string): Promise<boolean> {
    return deleteFromStore('members', id);
  },

  // Groups
  async getGroups(): Promise<Group[]> {
    return getAllFromStore<Group>('groups');
  },
  async getGroupById(id: string): Promise<Group | undefined> {
    const all = await this.getGroups();
    return all.find((g) => g.id === id);
  },
  async saveGroup(group: Group): Promise<Group> {
    await putInStore('groups', group);
    return group;
  },
  async deleteGroup(id: string): Promise<boolean> {
    return deleteFromStore('groups', id);
  },

  // Group History
  async getGroupHistory(memberId?: string): Promise<GroupMembershipHistory[]> {
    const all = await getAllFromStore<GroupMembershipHistory>('groupHistory');
    if (memberId) {
      return all.filter((h) => h.memberId === memberId);
    }
    return all;
  },
  async addGroupHistory(item: GroupMembershipHistory): Promise<void> {
    await putInStore('groupHistory', item);
  },

  // Sessions
  async getSessions(): Promise<Session[]> {
    return getAllFromStore<Session>('sessions');
  },
  async saveSession(session: Session): Promise<Session> {
    await putInStore('sessions', session);
    return session;
  },
  async deleteSession(id: string): Promise<boolean> {
    return deleteFromStore('sessions', id);
  },

  // Attendance
  async getAttendance(date?: string): Promise<AttendanceRecord[]> {
    const all = await getAllFromStore<AttendanceRecord>('attendance');
    if (date) {
      return all.filter((a) => a.date === date);
    }
    return all;
  },
  async recordAttendance(rec: AttendanceRecord): Promise<{ success: boolean; duplicate?: boolean; record?: AttendanceRecord }> {
    const all = await getAllFromStore<AttendanceRecord>('attendance');
    // Duplicate check: Same member, same date, same session
    const existing = all.find(
      (a) => a.memberId === rec.memberId && a.date === rec.date && (!rec.sessionId || a.sessionId === rec.sessionId)
    );
    if (existing) {
      return { success: false, duplicate: true, record: existing };
    }
    await putInStore('attendance', rec);
    // Audit log
    await this.addLog({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: 'user_admin_01',
      userName: 'المدير العام',
      action: 'تسجيل حضور',
      entityType: 'attendance',
      entityId: rec.id,
      description: `تسجيل حضور المشترك ${rec.memberName} (${rec.status})`
    });
    return { success: true, record: rec };
  },
  async updateAttendance(rec: AttendanceRecord): Promise<void> {
    await putInStore('attendance', rec);
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    return getAllFromStore<Payment>('payments');
  },
  async addPayment(payment: Payment): Promise<Payment> {
    await putInStore('payments', payment);
    // Update member balance
    const member = await this.getMemberById(payment.memberId);
    if (member) {
      member.totalPaid = (member.totalPaid || 0) + payment.amount;
      member.balance = Math.max(0, (member.balance || 0) - payment.amount);
      await putInStore('members', member);
    }
    // Audit log
    await this.addLog({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: 'user_admin_01',
      userName: payment.recordedBy || 'المدير العام',
      action: 'تسجيل دفعة إيصال',
      entityType: 'payment',
      entityId: payment.id,
      description: `سداد مبلغ ${payment.amount} للمشترك ${payment.memberName} (إيصال رقم ${payment.receiptNumber})`
    });
    return payment;
  },

  // Subscriptions
  async getSubscriptions(): Promise<Subscription[]> {
    return getAllFromStore<Subscription>('subscriptions');
  },
  async saveSubscription(sub: Subscription): Promise<Subscription> {
    await putInStore('subscriptions', sub);
    return sub;
  },

  // Performance
  async getPerformance(memberId?: string): Promise<PerformanceEvaluation[]> {
    const all = await getAllFromStore<PerformanceEvaluation>('performance');
    if (memberId) {
      return all.filter((p) => p.memberId === memberId);
    }
    return all;
  },
  async addPerformance(perf: PerformanceEvaluation): Promise<PerformanceEvaluation> {
    await putInStore('performance', perf);
    return perf;
  },

  // Activity Logs
  async getLogs(): Promise<ActivityLog[]> {
    const logs = await getAllFromStore<ActivityLog>('logs');
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  async addLog(log: ActivityLog): Promise<void> {
    await putInStore('logs', log);
  },

  // Notifications
  async getNotifications(): Promise<InternalNotification[]> {
    return getAllFromStore<InternalNotification>('notifications');
  },
  async addNotification(notif: InternalNotification): Promise<void> {
    await putInStore('notifications', notif);
  },
  async markNotificationRead(id: string): Promise<void> {
    const all = await this.getNotifications();
    const item = all.find((n) => n.id === id);
    if (item) {
      item.read = true;
      await putInStore('notifications', item);
    }
  },
  async markAllNotificationsRead(): Promise<void> {
    const all = await this.getNotifications();
    for (const item of all) {
      item.read = true;
      await putInStore('notifications', item);
    }
  },

  // Users
  async getUsers(): Promise<User[]> {
    return getAllFromStore<User>('users');
  },
  async getUserById(id: string): Promise<User | undefined> {
    const all = await this.getUsers();
    return all.find((u) => u.id === id || u.username === id);
  },
  async saveUser(user: User): Promise<User> {
    await putInStore('users', user);
    return user;
  },
  async deleteUser(id: string): Promise<boolean> {
    return deleteFromStore('users', id);
  },

  // Settings & Organization
  async getSettings(): Promise<OrganizationConfig> {
    const all = await getAllFromStore<OrganizationConfig>('settings');
    if (all.length > 0) return all[0];
    return DEFAULT_ORG_SETTINGS;
  },
  async saveSettings(settings: OrganizationConfig): Promise<OrganizationConfig> {
    await putInStore('settings', settings);
    return settings;
  },
  async getOrganization(): Promise<OrganizationConfig> {
    return this.getSettings();
  },
  async saveOrganization(settings: OrganizationConfig): Promise<OrganizationConfig> {
    return this.saveSettings(settings);
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return getAllFromStore<Expense>('expenses');
  },
  async addExpense(expense: Expense): Promise<Expense> {
    await putInStore('expenses', expense);
    return expense;
  },
  async deleteExpense(id: string): Promise<boolean> {
    return deleteFromStore('expenses', id);
  },

  async initializeDatabaseIfEmpty(): Promise<void> {
    await initializeDatabaseIfEmpty();
  },

  // Custom Fields
  async getCustomFields(): Promise<CustomField[]> {
    return getAllFromStore<CustomField>('customFields');
  },
  async saveCustomField(field: CustomField): Promise<CustomField> {
    await putInStore('customFields', field);
    return field;
  },

  // Full Backup and Export
  async createFullBackup(): Promise<BackupData> {
    const org = await this.getSettings();
    const users = await this.getUsers();
    const members = await this.getMembers();
    const groups = await this.getGroups();
    const groupHistory = await this.getGroupHistory();
    const sessions = await this.getSessions();
    const attendance = await this.getAttendance();
    const payments = await this.getPayments();
    const subscriptions = await this.getSubscriptions();
    const performance = await this.getPerformance();
    const logs = await this.getLogs();
    const notifications = await this.getNotifications();
    const customFields = await this.getCustomFields();
    return {
      version: '1.0.0',
      appVersion: 'RCN MANAGER 1.0.0',
      createdAt: new Date().toISOString(),
      organization: org,
      users,
      members,
      groups,
      groupHistory,
      sessions,
      attendance,
      payments,
      subscriptions,
      performance,
      logs,
      notifications,
      customFields
    };
  },

  // Safe Restore
  async restoreBackup(data: BackupData, mode: 'replace' | 'merge' = 'replace'): Promise<{ success: boolean; message: string }> {
    try {
      if (!data || !data.organization || !Array.isArray(data.members)) {
        return { success: false, message: 'ملف النسخ الاحتياطي غير صالح أو تالف.' };
      }
      if (mode === 'replace') {
        const stores = [
          'members',
          'groups',
          'sessions',
          'attendance',
          'payments',
          'subscriptions',
          'performance',
          'logs',
          'notifications',
          'users',
          'settings',
          'groupHistory',
          'customFields'
        ];
        for (const s of stores) {
          await clearStore(s);
        }
      }

      if (data.organization) await putInStore('settings', data.organization);
      if (data.users) {
        for (const u of data.users) await putInStore('users', u);
      }
      if (data.groups) {
        for (const g of data.groups) await putInStore('groups', g);
      }
      if (data.members) {
        for (const m of data.members) await putInStore('members', m);
      }
      if (data.sessions) {
        for (const s of data.sessions) await putInStore('sessions', s);
      }
      if (data.attendance) {
        for (const a of data.attendance) await putInStore('attendance', a);
      }
      if (data.payments) {
        for (const p of data.payments) await putInStore('payments', p);
      }
      if (data.subscriptions) {
        for (const sub of data.subscriptions) await putInStore('subscriptions', sub);
      }
      if (data.performance) {
        for (const pf of data.performance) await putInStore('performance', pf);
      }
      if (data.logs) {
        for (const l of data.logs) await putInStore('logs', l);
      }
      if (data.notifications) {
        for (const n of data.notifications) await putInStore('notifications', n);
      }
      if (data.customFields) {
        for (const cf of data.customFields) await putInStore('customFields', cf);
      }
      return { success: true, message: 'تم استعادة قاعدة البيانات بنجاح.' };
    } catch (err: any) {
      console.error('Restore backup error:', err);
      return { success: false, message: 'فشلت الاستعادة: ' + (err?.message || 'خطأ غير معروف') };
    }
  },

  // Reset entire database
  async resetDatabase(): Promise<void> {
    const stores = [
      'members',
      'groups',
      'sessions',
      'attendance',
      'payments',
      'subscriptions',
      'performance',
      'logs',
      'notifications',
      'users',
      'settings',
      'groupHistory',
      'customFields'
    ];
    for (const s of stores) {
      await clearStore(s);
    }
    await initializeDatabaseIfEmpty();
  },

  // Aliases & Convenience Helpers
  async init(): Promise<void> {
    await initializeDatabaseIfEmpty();
  },
  async getActivityLogs(): Promise<ActivityLog[]> {
    return this.getLogs();
  },
  async exportFullBackup(): Promise<BackupData> {
    return this.createFullBackup();
  },
  async importFullBackup(data: BackupData): Promise<{ success: boolean; message: string }> {
    return this.restoreBackup(data);
  },
  async getStats(): Promise<Record<string, number>> {
    const [m, g, s, a, p] = await Promise.all([
      this.getMembers(),
      this.getGroups(),
      this.getSessions(),
      this.getAttendance(),
      this.getPayments()
    ]);
    return {
      members: m.length,
      groups: g.length,
      sessions: s.length,
      attendance: a.length,
      payments: p.length
    };
  }
};
