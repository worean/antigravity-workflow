﻿import React, { useState, useMemo } from 'react';
import { useIssues } from '@/api/issues';
import { Spinner, StatusBadge } from '@/components/common';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import type { Issue } from '@/types';
import type { DashboardWidgetConfig } from '@/types/dashboard';

interface CalendarMiniWidgetProps {
  config?: DashboardWidgetConfig;
  onSelectIssue?: (issue: Issue) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const CalendarMiniWidget: React.FC<CalendarMiniWidgetProps> = ({
  config = {},
  onSelectIssue,
}) => {
  const projectId = config.projectId === 'ALL' ? undefined : config.projectId;
  const { data: issues = [], isLoading } = useIssues(
    { projectId: projectId || undefined, all: true },
    { enabled: true }
  );

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDateStr(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDateStr(null);
  };

  // 날짜별 일감 매핑
  const issuesByDate = useMemo(() => {
    const map: Record<string, Issue[]> = {};
    issues.forEach((iss) => {
      const targetDate = iss.dueDate || iss.plannedStartDate;
      if (targetDate) {
        const dStr = new Date(targetDate).toISOString().split('T')[0];
        if (!map[dStr]) map[dStr] = [];
        map[dStr].push(iss);
      }
    });
    return map;
  }, [issues]);

  // 이번 달 전체 일감 목록
  const currentMonthIssues = useMemo(() => {
    const yStr = String(currentYear);
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const prefix = `${yStr}-${mStr}`;
    return issues
      .filter((iss) => {
        const targetDate = iss.dueDate || iss.plannedStartDate;
        if (!targetDate) return false;
        const dStr = new Date(targetDate).toISOString().split('T')[0];
        return dStr.startsWith(prefix);
      })
      .sort((a, b) => {
        const dateA = a.dueDate || a.plannedStartDate || '';
        const dateB = b.dueDate || b.plannedStartDate || '';
        return dateA.localeCompare(dateB);
      });
  }, [issues, currentYear, currentMonth]);

  // 달력 날짜 그리드 계산
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: Array<{ dayNumber: number; dateStr: string; isCurrentMonth: boolean }> = [];

    // 이전 달 빈 셀
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
    }

    // 이번 달 날짜
    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: true });
    }

    // 다음 달 날짜 (35칸 또는 42칸 맞춤)
    const totalSlots = days.length > 35 ? 42 : 35;
    const remaining = totalSlots - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 1 : currentMonth + 2;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth]);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCellClick = (dateStr: string) => {
    setSelectedDateStr((prev) => (prev === dateStr ? null : dateStr));
  };

  // 하단에 상시 표시될 리스트 목록 결정
  const activeListIssues = useMemo(() => {
    if (selectedDateStr) {
      return issuesByDate[selectedDateStr] || [];
    }
    return currentMonthIssues;
  }, [selectedDateStr, issuesByDate, currentMonthIssues]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '180px' }}>
        <Spinner centered label="일정을 불러오는 중..." />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '260px',
        padding: '8px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xs)',
        overflow: 'hidden',
        gap: '6px',
      }}
    >
      {/* 1. Calendar Header Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarIcon size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)' }}>
            {currentYear}년 {currentMonth + 1}월
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={handleToday}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.68rem', padding: '1px 6px', height: '22px' }}
          >
            오늘
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="btn btn-secondary btn-sm"
            style={{ padding: '2px 4px', height: '22px' }}
            title="이전 달"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="btn btn-secondary btn-sm"
            style={{ padding: '2px 4px', height: '22px' }}
            title="다음 달"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* 2. Weekday Labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
        {WEEKDAYS.map((w, idx) => (
          <div
            key={w}
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              color: idx === 0 ? '#f14c4c' : idx === 6 ? '#007acc' : 'var(--text-muted)',
              padding: '2px 0',
            }}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 3. Days Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          flex: '1 1 auto',
          minHeight: '140px',
        }}
      >
        {calendarDays.map((cd) => {
          const dayIssues = issuesByDate[cd.dateStr] || [];
          const isToday = cd.dateStr === todayStr;
          const isSelected = cd.dateStr === selectedDateStr;

          return (
            <div
              key={cd.dateStr}
              onClick={() => handleCellClick(cd.dateStr)}
              style={{
                minHeight: '24px',
                padding: '2px 3px',
                borderRadius: '3px',
                background: isSelected
                  ? 'rgba(0, 122, 204, 0.25)'
                  : isToday
                  ? 'rgba(0, 122, 204, 0.1)'
                  : cd.isCurrentMonth
                  ? 'var(--bg-subtle)'
                  : 'rgba(255, 255, 255, 0.01)',
                border: isSelected
                  ? '1px solid var(--primary)'
                  : isToday
                  ? '1px solid rgba(0, 122, 204, 0.4)'
                  : '1px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'background 0.12s',
              }}
              title={`${cd.dateStr} (일감 ${dayIssues.length}개)`}
            >
              <div
                style={{
                  fontSize: '0.66rem',
                  fontWeight: isToday ? 700 : 400,
                  color: !cd.isCurrentMonth
                    ? 'var(--text-placeholder)'
                    : isToday
                    ? 'var(--primary)'
                    : 'var(--text-main)',
                }}
              >
                {cd.dayNumber}
              </div>

              {dayIssues.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', alignSelf: 'flex-end' }}>
                  <div
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: dayIssues.some((i) => (i.priorityId || 1) >= 3) ? '#f14c4c' : 'var(--primary)',
                    }}
                  />
                  {dayIssues.length > 1 && (
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-sub)', fontWeight: 600 }}>
                      +{dayIssues.length}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Always-Visible Bottom Schedule List (스크롤 지원) */}
      <div
        style={{
          borderTop: '1px solid var(--border-light)',
          paddingTop: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-sub)' }}>
            {selectedDateStr
              ? `${selectedDateStr} 일정 (${activeListIssues.length}건)`
              : `${currentMonth + 1}월 전체 일정 리스트 (${activeListIssues.length}건)`}
          </span>
          {selectedDateStr && (
            <button
              type="button"
              onClick={() => setSelectedDateStr(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.68rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '1px 4px',
              }}
            >
              <RotateCcw size={10} /> 전체 보기
            </button>
          )}
        </div>

        {/* Scrollable List Container */}
        <div
          style={{
            maxHeight: '130px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            paddingRight: '2px',
          }}
        >
          {activeListIssues.length === 0 ? (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
              {selectedDateStr ? '선택한 일자에 일감이 없습니다.' : '이달에 등록된 일정이 없습니다.'}
            </div>
          ) : (
            activeListIssues.map((iss) => {
              const targetDate = iss.dueDate || iss.plannedStartDate;
              const dateOnly = targetDate ? targetDate.substring(5, 10) : '';
              return (
                <div
                  key={iss.id}
                  onClick={() => onSelectIssue && onSelectIssue(iss)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 6px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-divider)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                >
                  {dateOnly && (
                    <span style={{ fontSize: '0.66rem', color: 'var(--accent-cyan)', flexShrink: 0, fontWeight: 600 }}>
                      {dateOnly}
                    </span>
                  )}
                  <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>
                    #{iss.id}
                  </span>
                  <StatusBadge status={iss.statusId || iss.status} size="sm" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-bright)' }}>
                    {iss.title}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
