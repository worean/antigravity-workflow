import React from 'react';
import {
  Bell,
  CheckCircle2,
  Sliders,
  Palette,
  Calendar,
} from 'lucide-react';
import { Button, PrioritySelect } from '@/components/common';

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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '560px' }}>
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)' }}>
          디스플레이 및 데스크톱 알림 설정
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          이슈 칸반 보드 스타일 및 Electron 데스크톱 OS 네이티브 알림 설정을 관리합니다.
        </p>
      </div>

      {/* Desktop OS Notification Option */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '12px',
          background: '#2d2d2d',
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
            <span style={{ fontSize: '0.78rem', color: desktopNotifications ? '#4ec9b0' : 'var(--text-muted)', fontWeight: 600 }}>
              {desktopNotifications ? 'ON' : 'OFF'}
            </span>
          </label>
        </div>

        {desktopNotifications && (
          <div style={{ borderTop: '1px solid #3c3c3c', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <div style={{ fontSize: '0.7rem', color: '#4ec9b0', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
          background: '#2d2d2d',
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
          background: '#2d2d2d',
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
            <span style={{ fontSize: '0.7rem', color: '#4ec9b0', display: 'flex', alignItems: 'center', gap: '3px' }}>
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
          background: '#2d2d2d',
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
            <span style={{ fontSize: '0.7rem', color: '#4ec9b0', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CheckCircle2 size={12} /> 저장됨
            </span>
          )}
        </div>
      </div>
    </div>
  );
};