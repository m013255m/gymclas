export type ActivityType =
  | 'educational_academy'
  | 'educational_center'
  | 'school'
  | 'nursery'
  | 'language_center'
  | 'training_center'
  | 'sports_academy'
  | 'football_academy'
  | 'gym_fitness'
  | 'sports_club'
  | 'company'
  | 'employee_management'
  | 'courses'
  | 'membership_org'
  | 'custom';

export interface ActivityTerminology {
  member: string;
  memberPlural: string;
  group: string;
  groupPlural: string;
  session: string;
  sessionPlural: string;
  instructor: string;
  performance: string;
  attendance: string;
}

export type UserRole = 'admin' | 'manager' | 'reception' | 'coach_teacher' | 'accountant' | 'coach' | 'receptionist';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export type SystemUser = User;

export interface UserPermission {
  viewMembers: boolean;
  createMembers: boolean;
  editMembers: boolean;
  archiveMembers: boolean;
  deleteMembers: boolean;
  viewAttendance: boolean;
  editAttendance: boolean;
  manageGroups: boolean;
  manageSessions: boolean;
  viewPayments: boolean;
  createPayments: boolean;
  editPayments: boolean;
  financialReports: boolean;
  performance: boolean;
  users: boolean;
  settings: boolean;
  backup: boolean;
  restore: boolean;
  activityLogs: boolean;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
  active?: boolean;
  createdAt: string;
  expiresAt?: string; // Account/license expiration date
  licenseExpiresAt?: string;
  isExpired?: boolean;
  duration?: string; // Specified duration for the user (e.g., '365 يوم' or '1 سنة')
  durationDays?: number;
}

export interface OrganizationConfig {
  id: string;
  name: string;
  subName?: string;
  logoUrl?: string;
  phone: string;
  email?: string;
  address: string;
  currency: string;
  language?: 'ar' | 'en';
  timezone?: string;
  activityType: ActivityType;
  customTerminology?: Partial<ActivityTerminology>;
  customTerms?: any;
  contactSupportPhone?: string; // 01060474659
  setupCompleted?: boolean;
  isConfigured?: boolean;
  updatedAt?: string;
}

export type MemberStatus = 'active' | 'inactive' | 'archived';

export interface Member {
  id: string;
  memberCode: string; // e.g. RCN-000152
  fullName: string;
  photoUrl?: string;
  phone: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  dateOfBirth?: string;
  gender: 'male' | 'female' | 'other';
  registrationDate: string;
  status: MemberStatus;
  currentGroupId?: string;
  subscriptionPlan?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionFee?: number;
  nationalId?: string;
  email?: string;
  emergencyContact?: string;
  bloodType?: string;
  healthStatus?: string;
  notes?: string;
  customFields?: Record<string, string | number | boolean>;
  qrCodeSafeData: string;
  totalPaid?: number;
  totalDue?: number;
  balance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  code?: string;
  name: string;
  instructorName: string;
  schedule: string;
  location?: string;
  capacity: number;
  description?: string;
  status?: 'active' | 'archived';
  active?: boolean;
  ageGroup?: string;
  ageRange?: string;
  monthlyFee?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface GroupMembershipHistory {
  id: string;
  memberId: string;
  previousGroupId?: string;
  previousGroupName?: string;
  newGroupId: string;
  newGroupName: string;
  date: string;
  time: string;
  changedBy: string;
  reason?: string;
}

export interface Session {
  id: string;
  title: string;
  subject?: string;
  groupId: string;
  groupName?: string;
  instructorName?: string;
  instructor?: string;
  room?: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  topic?: string;
  notes?: string;
  recurrence?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  completed?: boolean;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName?: string;
  memberCode?: string;
  sessionId?: string;
  sessionTitle?: string;
  groupId: string;
  groupName?: string;
  date: string;
  time: string;
  status: AttendanceStatus;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'other';

export interface Payment {
  id: string;
  receiptNumber: string;
  memberId: string;
  memberName?: string;
  memberCode?: string;
  amount: number;
  date: string;
  time: string;
  method: PaymentMethod;
  notes?: string;
  recordedBy: string;
  subscriptionId?: string;
  previousBalance?: number;
  remainingBalance?: number;
  createdAt: string;
}

export interface Subscription {
  id: string;
  memberId: string;
  name: string;
  price: number;
  duration: string; // 'monthly' | 'weekly' | 'quarterly' | 'annual' | 'custom'
  startDate: string;
  endDate: string;
  discount: number;
  totalPaid: number;
  balance: number;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  createdAt: string;
}

export interface PerformanceEvaluation {
  id: string;
  memberId: string;
  memberName?: string;
  date: string;
  evaluator: string;
  category: string;
  score: number; // 0 - 100
  rating: string;
  notes?: string;
  createdAt: string;
}

export interface InternalNotification {
  id: string;
  title: string;
  message: string;
  type: 'balance' | 'expiry' | 'absence' | 'payment' | 'backup' | 'info' | 'warning' | 'error';
  date: string;
  read: boolean;
  memberId?: string;
  link?: string;
  actionUrl?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'member' | 'group' | 'session' | 'attendance' | 'payment' | 'user' | 'backup' | 'settings';
  entityId?: string;
  description: string;
  previousValue?: string;
  newValue?: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'phone';
  required: boolean;
  options?: string[];
  displayOrder: number;
}

export interface BackupData {
  version: string;
  appVersion: string;
  createdAt: string;
  organization: OrganizationConfig;
  users: User[];
  members: Member[];
  groups: Group[];
  groupHistory: GroupMembershipHistory[];
  sessions: Session[];
  attendance: AttendanceRecord[];
  payments: Payment[];
  subscriptions: Subscription[];
  performance: PerformanceEvaluation[];
  logs: ActivityLog[];
  notifications: InternalNotification[];
  customFields: CustomField[];
}
