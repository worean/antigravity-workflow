/**
 * 대한민국 법정 공휴일/대체공휴일 계산 모듈 (calendarUtils 에서 분리)
 */

import { formatDateOnly, parseLocalDate, addDays } from './dateUtils';

/**
 * 음력 기반 주요 명절(설날 연휴 3일, 부처님오신날, 추석 연휴 3일) 양력 변환 테이블 (2023 ~ 2035)
 */
const LUNAR_HOLIDAYS_TABLE: Record<
  number,
  { seollal: [string, string, string]; buddha: string; chuseok: [string, string, string] }
> = {
  2023: {
    seollal: ['2023-01-21', '2023-01-22', '2023-01-23'],
    buddha: '2023-05-27',
    chuseok: ['2023-09-28', '2023-09-29', '2023-09-30'],
  },
  2024: {
    seollal: ['2024-02-09', '2024-02-10', '2024-02-11'],
    buddha: '2024-05-15',
    chuseok: ['2024-09-16', '2024-09-17', '2024-09-18'],
  },
  2025: {
    seollal: ['2025-01-28', '2025-01-29', '2025-01-30'],
    buddha: '2025-05-05',
    chuseok: ['2025-10-05', '2025-10-06', '2025-10-07'],
  },
  2026: {
    seollal: ['2026-02-16', '2026-02-17', '2026-02-18'],
    buddha: '2026-05-24',
    chuseok: ['2026-09-24', '2026-09-25', '2026-09-26'],
  },
  2027: {
    seollal: ['2027-02-06', '2027-02-07', '2027-02-08'],
    buddha: '2027-05-13',
    chuseok: ['2027-09-14', '2027-09-15', '2027-09-16'],
  },
  2028: {
    seollal: ['2028-01-26', '2028-01-27', '2028-01-28'],
    buddha: '2028-05-02',
    chuseok: ['2028-10-02', '2028-10-03', '2028-10-04'],
  },
  2029: {
    seollal: ['2029-02-12', '2029-02-13', '2029-02-14'],
    buddha: '2029-05-20',
    chuseok: ['2029-09-21', '2029-09-22', '2029-09-23'],
  },
  2030: {
    seollal: ['2030-02-02', '2030-02-03', '2030-02-04'],
    buddha: '2030-05-09',
    chuseok: ['2030-09-11', '2030-09-12', '2030-09-13'],
  },
  2031: {
    seollal: ['2031-01-22', '2031-01-23', '2031-01-24'],
    buddha: '2031-05-28',
    chuseok: ['2031-09-30', '2031-10-01', '2031-10-02'],
  },
  2032: {
    seollal: ['2032-02-10', '2032-02-11', '2032-02-12'],
    buddha: '2032-05-16',
    chuseok: ['2032-09-18', '2032-09-19', '2032-09-20'],
  },
  2033: {
    seollal: ['2033-01-30', '2033-01-31', '2033-02-01'],
    buddha: '2033-05-06',
    chuseok: ['2033-09-07', '2033-09-08', '2033-09-09'],
  },
  2034: {
    seollal: ['2034-02-18', '2034-02-19', '2034-02-20'],
    buddha: '2034-05-25',
    chuseok: ['2034-09-26', '2034-09-27', '2034-09-28'],
  },
  2035: {
    seollal: ['2035-02-07', '2035-02-08', '2035-02-09'],
    buddha: '2035-05-15',
    chuseok: ['2035-09-15', '2035-09-16', '2035-09-17'],
  },
};

// 연도별 공휴일 캐시
const holidaysCache: Record<number, Record<string, string>> = {};

/**
 * 특정 연도의 대한민국 법정 공휴일 및 대체공휴일 맵(YYYY-MM-DD -> 공휴일 명칭)을 계산합니다.
 */
