import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma } from '#lib/prisma.js';
import type { CaldavConfig } from '#lib/caldavClient.js';

export interface CaldavStatusResult {
  isConnected: boolean;
  serverUrl?: string;
  domain?: string;
  useSsl?: boolean;
  username?: string;
  calendarName?: string;
  color?: string;
  calendarColors?: Record<string, string>;
  calendarEnabled?: Record<string, boolean>;
  discoveredCalendars?: string[];
  lastSyncedAt?: string | null;
}

export const getCalDavStatusService = async (
  userId: number
): Promise<CaldavStatusResult> => {
  if (!userId) {
    return { isConnected: false };
  }

  let account: any = null;
  try {
    account = await globalPrisma.socialAccount.findFirst({
      where: { userId: Number(userId), provider: 'CALDAV' },
    });
  } catch {}

  if (!account) {
    try {
      account = await prisma.socialAccount.findFirst({
        where: { userId: Number(userId), provider: 'CALDAV' },
      });
    } catch {}
  }

  if (!account || !account.accessToken) {
    return { isConnected: false };
  }

  try {
    const config: CaldavConfig = JSON.parse(account.accessToken);
    let discoveredCalendars: string[] | undefined = undefined;
    try {
      const { discoverCalDavCalendars } = await import('#lib/caldavClient.js');
      const discovered = await discoverCalDavCalendars(config);
      if (discovered.length > 0) {
        discoveredCalendars = discovered.map((c) => c.name);
      }
    } catch {}

    const pureDomain =
      config.domain ||
      (config.serverUrl ? config.serverUrl.replace(/^https?:\/\//i, '').split('/')[0] : undefined);

    return {
      isConnected: true,
      serverUrl: config.serverUrl,
      domain: pureDomain,
      useSsl: config.useSsl !== false,
      username: config.username,
      calendarName: config.calendarName || '외부 CalDAV 달력',
      color: config.color || '#8a2be2',
      calendarColors: config.calendarColors || {},
      calendarEnabled: config.calendarEnabled || {},
      discoveredCalendars,
      lastSyncedAt: account.updatedAt ? new Date(account.updatedAt).toISOString() : null,
    };
  } catch {
    return { isConnected: false };
  }
};
