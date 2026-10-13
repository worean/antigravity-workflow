/**
 * iCalendar (RFC 5545) 생성 및 파싱 헬퍼 모듈
 */

export interface IcalEventInput {
  uid: string;
  summary: string;
  description?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  isAllDay?: boolean;
  status?: string; // CONFIRMED, TENTATIVE, CANCELLED
  priority?: number; // 1 ~ 9 (1: 최고, 5: 보통, 9: 낮음)
  categories?: string[];
  url?: string | null;
  location?: string | null;
  organizer?: { name?: string; email?: string } | null;
  progressPercent?: number | null; // WBS 진행률
}

export interface ParsedIcalEvent {
  uid: string;
  summary: string;
  description?: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  status?: string;
  location?: string;
  url?: string;
}

/**
 * 텍스트 내 iCal 특수 문자 이스케이프 (RFC 5545)
 */
export function escapeIcalText(str: string = ''): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * iCal 이스케이프 텍스트 복원
 */
export function unescapeIcalText(str: string = ''): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Date 객체를 iCal 표준 날짜/일시 포맷 문자열로 변환
 */
export function formatDateToIcal(input: Date | string, isAllDay = false): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');

  if (isAllDay) {
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return `${year}${month}${day}`;
  }

  // UTC 형식: YYYYMMDDTHHmmssZ
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * iCal 날짜 문자열을 Date 객체로 파싱
 */
export function parseIcalDate(str: string): Date {
  const clean = str.trim();
  if (/^\d{8}$/.test(clean)) {
    const y = parseInt(clean.substring(0, 4), 10);
    const m = parseInt(clean.substring(4, 6), 10) - 1;
    const d = parseInt(clean.substring(6, 8), 10);
    return new Date(Date.UTC(y, m, d, 0, 0, 0));
  }
  if (/^\d{8}T\d{6}Z?$/.test(clean)) {
    const y = parseInt(clean.substring(0, 4), 10);
    const m = parseInt(clean.substring(4, 6), 10) - 1;
    const d = parseInt(clean.substring(6, 8), 10);
    const h = parseInt(clean.substring(9, 11), 10);
    const min = parseInt(clean.substring(11, 13), 10);
    const s = parseInt(clean.substring(13, 15), 10);
    if (clean.endsWith('Z')) {
      return new Date(Date.UTC(y, m, d, h, min, s));
    }
    // 자정(00:00:00)인 경우 UTC 0시로 일관 생성하여 서버 로컬 타임존 직렬화 시 전날로 왜곡되는 현상 방지
    if (h === 0 && min === 0 && s === 0) {
      return new Date(Date.UTC(y, m, d, 0, 0, 0));
    }
    return new Date(y, m, d, h, min, s);
  }
  return new Date(clean);
}

/**
 * 일정 목록을 RFC 5545 표준 iCalendar (.ics) 문자열로 생성
 */
export function generateIcsCalendar(options: {
  calendarName: string;
  description?: string;
  timezone?: string;
  events: IcalEventInput[];
}): string {
  const {
    calendarName,
    description = 'AntiGravity Workflow Calendar Export',
    timezone = 'Asia/Seoul',
    events,
  } = options;

  const nowIcal = formatDateToIcal(new Date());

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AntiGravity Workflow//Project Calendar 2.5//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcalText(calendarName)}`,
    `X-WR-CALDESC:${escapeIcalText(description)}`,
    `X-WR-TIMEZONE:${timezone}`,
  ];

  for (const ev of events) {
    const startStr = formatDateToIcal(ev.startDate, ev.isAllDay);
    const endStr = ev.endDate ? formatDateToIcal(ev.endDate, ev.isAllDay) : startStr;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.uid}`);
    lines.push(`DTSTAMP:${nowIcal}`);

    if (ev.isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${startStr}`);
      lines.push(`DTEND;VALUE=DATE:${endStr}`);
    } else {
      lines.push(`DTSTART:${startStr}`);
      lines.push(`DTEND:${endStr}`);
    }

    lines.push(`SUMMARY:${escapeIcalText(ev.summary)}`);

    let fullDesc = ev.description || '';
    if (typeof ev.progressPercent === 'number') {
      fullDesc = `[진행률: ${ev.progressPercent}%]\n${fullDesc}`;
    }
    if (fullDesc) {
      lines.push(`DESCRIPTION:${escapeIcalText(fullDesc)}`);
    }

    if (ev.status) {
      lines.push(`STATUS:${ev.status.toUpperCase()}`);
    }

    if (typeof ev.priority === 'number') {
      lines.push(`PRIORITY:${ev.priority}`);
    }

    if (ev.categories && ev.categories.length > 0) {
      lines.push(`CATEGORIES:${ev.categories.map(escapeIcalText).join(',')}`);
    }

    if (ev.url) {
      lines.push(`URL:${ev.url}`);
    }

    if (ev.location) {
      lines.push(`LOCATION:${escapeIcalText(ev.location)}`);
    }

    if (ev.organizer && ev.organizer.email) {
      lines.push(`ORGANIZER;CN=${escapeIcalText(ev.organizer.name || ev.organizer.email)}:mailto:${ev.organizer.email}`);
    }

    if (typeof ev.progressPercent === 'number') {
      lines.push(`X-ANTIGRAVITY-PROGRESS:${ev.progressPercent}`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  // RFC 5545 표준 개행 문자는 CRLF (\r\n)
  return lines.join('\r\n');
}

/**
 * iCalendar (.ics) 텍스트를 파싱하여 VEVENT 목록 추출
 */
export function parseIcsCalendar(icsContent: string): ParsedIcalEvent[] {
  const events: ParsedIcalEvent[] = [];
  const normalized = icsContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  let inEvent = false;
  let currentEvent: Partial<ParsedIcalEvent> = {};

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // RFC 5545 Line folding 처리 (다음 줄이 공백이나 탭으로 시작하면 병합)
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++;
      line += lines[i].substring(1);
    }

    line = line.trim();
    if (!line) continue;

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      if (currentEvent.uid && currentEvent.summary && currentEvent.startDate) {
        events.push({
          uid: currentEvent.uid,
          summary: currentEvent.summary,
          description: currentEvent.description,
          startDate: currentEvent.startDate,
          endDate: currentEvent.endDate || currentEvent.startDate,
          isAllDay: Boolean(currentEvent.isAllDay),
          status: currentEvent.status,
          location: currentEvent.location,
          url: currentEvent.url,
        });
      }
      inEvent = false;
      continue;
    }

    if (!inEvent) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const keyPart = line.substring(0, colonIdx);
    const valuePart = line.substring(colonIdx + 1);

    const keyName = keyPart.split(';')[0].toUpperCase();
    const isDateOnly = keyPart.toUpperCase().includes('VALUE=DATE');

    switch (keyName) {
      case 'UID':
        currentEvent.uid = valuePart;
        break;
      case 'SUMMARY':
        currentEvent.summary = unescapeIcalText(valuePart);
        break;
      case 'DESCRIPTION':
        currentEvent.description = unescapeIcalText(valuePart);
        break;
      case 'DTSTART':
        currentEvent.isAllDay = isDateOnly || /^\d{8}$/.test(valuePart.trim());
        currentEvent.startDate = parseIcalDate(valuePart).toISOString();
        break;
      case 'DTEND':
        currentEvent.endDate = parseIcalDate(valuePart).toISOString();
        break;
      case 'STATUS':
        currentEvent.status = valuePart;
        break;
      case 'LOCATION':
        currentEvent.location = unescapeIcalText(valuePart);
        break;
      case 'URL':
        currentEvent.url = valuePart;
        break;
    }
  }

  return events;
}