export const getKoreanHolidays = (year: number): Record<string, string> => {
  if (holidaysCache[year]) {
    return holidaysCache[year];
  }

  const holidays: Record<string, string> = {};

  // 1. 양력 고정 공휴일 등록
  const fixedHolidays: Array<{ date: string; name: string; hasSubstitute: boolean }> = [
    { date: `${year}-01-01`, name: '신정', hasSubstitute: false },
    { date: `${year}-03-01`, name: '삼일절', hasSubstitute: true },
    { date: `${year}-05-05`, name: '어린이날', hasSubstitute: true },
    { date: `${year}-06-06`, name: '현충일', hasSubstitute: false },
    { date: `${year}-08-15`, name: '광복절', hasSubstitute: true },
    { date: `${year}-10-03`, name: '개천절', hasSubstitute: true },
    { date: `${year}-10-09`, name: '한글날', hasSubstitute: true },
    { date: `${year}-12-25`, name: '기독탄신일(성탄절)', hasSubstitute: true },
  ];

  fixedHolidays.forEach((h) => {
    holidays[h.date] = h.name;
  });

  // 2. 음력 명절 등록 (설날, 부처님오신날, 추석)
  const lunar = LUNAR_HOLIDAYS_TABLE[year];
  if (lunar) {
    holidays[lunar.seollal[0]] = '설날 연휴';
    holidays[lunar.seollal[1]] = '설날';
    holidays[lunar.seollal[2]] = '설날 연휴';

    holidays[lunar.buddha] = '부처님오신날';

    holidays[lunar.chuseok[0]] = '추석 연휴';
    holidays[lunar.chuseok[1]] = '추석';
    holidays[lunar.chuseok[2]] = '추석 연휴';
  }

  // 3. 대체공휴일(Substitute Holiday) 계산
  // A. 설날 연휴 대체공휴일: 연휴 중 일요일 또는 다른 공휴일과 겹치는 경우
  if (lunar) {
    const seollalHasSundayOrConflict = lunar.seollal.some((dStr) => {
      const d = parseLocalDate(dStr);
      return d ? d.getDay() === 0 : false;
    });

    if (seollalHasSundayOrConflict) {
      let candidate = addDays(parseLocalDate(lunar.seollal[2])!, 1);
      while (candidate.getDay() === 0 || holidays[formatDateOnly(candidate)]) {
        candidate = addDays(candidate, 1);
      }
      holidays[formatDateOnly(candidate)] = '대체공휴일(설날)';
    }

    // B. 추석 연휴 대체공휴일: 연휴 중 일요일 또는 다른 공휴일(예: 개천절)과 겹치는 경우
    const chuseokHasSundayOrConflict = lunar.chuseok.some((dStr) => {
      const d = parseLocalDate(dStr);
      const isSun = d ? d.getDay() === 0 : false;
      // 다른 고정 공휴일과 겹쳤는지 확인
      const isConflicted = fixedHolidays.some((fh) => fh.date === dStr);
      return isSun || isConflicted;
    });

    if (chuseokHasSundayOrConflict) {
      let candidate = addDays(parseLocalDate(lunar.chuseok[2])!, 1);
      while (candidate.getDay() === 0 || holidays[formatDateOnly(candidate)]) {
        candidate = addDays(candidate, 1);
      }
      holidays[formatDateOnly(candidate)] = '대체공휴일(추석)';
    }
  }

  // C. 일반 공휴일 대체공휴일 (삼일절, 어린이날, 부처님오신날, 광복절, 개천절, 한글날, 성탄절)
  // 토요일 또는 일요일, 혹은 다른 공휴일과 겹칠 경우 다음 첫 번째 비공휴일
  const substituteCandidates: Array<{ date: string; name: string }> = [
    ...fixedHolidays.filter((h) => h.hasSubstitute),
  ];
  if (lunar) {
    substituteCandidates.push({ date: lunar.buddha, name: '부처님오신날' });
  }

  substituteCandidates.forEach((item) => {
    const d = parseLocalDate(item.date);
    if (!d) return;
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;

    // 이미 다른 공휴일과 겹쳤거나 주말인 경우 대체공휴일 발생
    if (isWeekend) {
      let candidate = addDays(d, 1);
      while (
        candidate.getDay() === 0 ||
        candidate.getDay() === 6 ||
        holidays[formatDateOnly(candidate)]
      ) {
        candidate = addDays(candidate, 1);
      }
      const candidateStr = formatDateOnly(candidate);
      if (!holidays[candidateStr]) {
        holidays[candidateStr] = `대체공휴일(${item.name})`;
      }
    }
  });

  holidaysCache[year] = holidays;
  return holidays;
};
