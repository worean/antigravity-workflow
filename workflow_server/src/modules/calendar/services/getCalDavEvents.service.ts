import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma } from '#lib/prisma.js';
import { fetchCalDavEvents, type CaldavConfig } from '#lib/caldavClient.js';
import { sendToUser } from '#lib/socket.js';
import type { CalendarEventDto } from './getCalendarEvents.service.js';

export type { CaldavConfig };

interface CalDavCacheEntry {
  events: CalendarEventDto[];
  lastSyncedAt: number;
  isSyncing: boolean;
}

// 사용자별 인메모리 캐시 (Stale-While-Revalidate 지원)
const caldavCacheMap = new Map<number, CalDavCacheEntry>();

// 캐시 유효 시간: 5분 (5분 동안은 외부 요청 없이 캐시 즉시 반환)
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * 캐시 초기화 (계정 연동 해제 등)
 */
export const clearCalDavCache = (userId: number) => {
  caldavCacheMap.delete(Number(userId));
};

/**
 * 사용자 CalDAV 설정 조회 헬퍼
 */
const loadUserAccountConfig = async (userId: number): Promise<{ account: any; config: CaldavConfig | null }> => {
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
    return { account: null, config: null };
  }

  try {
    const config: CaldavConfig = JSON.parse(account.accessToken);
    return { account, config };
  } catch {
    return { account, config: null };
  }
};

/**
 * DB에 백업 캐시 저장 (서버 재부팅 후에도 첫 방문 시 이전 일정 즉각 표시용)
 */
