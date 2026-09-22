import React, { useState } from 'react';
import {
  Layers,
  Users,
  Plus,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  UserCheck,
  Search,
  CheckCircle2
} from 'lucide-react';
import { Group, Member, OrganizationConfig } from '../types';
import { dbService } from '../lib/db';

interface GroupsViewProps {
  groups: Group[];
  members: Member[];
  organization: OrganizationConfig | null;
  lang: 'ar' | 'en';
  onRefresh: () => void;
  onFilterByGroup?: (groupId: string) => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  groups,
  members,
  organization,
  lang,
  onRefresh,
  onFilterByGroup
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  // Group Form State
  const [name, setName] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [capacity, setCapacity] = useState('30');
  const [ageRange, setAgeRange] = useState('من 10 إلى 15 سنة');

  const openAdd = () => {
    setEditingGroup(null);
    setName('');
    setInstructorName('');
    setSchedule('');
    setCapacity('30');
    setAgeRange('من 10 إلى 15 سنة');
    setShowAddModal(true);
  };

  const openEdit = (g: Group) => {
    setEditingGroup(g);
    setName(g.name);
    setInstructorName(g.instructorName);
    setSchedule(g.schedule);
    setCapacity(String(g.capacity));
    setAgeRange(g.ageRange || '');
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingGroup) {
      await dbService.saveGroup({
        ...editingGroup,
        name: name.trim(),
        instructorName: instructorName.trim(),
        schedule: schedule.trim(),
        capacity: parseInt(capacity) || 30,
        ageRange: ageRange.trim()
      });
    } else {
      const newGroup: Group = {
        id: 'grp_' + Date.now(),
        name: name.trim(),
        instructorName: instructorName.trim() || 'كابتن / مدرب',
        schedule: schedule.trim() || 'السبت والإثنين والأربعاء',
        capacity: parseInt(capacity) || 30,
        ageRange: ageRange.trim(),
        status: 'active',
        createdAt: new Date().toISOString()
      };
      await dbService.saveGroup(newGroup);
    }

    setShowAddModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-5 animate-in fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">{lang === 'ar' ? 'إدارة المجموعات والفرق' : 'Groups & Teams'}</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {lang === 'ar' ? 'تنظيم الفرق، المواعيد، المدربين وسعة كل مجموعة' : 'Manage groups, trainers and schedules'}
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ar' ? 'إضافة مجموعة جديدة' : 'Add Group'}</span>
        </button>
      </div>

      {/* Grid of Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => {
          const groupMemberCount = members.filter((m) => m.currentGroupId === group.id && m.status !== 'archived').length;
          const occupancyRate = group.capacity ? Math.round((groupMemberCount / group.capacity) * 100) : 0;

          return (
            <div
              key={group.id}
              className="bg-neutral-900/90 border border-neutral-800 hover:border-neutral-750 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-base text-white">{group.name}</h3>
                    <span className="text-xs text-neutral-400 font-semibold block">
                      {lang === 'ar' ? `المدرب: ${group.instructorName}` : `Instructor: ${group.instructorName}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(group)}
                    className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs space-y-1.5 text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{group.schedule}</span>
                  </div>
                  {group.ageRange && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      <span>الفئة: {group.ageRange}</span>
                    </div>
                  )}
                </div>

                {/* Progress bar of group capacity */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>{lang === 'ar' ? 'المشتركين المسجلين:' : 'Registered:'}</span>
                    <span className="font-mono font-bold text-white">
                      {groupMemberCount} / {group.capacity}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className={`h-full ${occupancyRate >= 90 ? 'bg-rose-500' : 'bg-white'}`}
                      style={{ width: `${Math.min(100, occupancyRate)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <span className="text-neutral-500">
                  {occupancyRate >= 100 ? 'مكتملة' : `متبقي ${group.capacity - groupMemberCount} أماكن`}
                </span>
                {onFilterByGroup && (
                  <button
                    type="button"
                    onClick={() => onFilterByGroup(group.id)}
                    className="text-white hover:underline font-semibold"
                  >
                    {lang === 'ar' ? 'عرض الأعضاء' : 'View Members'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4 text-white">
            <h2 className="text-base font-bold">
              {editingGroup ? (lang === 'ar' ? 'تعديل بيانات المجموعة' : 'Edit Group') : (lang === 'ar' ? 'إضافة مجموعة جديدة' : 'New Group')}
            </h2>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">اسم المجموعة / الفريق *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: فريق البراعم (أ)"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">اسم المدرب / المشرف</label>
                <input
                  type="text"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="اسم الكابتن"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">المواعيد والأيام</label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="مثال: السبت والإثنين والأربعاء (5:00 م)"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">السعة القصوى (العدد)</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">الفئة السنية</label>
                  <input
                    type="text"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    placeholder="مواليد 2012 - 2015"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 bg-neutral-900 text-neutral-300 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-white text-black font-bold rounded-xl hover:bg-neutral-200"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
