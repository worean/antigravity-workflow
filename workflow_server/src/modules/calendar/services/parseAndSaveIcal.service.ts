import { parseIcsCalendar, type ParsedIcalEvent } from '../../../lib/icalHelper.js';

export interface ParseIcalResult {
  totalCount: number;
  events: ParsedIcalEvent[];
}

export const parseIcalService = (icsContent: string): ParseIcalResult => {
  if (!icsContent || typeof icsContent !== 'string') {
    throw new Error('유효한 iCalendar (.ics) 파일 내용이 필요합니다.');
  }

  const events = parseIcsCalendar(icsContent);

  return {
    totalCount: events.length,
    events,
  };
};