const saveBackupCacheToDatabase = async (
  userId: number,
  config: CaldavConfig,
  events: CalendarEventDto[],
  accountRecord?: any
) => {
  try {
    const backupConfig = {
      ...config,
      cachedEvents: events.slice(0, 150),
      lastSyncedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(backupConfig);

    if (accountRecord?.id) {
      try {
        await globalPrisma.socialAccount.update({
          where: { id: accountRecord.id },
          data: { accessToken: jsonStr },
        });
        return;
      } catch {}
      try {
        await prisma.socialAccount.update({
          where: { id: accountRecord.id },
          data: { accessToken: jsonStr },
        });
        return;
      } catch {}
    }

    const providerId = `caldav_${userId}`;
    try {
      await globalPrisma.socialAccount.updateMany({
        where: { provider: 'CALDAV', providerId },
        data: { accessToken: jsonStr },
      });
    } catch {}
    try {
      await prisma.socialAccount.updateMany({
        where: { provider: 'CALDAV', providerId },
        data: { accessToken: jsonStr },
      });
    } catch {}
  } catch (err: any) {
    console.warn(`[CalDAV Cache] DB 백업 캐시 저장 실패:`, err.message);
  }
};

/**
 * 백그라운드 비동기 CalDAV 일정 수집 및 캐시 갱신
 */
export const syncCalDavInBackground = async (
  userId: number,
  config: CaldavConfig,
  accountRecord?: any
): Promise<CalendarEventDto[]> => {
  const current = caldavCacheMap.get(Number(userId));
  if (current?.isSyncing) {
    console.log(`[CalDAV Background Sync] ⏳ 사용자 ${userId}의 일정 수집이 이미 백그라운드에서 진행 중입니다.`);
    return current.events;
  }

  // 동기화 진행 중 상태로 마킹 (기존 캐시된 이전 이벤트는 그대로 유지!)
  caldavCacheMap.set(Number(userId), {
    events: current?.events || [],
    lastSyncedAt: current?.lastSyncedAt || 0,
    isSyncing: true,
  });

  try {
    console.log(`[CalDAV Background Sync] 🌐 사용자 ${userId}의 CalDAV 일정 백그라운드 수집 시작...`);
    const rawEvents = await fetchCalDavEvents(config);
    const defaultCalColor = config.color || '#8a2be2';
    const calColors = config.calendarColors || {};
    const calName = config.calendarName || '외부 CalDAV 달력';

    const events: CalendarEventDto[] = rawEvents
      .filter((ev) => {
        if (ev.calendarName && config.calendarEnabled && config.calendarEnabled[ev.calendarName] === false) {
          return false;
        }
        return true;
      })
      .map((ev) => {
        const specificColor = (ev.calendarName && calColors[ev.calendarName]) || defaultCalColor;
        const cleanTitle = (ev.title || '').replace(/^\[CalDAV\]\s*/i, '').trim();

        return {
          id: `caldav_${ev.uid}`,
          title: cleanTitle,
          description: ev.description || null,
          startDate: ev.startDate,
          endDate: ev.endDate,
          type: 'caldav' as any,
          source: 'caldav' as any,
          location: ev.location || null,
          htmlLink: ev.url || null,
          status: ev.status || undefined,
          project: {
            id: -2,
            name: ev.calendarName || calName,
            key: ev.calendarName || 'CALDAV',
            color: specificColor,
          },
        };
      });

    // 메모리 캐시 갱신
    caldavCacheMap.set(Number(userId), {
      events,
      lastSyncedAt: Date.now(),
      isSyncing: false,
    });

    console.log(`[CalDAV Background Sync] ✅ 사용자 ${userId}의 CalDAV 일정 ${events.length}건 수집 및 캐시 갱신 완료`);

    // 영속 DB 백업 (비동기)
    saveBackupCacheToDatabase(userId, config, events, accountRecord).catch(() => {});

    // 실시간 접속 중인 클라이언트에 갱신 알림 전송
    try {
      sendToUser(Number(userId), 'calendar:synced', {
        timestamp: Date.now(),
        count: events.length,
        calendarName: calName,
      });
    } catch {}

    return events;
  } catch (err: any) {
    console.error(`[CalDAV Background Sync] ❌ 사용자 ${userId} 일정 수집 실패 (기존 캐시 유지):`, err.message || err);
    // 실패하더라도 기존 캐시 복원
    if (current) {
      caldavCacheMap.set(Number(userId), {
        ...current,
        isSyncing: false,
      });
    } else {
      caldavCacheMap.delete(Number(userId));
    }
    return current?.events || [];
  }
};

/**
 * CalDAV 일정 조회 (캐시 우선 반환 & 백그라운드 비동기 동기화)
 */
export const getCalDavEventsService = async (
  userId: number,
  filter: { startDate?: string; endDate?: string; forceRefresh?: boolean } = {}
): Promise<CalendarEventDto[]> => {
  if (!userId) {
    return [];
  }

  // 1. 메모리 캐시 확인
  let cached = caldavCacheMap.get(Number(userId));
  let loadedAccount: any = null;
  let loadedConfig: any = null;

  // 2. 메모리 캐시가 없으면 DB에 저장된 이전 백업 캐시 복원 시도
  if (!cached) {
    const { account, config } = await loadUserAccountConfig(userId);
    loadedAccount = account;
    loadedConfig = config;

    if (!config) {
      return [];
    }

    if (Array.isArray((config as any).cachedEvents) && (config as any).cachedEvents.length > 0) {
      cached = {
        events: (config as any).cachedEvents,
        lastSyncedAt: (config as any).lastSyncedAt ? new Date((config as any).lastSyncedAt).getTime() : Date.now(),
        isSyncing: false,
      };
      caldavCacheMap.set(Number(userId), cached);
      console.log(`[CalDAV Cache] 📦 사용자 ${userId}의 이전 저장된 CalDAV 일정 ${cached.events.length}건을 즉시 복원했습니다.`);
    }
  }

  // 3. 캐시가 존재하는 경우: 이전 일정들을 즉시 반환(0ms)하고 백그라운드에서 동기화 진행
  if (cached && cached.events.length > 0) {
    const isStale = Date.now() - cached.lastSyncedAt > CACHE_TTL_MS;

    if ((isStale || filter.forceRefresh) && !cached.isSyncing) {
      // 🚀 백그라운드 비동기 실행 (await 하지 않음 -> 즉시 이전 데이터 반환!)
      (async () => {
        let conf = loadedConfig;
        let acc = loadedAccount;
        if (!conf) {
          const res = await loadUserAccountConfig(userId);
          conf = res.config;
          acc = res.account;
        }
        if (conf) {
          await syncCalDavInBackground(userId, conf, acc);
        }
      })().catch((err) => {
        console.warn(`[CalDAV Background Sync Trigger Warning]`, err);
      });
    }

    // 대기 없이 이전 캘린더 항목들 즉시 반환
    return cached.events;
  }

  // 4. 캐시가 전혀 없는 최초 1회: 초기 동기화 대기 후 반환
  if (!loadedConfig) {
    const { account, config } = await loadUserAccountConfig(userId);
    loadedAccount = account;
    loadedConfig = config;
  }

  if (!loadedConfig) {
    return [];
  }

  return await syncCalDavInBackground(userId, loadedConfig, loadedAccount);
};

/**
 * 수동 즉시 동기화 서비스 (CalDAV 새로고침 버튼 트리거용)
 */
export const forceSyncCalDavService = async (userId: number): Promise<CalendarEventDto[]> => {
  if (!userId) return [];
  const { account, config } = await loadUserAccountConfig(userId);
  if (!config) return [];

  // 인메모리 락 해제 후 즉시 강제 수집
  const current = caldavCacheMap.get(Number(userId));
  if (current) {
    current.isSyncing = false;
  }

  return await syncCalDavInBackground(userId, config, account);
};
