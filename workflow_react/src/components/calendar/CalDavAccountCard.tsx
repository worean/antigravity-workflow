import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Edit2,
  Trash2,
  Palette,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { CaldavStatusResponse } from '@/types';
import { useUpdateCalDavSettings, calendarKeys } from '@/api/calendar';
import { useUIStore } from '@/stores/useUIStore';

interface CalDavAccountCardProps {
  status?: CaldavStatusResponse | null;
  domain: string;
  activeCalendars: string[];
  lastConnectMessage?: string;
  isDisconnectPending: boolean;
  onEdit: () => void;
  onDisconnect: () => void;
}

// 캘린더 유형별 추천 기본 색상 팔레트
const DEFAULT_PRESET_COLORS: Record<string, string> = {
  '개별 일정': '#8a2be2',
  'Company Schedule': '#eab308',
  '출장일정': '#f97316',
  '방문일정': '#06b6d4',
  '휴가일정': '#10b981',
  '회의일정': '#3b82f6',
  '공유 일정': '#ec4899',
};

const PALETTE_FALLBACKS = ['#8a2be2', '#3b82f6', '#10b981', '#f97316', '#eab308', '#06b6d4', '#ec4899', '#6366f1'];

export const CalDavAccountCard: React.FC<CalDavAccountCardProps> = ({
  status,
  domain,
  activeCalendars,
  lastConnectMessage,
  isDisconnectPending,
  onEdit,
  onDisconnect,
}) => {
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const updateSettingsMutation = useUpdateCalDavSettings();

  const [calendarColors, setCalendarColors] = useState<Record<string, string>>({});
  const [calendarEnabled, setCalendarEnabled] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const initialColors: Record<string, string> = {};
    const initialEnabled: Record<string, boolean> = {};

    activeCalendars.forEach((calName, idx) => {
      // 색상 초기화
      if (status?.calendarColors && status.calendarColors[calName]) {
        initialColors[calName] = status.calendarColors[calName];
      } else if (DEFAULT_PRESET_COLORS[calName]) {
        initialColors[calName] = DEFAULT_PRESET_COLORS[calName];
      } else {
        initialColors[calName] = PALETTE_FALLBACKS[idx % PALETTE_FALLBACKS.length];
      }

      // On/Off 초기화 (설정값이 명시적 false가 아니면 기본 true)
      if (status?.calendarEnabled && typeof status.calendarEnabled[calName] === 'boolean') {
        initialEnabled[calName] = status.calendarEnabled[calName];
      } else {
        initialEnabled[calName] = true;
      }
    });

    setCalendarColors(initialColors);
    setCalendarEnabled(initialEnabled);
    setHasChanges(false);
  }, [activeCalendars, status?.calendarColors, status?.calendarEnabled]);

  const handleColorChange = (calName: string, newColor: string) => {
    setCalendarColors((prev) => ({
      ...prev,
      [calName]: newColor,
    }));
    setHasChanges(true);
  };

  const handleToggleEnabled = (calName: string) => {
    setCalendarEnabled((prev) => ({
      ...prev,
      [calName]: prev[calName] === false ? true : false,
    }));
    setHasChanges(true);
  };

  const handleToggleAll = (enable: boolean) => {
    const next: Record<string, boolean> = {};
    activeCalendars.forEach((name) => {
      next[name] = enable;
    });
    setCalendarEnabled(next);
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        calendarColors,
        calendarEnabled,
      });
      showToast('캘린더별 설정(표시/숨김 및 색상)이 성공적으로 저장되었습니다!', 'success');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    } catch (err: any) {
      showToast('설정 저장 실패: ' + (err.message || '오류가 발생했습니다.'), 'error');
    }
  };

  const enabledCount = activeCalendars.filter((name) => calendarEnabled[name] !== false).length;

  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '14px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(138, 43, 226, 0.08)',
        border: '1px solid rgba(138, 43, 226, 0.35)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} style={{ color: '#4ec9b0', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#d8b4fe', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>연동된 CalDAV 계정</span>
              <span
                style={{
                  fontSize: '0.66rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: 'rgba(78, 201, 176, 0.15)',
                  color: '#4ec9b0',
                  border: '1px solid rgba(78, 201, 176, 0.3)',
                  fontWeight: 500,
                }}
              >
                10분 주기 자동 갱신
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', marginTop: '2px', fontWeight: 500 }}>
              서버: <strong>{status?.domain || domain}</strong> ({status?.username})
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={onEdit}
            className="btn btn-secondary btn-sm"
            style={{ height: '26px', fontSize: '0.72rem', gap: '4px' }}
            title="계정 정보 수정 또는 비밀번호 재설정"
          >
            <Edit2 size={12} />
            <span>정보 수정</span>
          </button>
          <button
            type="button"
            onClick={onDisconnect}
            disabled={isDisconnectPending}
            className="btn btn-danger btn-sm"
            style={{ height: '26px', fontSize: '0.72rem', gap: '4px' }}
          >
            <Trash2 size={12} />
            <span>계정 삭제</span>
          </button>
        </div>
      </div>

      {lastConnectMessage && (
        <div style={{ marginTop: '8px', fontSize: '0.73rem', color: '#4ec9b0', lineHeight: 1.35 }}>
          {lastConnectMessage}
        </div>
      )}

      {/* 탐색된 캘린더 목록 및 캘린더별 On/Off & 색상 설정 그리드 */}
      {activeCalendars.length > 0 && (
        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed rgba(138, 43, 226, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.73rem' }}>
              <Palette size={13} style={{ color: '#b366ff' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                캘린더별 표시(On/Off) 및 색상 설정
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: enabledCount > 0 ? 'rgba(78, 201, 176, 0.15)' : 'rgba(234, 76, 76, 0.15)',
                  color: enabledCount > 0 ? '#4ec9b0' : '#ff6b6b',
                  fontWeight: 600,
                }}
              >
                {enabledCount} / {activeCalendars.length}개 켜짐
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <button
                type="button"
                onClick={() => handleToggleAll(true)}
                className="btn btn-secondary btn-sm"
                style={{ height: '22px', fontSize: '0.66rem', padding: '0 6px' }}
                title="모든 캘린더 활성화"
              >
                전체 켜기
              </button>
              <button
                type="button"
                onClick={() => handleToggleAll(false)}
                className="btn btn-secondary btn-sm"
                style={{ height: '22px', fontSize: '0.66rem', padding: '0 6px' }}
                title="모든 캘린더 비활성화"
              >
                전체 끄기
              </button>
              {hasChanges && (
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isPending}
                  className="btn btn-primary btn-sm"
                  style={{ height: '22px', fontSize: '0.68rem', padding: '0 8px', gap: '3px' }}
                >
                  {updateSettingsMutation.isPending ? (
                    <RefreshCw size={11} className="animate-spin" />
                  ) : (
                    <Save size={11} />
                  )}
                  <span>설정 저장</span>
                </button>
              )}
            </div>
          </div>

          <p style={{ margin: '0 0 10px 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            * 캘린더를 끄면(OFF) 달력에 일정이 노출되지 않습니다. 켜져 있는 캘린더는 지정한 색상으로 구분 표시됩니다.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {activeCalendars.map((calName) => {
              const isEnabled = calendarEnabled[calName] !== false;
              const currentColor = calendarColors[calName] || '#8a2be2';

              return (
                <div
                  key={calName}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isEnabled
                      ? 'var(--bg-card, rgba(255, 255, 255, 0.04))'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isEnabled ? `1px solid ${currentColor}44` : '1px solid var(--border-light)',
                    borderLeft: isEnabled ? `4px solid ${currentColor}` : '4px solid var(--text-muted)',
                    opacity: isEnabled ? 1 : 0.6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* 좌측: On/Off 토글 버튼 & 캘린더 이름 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <button
                      type="button"
                      onClick={() => handleToggleEnabled(calName)}
                      className={`btn btn-sm ${isEnabled ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        height: '24px',
                        padding: '0 8px',
                        fontSize: '0.68rem',
                        gap: '4px',
                        borderRadius: '12px',
                        background: isEnabled ? currentColor : undefined,
                        borderColor: isEnabled ? currentColor : undefined,
                      }}
                      title={isEnabled ? '클릭 시 비활성화(숨김)' : '클릭 시 활성화(표시)'}
                    >
                      {isEnabled ? (
                        <>
                          <Eye size={12} />
                          <span>표시 ON</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} />
                          <span>숨김 OFF</span>
                        </>
                      )}
                    </button>

                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: isEnabled ? 600 : 400,
                        color: isEnabled ? 'var(--text-bright)' : 'var(--text-muted)',
                        textDecoration: isEnabled ? 'none' : 'line-through',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={calName}
                    >
                      📅 {calName}
                    </span>
                  </div>

                  {/* 우측: 색상 선택기 (On 상태일 때만 활성화) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                    <input
                      type="color"
                      disabled={!isEnabled}
                      value={currentColor}
                      onChange={(e) => handleColorChange(calName, e.target.value)}
                      style={{
                        width: '24px',
                        height: '24px',
                        padding: 0,
                        border: 'none',
                        borderRadius: '3px',
                        cursor: isEnabled ? 'pointer' : 'not-allowed',
                        background: 'transparent',
                        opacity: isEnabled ? 1 : 0.4,
                      }}
                      title={isEnabled ? `${calName} 색상 선택` : '캘린더를 켜야 색상을 변경할 수 있습니다'}
                    />
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: isEnabled ? 'var(--text-sub)' : 'var(--text-muted)',
                        fontFamily: 'monospace',
                        minWidth: '58px',
                      }}
                    >
                      {currentColor}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {hasChanges && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="btn btn-primary btn-sm"
                style={{ height: '28px', fontSize: '0.74rem', gap: '5px' }}
              >
                {updateSettingsMutation.isPending ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                <span>변경된 설정(On/Off 및 색상) 저장</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
