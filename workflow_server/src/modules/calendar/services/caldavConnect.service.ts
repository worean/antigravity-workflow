import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma } from '#lib/prisma.js';
import { testCalDavConnection, type CaldavConfig } from '#lib/caldavClient.js';
import { clearCalDavCache, syncCalDavInBackground } from './getCalDavEvents.service.js';
import { sendToUser } from '#lib/socket.js';

export interface CaldavConnectInput {
  serverUrl?: string;
  domain?: string;
  useSsl?: boolean;
  port?: number;
  username: string;
  password: string;
  calendarName?: string;
  color?: string;
  calendarColors?: Record<string, string>;
  calendarEnabled?: Record<string, boolean>;
}

export interface CaldavConnectResult {
  success: boolean;
  message: string;
  discoveredCalendars?: string[];
  account?: {
    serverUrl: string;
    domain?: string;
    useSsl?: boolean;
    username: string;
    calendarName: string;
    color: string;
    calendarColors?: Record<string, string>;
    calendarEnabled?: Record<string, boolean>;
  };
}

export const caldavConnectService = async (
  userId: number,
  input: CaldavConnectInput
): Promise<CaldavConnectResult> => {
  if (!userId) {
    throw new Error('인증 정보가 필요합니다.');
  }

  const {
    serverUrl,
    domain,
    useSsl = true,
    port,
    username,
    password,
    calendarName = '외부 CalDAV 달력',
    color = '#8a2be2',
  } = input;

  const rawHost = (domain || serverUrl || '').trim();
  if (!rawHost || !username || !password) {
    throw new Error('서버 도메인(또는 URL), 사용자 계정(아이디/이메일), 비밀번호를 모두 입력해주세요.');
  }

  // http/https 접두사 제거한 순수 도메인 추출
  const pureDomain = rawHost.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
  // 정규화된 전체 CalDAV URL 생성
  const { normalizeCaldavUrl } = await import('#lib/caldavClient.js');
  const normalizedUrl = normalizeCaldavUrl(rawHost, useSsl !== false, port);

  const config: CaldavConfig = {
    serverUrl: normalizedUrl,
    domain: pureDomain,
    useSsl: useSsl !== false,
    port,
    username: username.trim(),
    password: password.trim(),
    calendarName: calendarName.trim(),
    color: color.trim(),
    calendarColors: input.calendarColors,
    calendarEnabled: input.calendarEnabled,
  };

  // 1. CalDAV 서버 연결 및 인증 테스트
  const testRes = await testCalDavConnection(config);
  if (!testRes.success) {
    return {
      success: false,
      message: testRes.message,
    };
  }

  // 2. 계정 정보 JSON 암호화/직렬화하여 SocialAccount에 저장
  const configJson = JSON.stringify(config);
  const providerId = `caldav_${userId}`;

  let savedAccount: any = null;
  try {
    savedAccount = await globalPrisma.socialAccount.upsert({
      where: {
        provider_providerId: {
          provider: 'CALDAV',
          providerId,
        },
      },
      update: {
        email: config.username,
        accessToken: configJson,
      },
      create: {
        provider: 'CALDAV',
        providerId,
        email: config.username,
        accessToken: configJson,
        userId: Number(userId),
      },
    });
  } catch {
    // 테넌트 DB 폴백
    try {
      savedAccount = await prisma.socialAccount.upsert({
        where: {
          provider_providerId: {
            provider: 'CALDAV',
            providerId,
          },
        },
        update: {
          email: config.username,
          accessToken: configJson,
        },
        create: {
          provider: 'CALDAV',
          providerId,
          email: config.username,
          accessToken: configJson,
          userId: Number(userId),
        },
      });
    } catch {}
  }

  // 기존 캐시 초기화 및 새로 등록/수정된 계정의 일정 즉시 백그라운드 수집
  clearCalDavCache(userId);
  syncCalDavInBackground(userId, config, savedAccount).catch((err) => {
    console.warn('[CalDAV Connect] 초기 동기화 실패:', err.message);
  });

  return {
    success: true,
    message: testRes.message,
    discoveredCalendars: testRes.discoveredCalendars,
    account: {
      serverUrl: config.serverUrl || normalizedUrl,
      domain: config.domain,
      useSsl: config.useSsl,
      username: config.username,
      calendarName: config.calendarName || (testRes.calendarName || '외부 CalDAV 달력'),
      color: config.color || '#8a2be2',
      calendarColors: config.calendarColors,
      calendarEnabled: config.calendarEnabled,
    },
  };
};

/**
 * CalDAV 캘린더별 색상 및 설정 업데이트
 */
export const updateCalDavSettingsService = async (
  userId: number,
  settings: {
    calendarColors?: Record<string, string>;
    calendarEnabled?: Record<string, boolean>;
    color?: string;
    calendarName?: string;
  }
): Promise<{ success: boolean; calendarColors?: Record<string, string>; calendarEnabled?: Record<string, boolean> }> => {
  if (!userId) {
    throw new Error('인증 정보가 필요합니다.');
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
    throw new Error('연동된 CalDAV 계정을 찾을 수 없습니다.');
  }

  let config: CaldavConfig;
  try {
    config = JSON.parse(account.accessToken);
  } catch {
    throw new Error('계정 설정 파싱에 실패했습니다.');
  }

  if (settings.calendarColors) {
    config.calendarColors = {
      ...(config.calendarColors || {}),
      ...settings.calendarColors,
    };
  }
  if (settings.calendarEnabled) {
    config.calendarEnabled = {
      ...(config.calendarEnabled || {}),
      ...settings.calendarEnabled,
    };
  }
  if (settings.color) {
    config.color = settings.color;
  }
  if (settings.calendarName) {
    config.calendarName = settings.calendarName;
  }

  const updatedJson = JSON.stringify(config);

  try {
    await globalPrisma.socialAccount.update({
      where: { id: account.id },
      data: { accessToken: updatedJson },
    });
  } catch {
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: { accessToken: updatedJson },
    });
  }

  // 🚀 캐시 초기화 후 변경된 설정(색상, On/Off)으로 일정 즉시 재수집 및 캐시 갱신
  clearCalDavCache(userId);
  try {
    const updatedEvents = await syncCalDavInBackground(userId, config, account);
    sendToUser(Number(userId), 'calendar:synced', {
      timestamp: Date.now(),
      count: updatedEvents.length,
      reason: 'settings_updated',
    });
  } catch (err: any) {
    console.warn('[CalDAV Settings Update] 일정 재동기화 실패:', err.message);
  }

  return {
    success: true,
    calendarColors: config.calendarColors,
    calendarEnabled: config.calendarEnabled,
  };
};
