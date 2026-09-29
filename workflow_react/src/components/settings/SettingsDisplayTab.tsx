import React from 'react';
import {
  Bell,
  CheckCircle2,
  Sliders,
  Palette,
  Calendar,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { Button, PrioritySelect } from '@/components/common';
import { usePrefStore } from '@/stores/usePrefStore';
import type { ThemeMode } from '@/utils/themeUtils';

interface SettingsDisplayTabProps {
  desktopNotifications: boolean;
  handleToggleDesktopNotifications: (enabled: boolean) => Promise<void>;
  handleSendTestNotification: () => void;
  testNotificationSent: boolean;
  compactCards: boolean;
  handleToggleCompactCards: (enabled: boolean) => void;
  defaultPriority: number;
  handleDefaultPriorityChange: (priorityId: number) => void;
  prioritySavedFeedback: boolean;
  isSundayStart: boolean;
  handleWeekStartChange: (isSunday: boolean) => void;
  weekStartSavedFeedback: boolean;
}

export const SettingsDisplayTab: React.FC<SettingsDisplayTabProps> = ({
  desktopNotifications,
  handleToggleDesktopNotifications,
  handleSendTestNotification,
  testNotificationSent,
  compactCards,
  handleToggleCompactCards,
  defaultPriority,
  handleDefaultPriorityChange,
  prioritySavedFeedback,
  isSundayStart,
  handleWeekStartChange,
  weekStartSavedFeedback,
}) => {
  const theme = usePrefStore((s) => s.theme);
  const setTheme = usePrefStore((s) => s.setTheme);

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      mode: 'dark',
      label: '다크 테마 (Dark)',
      icon: <Moon size={14} color="var(--accent-cyan)" />,
      desc: 'VS Code 스타일의 어두운 테마로 눈의 피로를 최소화합니다.',
    },
    {
      mode: 'light',
      label: '라이트 테마 (Light)',
      icon: <Sun size={14} color="var(--accent-amber)" />,
      desc: '밝고 깨끗한 모던 라이트 테마로 가독성을 높입니다.',
    },
    {
      mode: 'system',
      label: '시스템 설정 동기화',
      icon: <Monitor size={14} color="var(--primary)" />,
      desc: '운영체제(OS)의 다크/라이트 모드 설정에 자동으로 연동됩니다.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '560px' }}>
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)' }}>
          디스플레이 및 테마 설정
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          화면 테마(Light/Dark), 이슈 칸반 보드 스타일 및 Electron 데스크톱 OS 네이티브 알림 설정을 관리합니다.
        </p>
      </div>

      {/* 🎨 Theme Selection Option */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Palette size={14} color="var(--primary)" />
            화면 테마 (Theme Mode)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            원하는 화면 테마를 선택하세요. 상단 헤더 우측 아이콘으로도 즉시 전환할 수 있습니다.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {themeOptions.map((opt) => {
            const isSelected = theme === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setTheme(opt.mode)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                  background: isSelected ? 'var(--primary-subtle)' : 'var(--bg-input)',
                  color: isSelected ? 'var(--text-bright)' : 'var(--text-main)',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: isSelected ? 600 : 500 }}>
                  {opt.icon}
                  <span>{opt.label.split(' ')[0]}</span>
                </div>
                <span style={{ fontSize: '0.67rem', color: isSelected ? 'var(--text-main)' : 'var(--text-muted)', lineHeight: 1.2 }}>
                  {opt.mode === 'dark' ? '다크 모드' : opt.mode === 'light' ? '라이트 모드' : 'OS 자동 연동'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop OS Notification Option */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={14} color="var(--primary)" />
              데스크톱 OS 네이티브 알림 (Desktop Notification)
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              신규 이슈 등록, 댓글 작성, 중요 긴급 이슈 알림 시 윈도우 데스크톱 토스트 알림을 수신합니다.
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={desktopNotifications}
              onChange={(e) => handleToggleDesktopNotifications(e.target.checked)}
            />
            <span style={{ fontSize: '0.78rem', color: desktopNotifications ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight: 600 }}>
              {desktopNotifications ? 'ON' : 'OFF'}
            </span>
          </label>
        </div>

        {desktopNotifications && (
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              알림이 정상적으로 동작하는지 테스트합니다.
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSendTestNotification}
              style={{ fontSize: '0.72rem', padding: '2px 8px' }}
            >
              <Bell size={12} />
              테스트 알림 발송
            </Button>
          </div>
        )}

        {testNotificationSent && (
          <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} />
            테스트 알림이 발송되었습니다. 데스크톱 우측 하단 알림 센터를 확인하세요.
          </div>
        )}
      </div>

      {/* Board Display Mode Option */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={14} color="var(--primary)" />
            칸반 보드 콤팩트 카드 뷰 (Compact Cards)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            칸반 보드에서 이슈 카드의 크기를 줄여 더 많은 일감을 한눈에 확인합니다.
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={compactCards}
            onChange={(e) => handleToggleCompactCards(e.target.checked)}
          />
          <span style={{ fontSize: '0.78rem', color: compactCards ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
            {compactCards ? 'ON' : 'OFF'}
          </span>
        </label>
      </div>

      {/* Default Priority Option */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Palette size={14} color="var(--primary)" />
            새 이슈 기본 우선순위
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            새 이슈를 작성할 때 초기값으로 선택될 기본 우선순위를 지정합니다.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PrioritySelect
            value={defaultPriority}
            onChange={handleDefaultPriorityChange}
            style={{ width: '110px' }}
          />
          {prioritySavedFeedback && (
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CheckCircle2 size={12} /> 저장됨
            </span>
          )}
        </div>
      </div>

      {/* Week Start Day Option (WBS / 캘린더 주간 시작 요일) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="var(--primary)" />
            WBS 및 캘린더 주간 시작 요일
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            WBS 간트 차트 주차(Week) 계산 및 캘린더의 한 주 시작 요일을 일요일 또는 월요일로 설정합니다.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="input-field"
            value={isSundayStart ? 'sunday' : 'monday'}
            onChange={(e) => handleWeekStartChange(e.target.value === 'sunday')}
            style={{ width: '120px', fontSize: '0.75rem', height: '26px' }}
          >
            <option value="sunday">일요일 시작 (기본)</option>
            <option value="monday">월요일 시작</option>
          </select>
          {weekStartSavedFeedback && (
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CheckCircle2 size={12} /> 저장됨
            </span>
          )}
        </div>
      </div>
    </div>
  );
};