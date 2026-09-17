import React, { useState } from 'react';
import { useDemoPrefStore } from '@/stores/useDemoPrefStore';
import { RenderCountBadge } from './RenderCountBadge';
import { HardDrive } from 'lucide-react';

export const StateComparisonCard: React.FC = () => {
  // 1) useState: 컴포넌트 로컬 상태 (페이지 이동 또는 새로고침 시 초기화됨)
  const [localNote, setLocalNote] = useState<string>('이 텍스트는 useState로 관리되는 로컬 상태입니다.');

  // 2) Zustand: 전역 영속 상태 (LocalStorage 자동 저장 & 앱 어디서든 유지)
  const isSundayStart = useDemoPrefStore((s) => s.isSundayStart);
  const setSundayStart = useDemoPrefStore((s) => s.setSundayStart);

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
          <HardDrive size={18} color="#38bdf8" />
          핵심 비교: useState (로컬 임시) vs Zustand (전역 영속)
        </h3>
        <RenderCountBadge />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* 왼쪽: useState 로컬 상태 */}
        <div
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b' }}>
              ⚡ useState (컴포넌트 로컬 상태)
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)' }}>새로고침 시 사라짐</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '8px', lineHeight: 1.4 }}>
            모달 열림/닫힘, 임시 입력값 등 컴포넌트 안에서만 살고 죽는 상태에 적합합니다.
          </p>
          <input
            type="text"
            value={localNote}
            onChange={(e) => setLocalNote(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: '0.8rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-bright)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            placeholder="임시 메모 입력..."
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)', marginTop: '4px', display: 'block' }}>
            입력 후 F5(새로고침)를 누르면 초기 상태로 리셋됩니다.
          </span>
        </div>

        {/* 오른쪽: Zustand 전역 상태 */}
        <div
          style={{
            background: 'var(--bg-input)',
            border: '1px solid #0284c7',
            borderRadius: 'var(--radius-xs)',
            padding: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8' }}>
              🐻 Zustand (전역 + LocalStorage Persist)
            </span>
            <span style={{ fontSize: '0.7rem', color: '#10b981' }}>새로고침해도 보존</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '8px', lineHeight: 1.4 }}>
            사용자 선호도(Theme, 시간대, 활성 워크스페이스) 등 전역 공유가 필요한 상태에 적합합니다.
          </p>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem',
              color: 'var(--text-bright)',
              cursor: 'pointer',
              userSelect: 'none',
              marginTop: '8px',
            }}
          >
            <input
              type="checkbox"
              checked={isSundayStart}
              onChange={(e) => setSundayStart(e.target.checked)}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
            일요일부터 한 주 시작 (isSundayStart: <strong>{isSundayStart ? 'TRUE' : 'FALSE'}</strong>)
          </label>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)', marginTop: '6px', display: 'block' }}>
            토글 후 F5(새로고침)를 누르거나 다른 메뉴로 이동해도 영구 보존됩니다.
          </span>
        </div>
      </div>
    </div>
  );
};
