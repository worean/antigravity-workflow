import { parseIcsCalendar, formatDateToIcal } from './icalHelper.js';

export interface CaldavConfig {
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

export interface DiscoveredCalendar {
  name: string;
  url: string;
  href: string;
}

export interface CaldavEventResult {
  uid: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  status?: string;
  location?: string | null;
  url?: string | null;
  calendarName?: string;
}

/**
 * Basic Auth 헤더 생성
 */
export function getBasicAuthHeader(username: string, password: string): string {
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${token}`;
}

/**
 * URL 정규화 (도메인만 입력된 경우 https/http 자동 부착 및 트레일링 슬래시 정제)
 */
export function normalizeCaldavUrl(urlOrDomain: string, useSsl: boolean = true, port?: number): string {
  let clean = (urlOrDomain || '').trim();
  // 사용자가 이미 프로토콜(http/https)을 포함한 경우
  if (/^https?:\/\//i.test(clean)) {
    return clean.replace(/\/+$/, '');
  }
  // 도메인(호스트)만 입력한 경우 (예: hanilprotech.daouoffice.com)
  const protocol = useSsl ? 'https://' : 'http://';
  let full = `${protocol}${clean}`.replace(/\/+$/, '');
  if (port && !clean.includes(':')) {
    try {
      const u = new URL(full);
      u.port = String(port);
      full = u.toString().replace(/\/+$/, '');
    } catch {}
  }
  return full;
}

/**
 * CalDAV REPORT XML 쿼리 바디 생성 (RFC 4791)
 */
export function buildCalDavReportQuery(startDate?: string, endDate?: string): string {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 6, 1);

  const startIcal = formatDateToIcal(startDate ? new Date(startDate) : defaultStart);
  const endIcal = formatDateToIcal(endDate ? new Date(endDate) : defaultEnd);

  return `<?xml version="1.0" encoding="utf-8" ?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag />
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${startIcal}" end="${endIcal}" />
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;
}

/**
 * CalDAV Multi-Status XML 응답에서 <calendar-data> 블록들 추출
 */
export function extractCalendarDataFromXml(xml: string): string[] {
  const results: string[] = [];
  if (!xml) return results;

  const regex = /<(?:\w+:)?calendar-data(?:[^>]*)>([\s\S]*?)<\/(?:\w+:)?calendar-data>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    let content = match[1].trim();
    if (content.startsWith('<![CDATA[') && content.endsWith(']]>')) {
      content = content.substring(9, content.length - 3).trim();
    }
    content = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");

    if (content.includes('BEGIN:VCALENDAR') || content.includes('BEGIN:VEVENT')) {
      results.push(content);
    }
  }

  return results;
}

/**
 * RFC 6764 표준 CalDAV 서비스 자동 탐색 (Service Discovery)
 * 1) /.well-known/caldav 탐색 -> current-user-principal 추출
 * 2) principal -> calendar-home-set 추출
 * 3) calendar-home-set -> 하위 calendar 컬렉션 목록(회의일정, 개별일정 등) 추출
 */
