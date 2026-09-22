import { Member, InternalNotification } from '../types';
import { dbService } from './db';

export interface SubscriptionStatusInfo {
  status: 'active' | 'expiring_soon' | 'expired' | 'none';
  daysRemaining: number;
  labelAr: string;
  labelEn: string;
  badgeClass: string;
}

export function getSubscriptionStatus(member: Member): SubscriptionStatusInfo {
  if (!member.subscriptionEndDate) {
    return {
      status: 'none',
      daysRemaining: 0,
      labelAr: 'غير محدد',
      labelEn: 'Not Set',
      badgeClass: 'bg-neutral-800 text-neutral-400 border border-neutral-700'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(member.subscriptionEndDate);
  endDate.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'expired',
      daysRemaining,
      labelAr: `منتهي (منذ ${Math.abs(daysRemaining)} يوم)`,
      labelEn: `Expired (${Math.abs(daysRemaining)}d ago)`,
      badgeClass: 'bg-rose-950/80 text-rose-300 border border-rose-800'
    };
  }

  if (daysRemaining <= 3) {
    return {
      status: 'expiring_soon',
      daysRemaining,
      labelAr: daysRemaining === 0 ? 'ينتهي اليوم!' : `ينتهي قريباً (${daysRemaining} يوم)`,
      labelEn: daysRemaining === 0 ? 'Expires Today!' : `Expiring soon (${daysRemaining}d)`,
      badgeClass: 'bg-amber-950/80 text-amber-300 border border-amber-800'
    };
  }

  return {
    status: 'active',
    daysRemaining,
    labelAr: `ساري (${daysRemaining} يوم)`,
    labelEn: `Active (${daysRemaining}d)`,
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
  };
}

/**
 * Checks all members and generates internal notifications for expired/expiring subscriptions
 */
export async function syncSubscriptionNotifications(members: Member[], lang: 'ar' | 'en' = 'ar'): Promise<void> {
  try {
    const existingNotifs = await dbService.getNotifications();
    const todayStr = new Date().toISOString().split('T')[0];

    const newNotifs: InternalNotification[] = [];

    for (const member of members) {
      if (!member.subscriptionEndDate) continue;

      const info = getSubscriptionStatus(member);

      if (info.status === 'expired') {
        const notifId = `sub_exp_${member.id}_${todayStr}`;
        const alreadyExists = existingNotifs.some((n) => n.id === notifId || (n.memberId === member.id && n.date === todayStr && n.type === 'expiry'));

        if (!alreadyExists) {
          newNotifs.push({
            id: notifId,
            title: lang === 'ar' ? `انتهى اشتراك: ${member.fullName}` : `Subscription Expired: ${member.fullName}`,
            message: lang === 'ar'
              ? `انتهت صلاحية اشتراك المشترك (${member.memberCode}) بتاريخ ${member.subscriptionEndDate}، ويحتاج المشترك إلى التجديد.`
              : `Subscription for ${member.fullName} (${member.memberCode}) expired on ${member.subscriptionEndDate}. Renewal required.`,
            type: 'expiry',
            memberId: member.id,
            date: todayStr,
            read: false
          });
        }
      } else if (info.status === 'expiring_soon') {
        const notifId = `sub_soon_${member.id}_${todayStr}`;
        const alreadyExists = existingNotifs.some((n) => n.id === notifId || (n.memberId === member.id && n.date === todayStr && n.type === 'expiry'));

        if (!alreadyExists) {
          newNotifs.push({
            id: notifId,
            title: lang === 'ar' ? `اقتراب موعد تجديد: ${member.fullName}` : `Subscription Expiring Soon: ${member.fullName}`,
            message: lang === 'ar'
              ? `اشتراك المشترك (${member.memberCode}) ينتهي ${info.daysRemaining === 0 ? 'اليوم' : `خلال ${info.daysRemaining} أيام`} بتاريخ ${member.subscriptionEndDate}.`
              : `Subscription for ${member.fullName} (${member.memberCode}) expires ${info.daysRemaining === 0 ? 'today' : `in ${info.daysRemaining} days`} on ${member.subscriptionEndDate}.`,
            type: 'expiry',
            memberId: member.id,
            date: todayStr,
            read: false
          });
        }
      }
    }

    for (const n of newNotifs) {
      await dbService.addNotification(n);
    }
  } catch (err) {
    console.error('Failed to sync subscription notifications:', err);
  }
}
