import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma } from '#lib/prisma.js';
import { syncCalDavInBackground, type CaldavConfig } from './getCalDavEvents.service.js';

let periodicTimer: NodeJS.Timeout | null = null;

// 기본 동기화 주기: 10분 (600,000ms)
const DEFAULT_SYNC_INTERVAL_MS = 10 * 60 * 1000;

/**
 * 등록된 모든 CalDAV 계정을 순차적으로 백그라운드 동기화
 */
export const syncAllRegisteredCalDavAccounts = async (): Promise<{ total: number; success: number }> => {
  let accounts: any[] = [];
  try {
    accounts = await globalPrisma.socialAccount.findMany({
      where: { provider: 'CALDAV' },
    });
  } catch {}

  if (accounts.length === 0) {
    try {
      accounts = await prisma.socialAccount.findMany({
        where: { provider: 'CALDAV' },
      });
    } catch {}
  }

  // 중복 사용자 계정 제거 (동일 userId 중복 sync 방지)
  const userAccountMap = new Map<number, any>();
  for (const acc of accounts) {
    if (acc.userId && acc.accessToken && !userAccountMap.has(acc.userId)) {
      userAccountMap.set(acc.userId, acc);
    }
  }

  const uniqueAccounts = Array.from(userAccountMap.values());
  if (uniqueAccounts.length === 0) {
    return { total: 0, success: 0 };
  }

  console.log(`⏰ [CalDAV Periodic Sync] 총 ${uniqueAccounts.length}개의 CalDAV 계정 정기 자동 동기화 시작...`);
  let successCount = 0;

  for (const acc of uniqueAccounts) {
    try {
      const config: CaldavConfig = JSON.parse(acc.accessToken);
      if (!config.username || (!config.serverUrl && !config.domain)) continue;

      await syncCalDavInBackground(acc.userId, config, acc);
      successCount++;
    } catch (err: any) {
      console.warn(`⚠️ [CalDAV Periodic Sync] 사용자 ID ${acc.userId} 동기화 건너뜀:`, err.message || err);
    }
  }

  console.log(`✅ [CalDAV Periodic Sync] 완료: ${successCount}/${uniqueAccounts.length} 계정 동기화 완료.`);
  return { total: uniqueAccounts.length, success: successCount };
};

/**
 * 서버 기동 시 CalDAV 백그라운드 주기적 동기화 타이머 시작
 */
export const startCalDavPeriodicSync = (intervalMs: number = DEFAULT_SYNC_INTERVAL_MS): void => {
  if (periodicTimer) return;

  const envIntervalMin = parseInt(process.env.CALDAV_SYNC_INTERVAL_MINUTES || '', 10);
  const effectiveIntervalMs = !isNaN(envIntervalMin) && envIntervalMin > 0
    ? envIntervalMin * 60 * 1000
    : intervalMs;

  console.log(`🕒 [CalDAV Scheduler] CalDAV 자동 동기화 스케줄러 등록 (주기: ${Math.round(effectiveIntervalMs / 60000)}분)`);

  // 서버 기동 후 최초 1분 뒤 1회 초기 갱신, 이후 주기마다 실행
  const initialDelayTimer = setTimeout(() => {
    syncAllRegisteredCalDavAccounts().catch(() => {});
  }, 60 * 1000);
  if (initialDelayTimer.unref) initialDelayTimer.unref();

  periodicTimer = setInterval(() => {
    syncAllRegisteredCalDavAccounts().catch(() => {});
  }, effectiveIntervalMs);

  if (periodicTimer.unref) periodicTimer.unref();
};

/**
 * CalDAV 주기적 동기화 타이머 종료
 */
export const stopCalDavPeriodicSync = (): void => {
  if (periodicTimer) {
    clearInterval(periodicTimer);
    periodicTimer = null;
    console.log(`🛑 [CalDAV Scheduler] CalDAV 자동 동기화 스케줄러 정지됨.`);
  }
};