export async function discoverCalDavCalendars(config: CaldavConfig): Promise<DiscoveredCalendar[]> {
  const target = config.serverUrl || config.domain || '';
  const rootUrl = normalizeCaldavUrl(target, config.useSsl !== false, config.port);
  const authHeader = getBasicAuthHeader(config.username, config.password);
  const baseUrl = new URL(rootUrl);

  const calendars: DiscoveredCalendar[] = [];

  try {
    // Step 1: current-user-principal 탐색
    let principalHref: string | null = null;

    // 1-1. /.well-known/caldav 호출
    const wellKnownUrl = new URL('/.well-known/caldav', baseUrl.origin).toString();
    try {
      const wkRes = await fetch(wellKnownUrl, {
        method: 'PROPFIND',
        headers: {
          Authorization: authHeader,
          Depth: '0',
          'Content-Type': 'application/xml; charset=utf-8',
        },
        body: `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:">
  <d:prop><d:current-user-principal /></d:prop>
</d:propfind>`,
      });

      if (wkRes.status === 207 || wkRes.ok) {
        const wkXml = await wkRes.text();
        const pMatch = wkXml.match(/<(?:\w+:)?current-user-principal[^>]*>[\s\S]*?<(?:\w+:)?href[^>]*>([^<]+)<\//i);
        if (pMatch && pMatch[1]) {
          principalHref = pMatch[1].trim();
        }
      }
    } catch {}

    // 1-2. fallback: 직접 rootUrl 시도
    if (!principalHref) {
      try {
        const rootRes = await fetch(rootUrl, {
          method: 'PROPFIND',
          headers: {
            Authorization: authHeader,
            Depth: '0',
            'Content-Type': 'application/xml; charset=utf-8',
          },
          body: `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:">
  <d:prop><d:current-user-principal /></d:prop>
</d:propfind>`,
        });

        if (rootRes.status === 207 || rootRes.ok) {
          const rootXml = await rootRes.text();
          const pMatch = rootXml.match(/<(?:\w+:)?current-user-principal[^>]*>[\s\S]*?<(?:\w+:)?href[^>]*>([^<]+)<\//i);
          if (pMatch && pMatch[1]) {
            principalHref = pMatch[1].trim();
          }
        }
      } catch {}
    }

    if (!principalHref) {
      // 일반적인 CalDAV 경로 추정
      principalHref = `/principals/users/${config.username}/`;
    }

    // Step 2: calendar-home-set 탐색
    let homeHref: string | null = null;
    const principalUrl = new URL(principalHref, baseUrl.origin).toString();

    try {
      const pRes = await fetch(principalUrl, {
        method: 'PROPFIND',
        headers: {
          Authorization: authHeader,
          Depth: '0',
          'Content-Type': 'application/xml; charset=utf-8',
        },
        body: `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop><c:calendar-home-set /></d:prop>
</d:propfind>`,
      });

      if (pRes.status === 207 || pRes.ok) {
        const pXml = await pRes.text();
        const hMatch = pXml.match(/<(?:\w+:)?calendar-home-set[^>]*>[\s\S]*?<(?:\w+:)?href[^>]*>([^<]+)<\//i);
        if (hMatch && hMatch[1]) {
          homeHref = hMatch[1].trim();
        }
      }
    } catch {}

    if (!homeHref) {
      homeHref = `${principalHref.replace(/\/$/, '')}/calendars/`;
    }

    // Step 3: calendar-home-set 하위 캘린더 컬렉션 목록 추출
    const homeUrl = new URL(homeHref, baseUrl.origin).toString();
    const homeRes = await fetch(homeUrl, {
      method: 'PROPFIND',
      headers: {
        Authorization: authHeader,
        Depth: '1',
        'Content-Type': 'application/xml; charset=utf-8',
      },
      body: `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:displayname />
    <d:resourcetype />
  </d:prop>
</d:propfind>`,
    });

    if (homeRes.status === 207 || homeRes.ok) {
      const xml = await homeRes.text();
      // 각 <response> 태그 파싱
      const respRegex = /<(?:\w+:)?response[^>]*>([\s\S]*?)<\/(?:\w+:)?response>/gi;
      let rMatch: RegExpExecArray | null;

      while ((rMatch = respRegex.exec(xml)) !== null) {
        const respBody = rMatch[1];
        // <calendar/> 컴포넌트가 포함되어 있는지 검사
        if (/calendar/i.test(respBody)) {
          const hrefMatch = respBody.match(/<(?:\w+:)?href[^>]*>([^<]+)<\//i);
          const nameMatch = respBody.match(/<(?:\w+:)?displayname[^>]*>([^<]+)<\//i);

          if (hrefMatch && hrefMatch[1]) {
            const href = hrefMatch[1].trim();
            // 홈 자체(/calendars/)는 제외
            if (href === homeHref || href === homeHref + '/') continue;

            let name = nameMatch && nameMatch[1] ? nameMatch[1].trim() : '이름 없는 캘린더';
            try {
              name = decodeURIComponent(name);
            } catch {}

            const fullCalUrl = new URL(href, baseUrl.origin).toString();
            calendars.push({
              name,
              href,
              url: fullCalUrl,
            });
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[CalDAV Discovery Error]', err.message || err);
  }

  return calendars;
}

/**
 * 1. CalDAV 서버 연결 및 진단 테스트
 */
export async function testCalDavConnection(
  config: CaldavConfig
): Promise<{
  success: boolean;
  message: string;
  calendarName?: string;
  discoveredCalendars?: string[];
  httpStatus?: number;
}> {
  const target = config.serverUrl || config.domain || '';
  const url = normalizeCaldavUrl(target, config.useSsl !== false, config.port);
  const authHeader = getBasicAuthHeader(config.username, config.password);

  try {
    // 1단계: 인증 실패(401) 여부 먼저 검증
    const pingRes = await fetch(url, {
      method: 'OPTIONS',
      headers: { Authorization: authHeader },
    });

    if (pingRes.status === 401) {
      return {
        success: false,
        message: 'CalDAV 인증 실패: 아이디(이메일) 또는 비밀번호가 일치하지 않습니다. (401 Unauthorized)',
        httpStatus: 401,
      };
    }

    // 2단계: 자동 탐색(Discovery)으로 실제 캘린더 목록 확인
    const discovered = await discoverCalDavCalendars(config);
    if (discovered.length > 0) {
      const names = discovered.map((c) => c.name);
      return {
        success: true,
        message: `CalDAV 서버 연결 성공! 총 ${discovered.length}개의 사내 캘린더를 탐색했습니다. (${names.slice(0, 4).join(', ')}${names.length > 4 ? ` 외 ${names.length - 4}개` : ''})`,
        calendarName: config.calendarName || names[0],
        discoveredCalendars: names,
        httpStatus: 200,
      };
    }

    // 3단계: 직접 URL이 단일 캘린더인 경우 확인
    const propfindRes = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        Authorization: authHeader,
        Depth: '0',
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });

    const contentType = propfindRes.headers.get('content-type') || '';
    if ((propfindRes.status === 207 || propfindRes.ok) && !contentType.includes('text/html')) {
      return {
        success: true,
        message: 'CalDAV 캘린더 엔드포인트에 성공적으로 연결되었습니다.',
        calendarName: config.calendarName || 'CalDAV 캘린더',
        httpStatus: propfindRes.status,
      };
    }

    // 4단계: HTML 페이지만 반환되는 경우
    if (contentType.includes('text/html')) {
      return {
        success: false,
        message: '입력하신 주소는 일반 웹페이지(HTML)이며 CalDAV 캘린더 주소가 아닙니다. 도메인 형식(예: daouoffice.com)을 확인해주세요.',
        httpStatus: propfindRes.status,
      };
    }

    return {
      success: false,
      message: `CalDAV 서버 응답 코드: ${propfindRes.status} (${propfindRes.statusText})`,
      httpStatus: propfindRes.status,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `CalDAV 서버 접속 오류: ${err.message || '호스트에 연결할 수 없습니다.'}`,
    };
  }
}

/**
 * 2. 외부 CalDAV 서버로부터 일정 목록 조회 (Fetch)
 */
export async function fetchCalDavEvents(
  config: CaldavConfig,
  filter: { startDate?: string; endDate?: string } = {}
): Promise<CaldavEventResult[]> {
  const target = config.serverUrl || config.domain || '';
  const rootUrl = normalizeCaldavUrl(target, config.useSsl !== false, config.port);
  const authHeader = getBasicAuthHeader(config.username, config.password);
  const allEvents: CaldavEventResult[] = [];

  console.log(`[CalDAV Client] 🌐 외부 CalDAV 탐색 및 일정 조회 시작: ${rootUrl}`);

  try {
    // 1. 자동 탐색(Discovery)으로 사용자의 모든 캘린더 목록 조회
    const discovered = await discoverCalDavCalendars(config);
    const targetCalendars: { name: string; url: string }[] =
      discovered.length > 0
        ? discovered
        : [{ name: config.calendarName || 'CalDAV 캘린더', url: rootUrl }];

    console.log(`[CalDAV Client] 📋 조회 대상 캘린더 수: ${targetCalendars.length}개`);
    const reportQuery = buildCalDavReportQuery(filter.startDate, filter.endDate);

    for (const cal of targetCalendars) {
      // 사용자가 캘린더를 비활성화(OFF)한 경우 REPORT 요청 건너뛰기
      if (config.calendarEnabled && config.calendarEnabled[cal.name] === false) {
        console.log(`  ⏭️ [${cal.name}] 사용자에 의해 비활성화(OFF)되어 조회를 건너뜁니다.`);
        continue;
      }

      try {
        console.log(`  🔍 [${cal.name}] REPORT 요청: ${cal.url}`);
        const reportRes = await fetch(cal.url, {
          method: 'REPORT',
          headers: {
            Authorization: authHeader,
            Depth: '1',
            'Content-Type': 'application/xml; charset=utf-8',
          },
          body: reportQuery,
        });

        if (reportRes.status === 207 || reportRes.ok) {
          const xmlText = await reportRes.text();
          const calendarDataBlocks = extractCalendarDataFromXml(xmlText);
          console.log(`  ✅ [${cal.name}] VEVENT 데이터 블록 수신: ${calendarDataBlocks.length}개`);

          for (const block of calendarDataBlocks) {
            const parsedList = parseIcsCalendar(block);
            for (const ev of parsedList) {
              allEvents.push({
                uid: ev.uid,
                title: ev.summary,
                description: ev.description,
                startDate: ev.startDate,
                endDate: ev.endDate,
                isAllDay: ev.isAllDay,
                status: ev.status,
                location: ev.location,
                url: ev.url,
                calendarName: cal.name,
              });
            }
          }
        } else {
          // Fallback GET
          const getRes = await fetch(cal.url, {
            method: 'GET',
            headers: {
              Authorization: authHeader,
              Accept: 'text/calendar',
            },
          });
          if (getRes.ok) {
            const content = await getRes.text();
            if (content.includes('BEGIN:VCALENDAR')) {
              const parsedList = parseIcsCalendar(content);
              for (const ev of parsedList) {
                allEvents.push({
                  uid: ev.uid,
                  title: ev.summary,
                  description: ev.description,
                  startDate: ev.startDate,
                  endDate: ev.endDate,
                  isAllDay: ev.isAllDay,
                  status: ev.status,
                  location: ev.location,
                  url: ev.url,
                  calendarName: cal.name,
                });
              }
            }
          }
        }
      } catch (calErr: any) {
        console.warn(`  ⚠️ [${cal.name}] 조회 실패:`, calErr.message || calErr);
      }
    }

    console.log(`[CalDAV Client] 🎉 전체 CalDAV에서 총 ${allEvents.length}건의 일정을 성공적으로 수집했습니다.`);
  } catch (err: any) {
    console.error(`[CalDAV Client] ❌ CalDAV 조회 중 오류:`, err.message || err);
  }

  return allEvents;
}
