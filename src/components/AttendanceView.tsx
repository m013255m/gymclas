import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckSquare,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Printer,
  Sparkles,
  Search
} from 'lucide-react';
import { AttendanceRecord, Group, Member, OrganizationConfig, Session } from '../types';
import { dbService } from '../lib/db';

interface AttendanceViewProps {
  members: Member[];
  groups: Group[];
  sessions: Session[];
  organization: OrganizationConfig | null;
  lang: 'ar' | 'en';
  onRefresh: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  members,
  groups,
  sessions,
  organization,
  lang,
  onRefresh
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || 'all');
  const [search, setSearch] = useState('');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: 'present' | 'absent' | 'late' | 'excused'; time?: string; lateMinutes?: number }>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load existing attendance records for the selected date
  useEffect(() => {
    const loadRecords = async () => {
      const records = await dbService.getAttendance(selectedDate);
      const map: Record<string, any> = {};
      records.forEach((r) => {
        map[r.memberId] = {
          status: r.status,
          time: r.time
        };
      });
      setAttendanceMap(map);
    };
    loadRecords();
  }, [selectedDate]);

  // Group members
  const groupMembers = useMemo(() => {
    return members.filter((m) => {
      if (m.status === 'archived') return false;
      if (selectedGroupId !== 'all' && m.currentGroupId !== selectedGroupId) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!m.fullName.toLowerCase().includes(q) && !m.memberCode.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [members, selectedGroupId, search]);

  // Handle single member status change
  const setMemberStatus = async (memberId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    const currentTime = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    const member = members.find((m) => m.id === memberId);
    const group = groups.find((g) => g.id === member?.currentGroupId);

    const newMap = {
      ...attendanceMap,
      [memberId]: {
        status,
        time: status === 'present' || status === 'late' ? currentTime : undefined
      }
    };
    setAttendanceMap(newMap);

    const record: AttendanceRecord = {
      id: `att_${selectedDate}_${memberId}`,
      memberId,
      memberName: member?.fullName || '',
      memberCode: member?.memberCode || '',
      groupId: member?.currentGroupId || '',
      groupName: group?.name || '',
      date: selectedDate,
      time: currentTime,
      status,
      recordedBy: 'المدير العام',
      createdAt: new Date().toISOString()
    };
    await dbService.recordAttendance(record);
    onRefresh();
  };

  // Bulk mark all present
  const handleBulkMark = async (status: 'present' | 'absent') => {
    setIsSaving(true);
    const currentTime = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    const updatedMap = { ...attendanceMap };

    for (const m of groupMembers) {
      updatedMap[m.id] = { status, time: status === 'present' ? currentTime : undefined };
      const group = groups.find((g) => g.id === m.currentGroupId);
      await dbService.recordAttendance({
        id: `att_${selectedDate}_${m.id}`,
        memberId: m.id,
        memberName: m.fullName,
        memberCode: m.memberCode,
        groupId: m.currentGroupId || '',
        groupName: group?.name || '',
        date: selectedDate,
        time: currentTime,
        status,
        recordedBy: 'تحضير جماعي',
        createdAt: new Date().toISOString()
      });
    }

    setAttendanceMap(updatedMap);
    setIsSaving(false);
    onRefresh();
  };

  // Summary counts
  const presentCount = groupMembers.filter((m) => attendanceMap[m.id]?.status === 'present').length;
  const absentCount = groupMembers.filter((m) => attendanceMap[m.id]?.status === 'absent').length;
  const lateCount = groupMembers.filter((m) => attendanceMap[m.id]?.status === 'late').length;
  const excusedCount = groupMembers.filter((m) => attendanceMap[m.id]?.status === 'excused').length;
  const unrecordedCount = groupMembers.length - (presentCount + absentCount + lateCount + excusedCount);
  const totalRecorded = presentCount + absentCount + lateCount + excusedCount;
  const attendanceRate = totalRecorded > 0 ? Math.round((presentCount / totalRecorded) * 100) : 0;

  return (
    <div className="space-y-5 animate-in fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">{lang === 'ar' ? 'سجل الحضور والغياب' : 'Attendance Registry'}</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {lang === 'ar' ? 'تسجيل ومتابعة حضور المشتركين يومياً أو حسب الحصة' : 'Track and manage member attendance'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'طباعة الكشف' : 'Print Sheet'}</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Date, Group, Search & Bulk Actions */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {lang === 'ar' ? 'التاريخ' : 'Date'}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {lang === 'ar' ? 'المجموعة' : 'Group'}
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="all">{lang === 'ar' ? 'كل المجموعات' : 'All Groups'}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.instructorName})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {lang === 'ar' ? 'البحث عن مشترك' : 'Search Member'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute top-2.5 left-3 rtl:right-3 rtl:left-auto" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'الاسم أو الكود...' : 'Search...'}
                className="w-full bg-black border border-neutral-700 rounded-xl px-9 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Stats Row & Bulk actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-800 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'ar' ? `حاضر: ${presentCount}` : `Present: ${presentCount}`}</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <XCircle className="w-4 h-4" />
              <span>{lang === 'ar' ? `غائب: ${absentCount}` : `Absent: ${absentCount}`}</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Clock className="w-4 h-4" />
              <span>{lang === 'ar' ? `متأخر: ${lateCount}` : `Late: ${lateCount}`}</span>
            </span>
            <span className="text-neutral-400">
              {lang === 'ar' ? `غير مسجل: ${unrecordedCount}` : `Unrecorded: ${unrecordedCount}`}
            </span>
            <span className="px-2 py-0.5 bg-neutral-800 rounded font-mono font-bold text-white">
              {attendanceRate}% {lang === 'ar' ? 'نسبة الحضور' : 'Rate'}
            </span>
          </div>

          {/* Bulk quick mark */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleBulkMark('present')}
              className="px-3 py-1.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg hover:bg-emerald-900 font-semibold transition"
            >
              {lang === 'ar' ? 'تحضير الكل' : 'Mark All Present'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleBulkMark('absent')}
              className="px-3 py-1.5 bg-rose-950 text-rose-300 border border-rose-800 rounded-lg hover:bg-rose-900 font-semibold transition"
            >
              {lang === 'ar' ? 'تغييب الكل' : 'Mark All Absent'}
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Registry Container */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Mobile View: Quick-Tap Attendance Cards */}
        <div className="block md:hidden divide-y divide-neutral-800/80">
          {groupMembers.map((m) => {
            const currentAtt = attendanceMap[m.id];
            const group = groups.find((g) => g.id === m.currentGroupId);
            return (
              <div key={m.id} className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={m.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName)}&background=222&color=fff`}
                      alt={m.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-neutral-700 shrink-0"
                    />
                    <div>
                      <span className="font-bold text-sm text-white block">{m.fullName}</span>
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                        <span className="font-mono text-neutral-300 font-bold">{m.memberCode}</span>
                        <span>•</span>
                        <span className="truncate max-w-[120px]">{group?.name || '-'}</span>
                      </div>
                    </div>
                  </div>
                  {currentAtt?.time && (
                    <span className="text-[10px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                      {currentAtt.time}
                    </span>
                  )}
                </div>

                {/* Status Selection Buttons */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setMemberStatus(m.id, 'present')}
                    className={`py-2 rounded-xl font-bold text-xs transition ${
                      currentAtt?.status === 'present'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-neutral-950 text-neutral-400 border border-neutral-800 active:border-emerald-600'
                    }`}
                  >
                    {lang === 'ar' ? 'حاضر' : 'Present'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberStatus(m.id, 'absent')}
                    className={`py-2 rounded-xl font-bold text-xs transition ${
                      currentAtt?.status === 'absent'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-neutral-950 text-neutral-400 border border-neutral-800 active:border-rose-600'
                    }`}
                  >
                    {lang === 'ar' ? 'غائب' : 'Absent'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberStatus(m.id, 'late')}
                    className={`py-2 rounded-xl font-semibold text-xs transition ${
                      currentAtt?.status === 'late'
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-neutral-950 text-neutral-400 border border-neutral-800 active:border-amber-600'
                    }`}
                  >
                    {lang === 'ar' ? 'متأخر' : 'Late'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberStatus(m.id, 'excused')}
                    className={`py-2 rounded-xl font-semibold text-xs transition ${
                      currentAtt?.status === 'excused'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-neutral-950 text-neutral-400 border border-neutral-800 active:border-blue-600'
                    }`}
                  >
                    {lang === 'ar' ? 'مأذون' : 'Excused'}
                  </button>
                </div>
              </div>
            );
          })}
          {groupMembers.length === 0 && (
            <div className="p-8 text-center text-neutral-500 text-xs">
              {lang === 'ar' ? 'لا يوجد أعضاء في هذه المجموعة' : 'No members in this group'}
            </div>
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-start">
          <thead className="bg-black/60 text-neutral-400 border-b border-neutral-800 font-semibold">
            <tr>
              <th className="p-3.5 text-start">{lang === 'ar' ? 'المشترك' : 'Member'}</th>
              <th className="p-3.5 text-start">{lang === 'ar' ? 'كود المشترك' : 'Member Code'}</th>
              <th className="p-3.5 text-start">{lang === 'ar' ? 'المجموعة' : 'Group'}</th>
              <th className="p-3.5 text-start">{lang === 'ar' ? 'وقت الدخول' : 'Time'}</th>
              <th className="p-3.5 text-center">{lang === 'ar' ? 'حالة الحضور' : 'Attendance Status'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80">
            {groupMembers.map((m) => {
              const currentAtt = attendanceMap[m.id];
              const group = groups.find((g) => g.id === m.currentGroupId);
              return (
                <tr key={m.id} className="hover:bg-black/40">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={m.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName)}&background=222&color=fff`}
                        alt={m.fullName}
                        className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                      />
                      <div>
                        <span className="font-bold text-white block">{m.fullName}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">{m.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-neutral-300">
                    {m.memberCode}
                  </td>
                  <td className="p-3.5 text-neutral-300">
                    {group?.name || '-'}
                  </td>
                  <td className="p-3.5 font-mono text-neutral-400">
                    {currentAtt?.time || '-'}
                  </td>
                  {/* 4 Status Buttons (Present, Absent, Late, Excused) */}
                  <td className="p-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMemberStatus(m.id, 'present')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${
                          currentAtt?.status === 'present'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-emerald-700'
                        }`}
                      >
                        {lang === 'ar' ? 'حاضر' : 'Present'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberStatus(m.id, 'absent')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${
                          currentAtt?.status === 'absent'
                            ? 'bg-rose-600 text-white shadow'
                            : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-rose-700'
                        }`}
                      >
                        {lang === 'ar' ? 'غائب' : 'Absent'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberStatus(m.id, 'late')}
                        className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition ${
                          currentAtt?.status === 'late'
                            ? 'bg-amber-600 text-white shadow'
                            : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-amber-700'
                        }`}
                      >
                        {lang === 'ar' ? 'متأخر' : 'Late'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberStatus(m.id, 'excused')}
                        className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition ${
                          currentAtt?.status === 'excused'
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-blue-700'
                        }`}
                      >
                        {lang === 'ar' ? 'مأذون' : 'Excused'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {groupMembers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500 text-xs">
                  {lang === 'ar' ? 'لا يوجد أعضاء في هذه المجموعة' : 'No members in this group'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
