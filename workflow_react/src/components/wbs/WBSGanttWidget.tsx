import React, { useMemo } from 'react';
import { useIssues } from '@/api/issues';
import { Spinner, StatusBadge } from '@/components/common';
import { formatDateOnly } from '@/utils/dateUtils';
import { GitBranch } from 'lucide-react';
import type { WidgetProps, Widgetable } from '@/types/widget';
import { useInvolvedProjects } from '@/hooks/useInvolvedProjects';
import { filterUserInvolvedIssues } from '@/utils/issueFilters';
import { usePrefStore } from '@/stores/usePrefStore';
import { buildWBSTree } from '@/utils/wbs';
import { getOptimalContrastText } from '@/utils/colorUtils';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 두 날짜 사이의 일수 차이 계산 (target - base)
 */
const getDaysDiff = (target: Date, base: Date): number => {
  const t1 = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const t2 = new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
  return Math.round((t1 - t2) / (1000 * 60 * 60 * 24));
};

export const WBSGanttWidget: React.FC<WidgetProps> = ({
  config = {},
  onSelectIssue,
}) => {
  const { myProjectIds, user } = useInvolvedProjects();
  const projectId = config.projectId === 'ALL' ? undefined : config.projectId;
  const { data: rawIssues = [], isLoading } = useIssues(
    { projectId: projectId || undefined, onlyInvolved: true, all: true },
    { enabled: true }
  );

  // WBS 페이지 색상 및 테마 설정 구독 (Zustand: 단일/멀티 모드, 기본 테마, 일감별 커스텀 매핑)
  const wbsColorMode = usePrefStore((s) => s.wbsColorMode);
  const wbsDefaultTheme = usePrefStore((s) => s.wbsDefaultTheme);
  const wbsRootColorMap = usePrefStore((s) => s.wbsRootColorMap);
  const themeMode = usePrefStore((s) => s.theme);
  const isLightMode = themeMode === 'light';
  const cardBackdrop = isLightMode ? '#ffffff' : '#1e1e1e';

  // 1. 현재 자신이 속한 프로젝트 또는 담당/보고한 일감 필터링
  const issues = useMemo(
    () => filterUserInvolvedIssues(rawIssues, user, myProjectIds),
    [rawIssues, user, myProjectIds]
  );

  // 2. WBS 트리 계층 구축 및 WBS 페이지 색상 테마 동기화 바인딩
  const flatWBSItems = useMemo(() => {
    if (issues.length === 0) return [];
    const { flatWBSItems: items } = buildWBSTree(issues, new Set(), null, {
      mode: wbsColorMode,
      defaultTheme: wbsDefaultTheme,
      rootColorMap: wbsRootColorMap,
    });
    return items;
  }, [issues, wbsColorMode, wbsDefaultTheme, wbsRootColorMap]);

  const dayWidth = 28; // 1일 너비

  // 3. 타임라인 전체 날짜 범위 및 헤더 그룹 계산
  const { timelineStart, totalDays, monthHeaders, dayHeaders, todayOffsetDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let minDate = new Date(today);
    minDate.setDate(minDate.getDate() - 5);

    let maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 25);

    flatWBSItems.forEach((item) => {
      if (item.startDate && item.startDate < minDate) minDate = new Date(item.startDate);
      if (item.endDate && item.endDate > maxDate) maxDate = new Date(item.endDate);
    });

    const start = new Date(minDate);
    start.setDate(start.getDate() - 3);
    start.setHours(0, 0, 0, 0);

    const end = new Date(maxDate);
    end.setDate(end.getDate() + 4);
    end.setHours(0, 0, 0, 0);

    const daysCount = Math.max(30, getDaysDiff(end, start) + 1);

    const monthMap = new Map<string, { label: string; daysCount: number }>();
    const days: Array<{
      date: Date;
      isToday: boolean;
      isWeekend: boolean;
      dayNum: number;
      dayName: string;
      fullDateStr: string;
    }> = [];

    for (let i = 0; i < daysCount; i++) {
      const cur = new Date(start);
      cur.setDate(cur.getDate() + i);

      const mKey = `${cur.getFullYear()}-${cur.getMonth() + 1}`;
      const mLabel = `${cur.getFullYear()}년 ${cur.getMonth() + 1}월`;
      if (!monthMap.has(mKey)) {
        monthMap.set(mKey, { label: mLabel, daysCount: 1 });
      } else {
        monthMap.get(mKey)!.daysCount += 1;
      }

      const isToday = cur.toDateString() === today.toDateString();
      const dayOfWeek = cur.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      days.push({
        date: cur,
        isToday,
        isWeekend,
        dayNum: cur.getDate(),
        dayName: DAY_NAMES[dayOfWeek],
        fullDateStr: `${cur.getMonth() + 1}월 ${cur.getDate()}일 (${DAY_NAMES[dayOfWeek]})`,
      });
    }

    const todayOffset = getDaysDiff(today, start);

    return {
      timelineStart: start,
      totalDays: daysCount,
      monthHeaders: Array.from(monthMap.values()),
      dayHeaders: days,
      todayOffsetDays: todayOffset >= 0 && todayOffset < daysCount ? todayOffset : null,
    };
  }, [flatWBSItems]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '180px' }}>
        <Spinner centered label="WBS 데이터를 불러오는 중..." />
      </div>
    );
  }

  if (flatWBSItems.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '180px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        등록된 일감이 없습니다.
      </div>
    );
  }

  const timelineTotalWidth = totalDays * dayWidth;
  const displayedItems = flatWBSItems.slice(0, 35);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '220px',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xs)',
      }}
    >
      {/* Scrollable Container with Split Tree & Gantt View */}
      <div style={{ flex: 1, display: 'flex', overflow: 'auto' }}>
        {/* Left: Issue Info List */}
        <div
          style={{
            width: '260px',
            minWidth: '220px',
            borderRight: '1px solid var(--border-light)',
            flexShrink: 0,
            background: 'var(--bg-subtle)',
          }}
        >
          <div
            style={{
              height: '46px',
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: 'var(--text-sub)',
              borderBottom: '1px solid var(--border-light)',
              background: 'rgba(255, 255, 255, 0.02)',
              boxSizing: 'border-box',
            }}
          >
            일감 목록 ({flatWBSItems.length}건)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayedItems.map((item) => {
              const iss = item.issue;
              return (
                <div
                  key={iss.id}
                  onClick={() => onSelectIssue && onSelectIssue(iss)}
                  style={{
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: `0 8px 0 ${8 + Math.min(item.depth, 3) * 10}px`,
                    borderBottom: '1px solid var(--border-divider)',
                    cursor: 'pointer',
                    fontSize: '0.76rem',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    transition: 'background 0.12s',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  title={`#${iss.id} ${iss.title} (${item.color.name} 테마)`}
                >
                  {/* WBS 테마 컬러 인디케이터 점 */}
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '2px',
                      background: item.color.base,
                      border: `1px solid ${item.color.border}`,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 700, color: 'var(--primary)', flexShrink: 0, fontFamily: 'monospace' }}>
                    #{iss.id}
                  </span>
                  <StatusBadge status={iss.statusId || iss.status} size="sm" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-bright)' }}>
                    {iss.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Gantt Timeline Bars */}
        <div style={{ flex: 1, minWidth: `${timelineTotalWidth}px`, position: 'relative' }}>
          {/* 2단 타임라인 헤더: 상단 월(Month) / 하단 일(Day & 요일) */}
          <div
            style={{
              height: '46px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255, 255, 255, 0.02)',
              boxSizing: 'border-box',
              userSelect: 'none',
            }}
          >
            {/* 1. 상단: 연도 및 월 헤더 바 */}
            <div style={{ height: '22px', display: 'flex', borderBottom: '1px solid var(--border-divider)' }}>
              {monthHeaders.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    width: `${m.daysCount * dayWidth}px`,
                    minWidth: `${m.daysCount * dayWidth}px`,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--text-bright)',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '8px',
                    borderRight: '1px solid var(--border-light)',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    background: 'rgba(255, 255, 255, 0.01)',
                  }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* 2. 하단: 일자(Day) 헤더 바 */}
            <div style={{ height: '24px', display: 'flex' }}>
              {dayHeaders.map((d, idx) => (
                <div
                  key={idx}
                  style={{
                    width: `${dayWidth}px`,
                    minWidth: `${dayWidth}px`,
                    flexShrink: 0,
                    textAlign: 'center',
                    fontSize: '0.66rem',
                    lineHeight: '23px',
                    color: d.isToday ? 'var(--primary)' : d.isWeekend ? 'var(--text-muted)' : 'var(--text-sub)',
                    fontWeight: d.isToday ? 700 : 500,
                    borderRight: '1px solid var(--border-divider)',
                    background: d.isToday ? 'rgba(0, 122, 204, 0.15)' : undefined,
                    boxSizing: 'border-box',
                    cursor: 'default',
                  }}
                  title={d.fullDateStr}
                >
                  {d.dayNum}
                </div>
              ))}
            </div>
          </div>

          {/* 오늘(Today) 수직 인디케이터 라인 */}
          {todayOffsetDays !== null && (
            <div
              style={{
                position: 'absolute',
                left: `${todayOffsetDays * dayWidth + Math.floor(dayWidth / 2)}px`,
                top: '46px',
                bottom: 0,
                width: '2px',
                background: 'var(--primary)',
                opacity: 0.6,
                zIndex: 2,
                pointerEvents: 'none',
              }}
              title="오늘"
            />
          )}

          {/* Timeline Bars with Adaptive Contrast Text */}
          <div style={{ position: 'relative' }}>
            {displayedItems.map((item) => {
              const iss = item.issue;
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const pStart = item.startDate || today;
              const pEnd = item.endDate || new Date(pStart);
              if (pEnd < pStart) pEnd.setTime(pStart.getTime());

              // 정확한 오프셋 및 기간 계산
              const offsetDays = getDaysDiff(pStart, timelineStart);
              const durationDays = Math.max(1, getDaysDiff(pEnd, pStart) + 1);

              const leftPx = offsetDays * dayWidth;
              const widthPx = durationDays * dayWidth - 4;
              const progress = iss.progress ?? 0;
              const theme = item.color;

              // 배경색 기반 WCAG 최적 명암 텍스트 색상 계산
              const trackContrast = getOptimalContrastText(theme.bgEmpty, cardBackdrop);
              const fillContrast = getOptimalContrastText(theme.base, cardBackdrop);

              return (
                <div
                  key={iss.id}
                  style={{
                    height: '32px',
                    position: 'relative',
                    borderBottom: '1px solid var(--border-divider)',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    onClick={() => onSelectIssue && onSelectIssue(iss)}
                    style={{
                      position: 'absolute',
                      left: `${leftPx}px`,
                      width: `${Math.max(22, widthPx)}px`,
                      top: '5px',
                      height: '22px',
                      background: theme.bgEmpty,
                      border: `1.5px solid ${theme.border}`,
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      boxShadow: `0 2px 6px ${theme.base}33`,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                      transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                      boxSizing: 'border-box',
                      zIndex: 3,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = `0 4px 10px ${theme.base}55`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0 2px 6px ${theme.base}33`;
                    }}
                    title={`#${iss.id} ${iss.title}\n일정: ${formatDateOnly(pStart)} ~ ${formatDateOnly(pEnd)} (${durationDays}일간)\n진행률: ${progress}%\nWBS 테마: ${theme.name}`}
                  >
                    {/* 1. Track 레이어 텍스트: 빈 배경(bgEmpty + cardBackdrop) 대비 최적 색상 */}
                    <span
                      style={{
                        position: 'absolute',
                        left: '6px',
                        top: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: trackContrast.color,
                        textShadow: trackContrast.textShadow,
                        whiteSpace: 'nowrap',
                        zIndex: 1,
                      }}
                    >
                      {progress}%
                    </span>

                    {/* 2. Fill 레이어: 게이지 채움색(theme.base) 및 클리핑된 최적 명암 텍스트 */}
                    {progress > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${progress}%`,
                          background: theme.base,
                          borderRadius: progress === 100 ? 'var(--radius-xs)' : 'var(--radius-xs) 0 0 var(--radius-xs)',
                          transition: 'width 0.2s ease',
                          overflow: 'hidden',
                          zIndex: 2,
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: '6px',
                            top: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: fillContrast.color,
                            textShadow: fillContrast.textShadow,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {progress}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const wbsWidgetDefinition: Widgetable = {
  type: 'wbs',
  title: 'WBS 간트 차트',
  description: '프로젝트 일감의 계획 시작일, 마감일, 진행률을 타임라인 바 형태로 요약하여 시각화합니다.',
  defaultColSpan: 12,
  defaultHeight: 'normal',
  icon: <GitBranch size={22} color="#4ec9b0" />,
  badge: '일정 시각화',
  Component: WBSGanttWidget,
};
