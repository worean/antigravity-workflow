import React, { useState } from 'react';
import { useDemoPrefStore, type DemoThemeMode } from '@/stores/useDemoPrefStore';
import { RenderCountBadge } from './RenderCountBadge';
import { Sliders, RefreshCw, RotateCcw } from 'lucide-react';

export const PrefControllerCard: React.FC = () => {
  const themeMode = useDemoPrefStore((s) => s.themeMode);
  const isSundayStart = useDemoPrefStore((s) => s.isSundayStart);
  const compactCardView = useDemoPrefStore((s) => s.compactCardView);
  const fontSize = useDemoPrefStore((s) => s.fontSize);
  const lastSyncedAt = useDemoPrefStore((s) => s.lastSyncedAt);

  const setThemeMode = useDemoPrefStore((s) => s.setThemeMode);
  const setSundayStart = useDemoPrefStore((s) => s.setSundayStart);
  const setCompactCardView = useDemoPrefStore((s) => s.setCompactCardView);
  const setFontSize = useDemoPrefStore((s) => s.setFontSize);
  const simulateApiSync = useDemoPrefStore((s) => s.simulateApiSync);
  const resetDefaults = useDemoPrefStore((s) => s.resetDefaults);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await simulateApiSync();
    setIsSyncing(false);
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="#a855f7" />
          설정 변경 컨트롤러 (Store Actions)
        </h3>
        <RenderCountBadge label="컨트롤러 렌더" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {/* 테마 모드 선택 */}
        <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', display: 'block', marginBottom: '6px' }}>
            테마 모드 (themeMode)
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['dark', 'light', 'system'] as DemoThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setThemeMode(mode)}
                style={{
                  flex: 1,
                  padding: '5px',
                  fontSize: '0.75rem',
                  borderRadius: 'var(--radius-xs)',
                  border: themeMode === mode ? '1px solid #a855f7' : '1px solid var(--border-light)',
                  background: themeMode === mode ? 'rgba(168, 85, 247, 0.2)' : 'var(--bg-surface)',
                  color: themeMode === mode ? '#d8b4fe' : 'var(--text-bright)',
                  cursor: 'pointer',
                  fontWeight: themeMode === mode ? 600 : 400,
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* 일요일 시작 토글 */}
        <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', display: 'block', marginBottom: '6px' }}>
            달력/WBS 시작 요일
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-bright)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isSundayStart}
              onChange={(e) => setSundayStart(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            일요일 시작 ({isSundayStart ? '일요일' : '월요일'})
          </label>
        </div>

        {/* 카드 컴팩트 뷰 토글 */}
        <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', display: 'block', marginBottom: '6px' }}>
            카드 축소 뷰 (compactCardView)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-bright)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={compactCardView}
              onChange={(e) => setCompactCardView(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            컴팩트 모드 적용 ({compactCardView ? '켜짐' : '꺼짐'})
          </label>
        </div>

        {/* 폰트 크기 슬라이더 */}
        <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)' }}>
              기본 폰트 크기
            </label>
            <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 600 }}>{fontSize}px</span>
          </div>
          <input
            type="range"
            min={12}
            max={20}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* 가상 API 동기화 및 리셋 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 500,
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              opacity: isSyncing ? 0.7 : 1,
            }}
          >
            <RefreshCw size={14} className={isSyncing ? 'spin-animation' : ''} />
            {isSyncing ? '서버와 동기화 중...' : '🌐 백엔드 API 설정 일괄 동기화 (가상 시뮬레이션)'}
          </button>
          {lastSyncedAt && (
            <span style={{ fontSize: '0.72rem', color: '#10b981' }}>
              ✓ 마지막 서버 동기화 완료: {lastSyncedAt}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={resetDefaults}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 10px',
            fontSize: '0.75rem',
            backgroundColor: 'transparent',
            color: 'var(--text-sub)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={13} />
          기본값 복원
        </button>
      </div>
    </div>
  );
};
