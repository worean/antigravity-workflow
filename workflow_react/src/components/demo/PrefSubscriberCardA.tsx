import React from 'react';
import { useDemoPrefStore } from '@/stores/useDemoPrefStore';
import { RenderCountBadge } from './RenderCountBadge';
import { Calendar } from 'lucide-react';

export const PrefSubscriberCardA: React.FC = () => {
  // ⭐ 핵심: isSundayStart 값 하나만 골라서 구독(Selector)합니다!
  const isSundayStart = useDemoPrefStore((s) => s.isSundayStart);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={16} color="#10b981" />
          컴포넌트 A (달력/WBS 위젯 모델)
        </h4>
        <RenderCountBadge label="컴포넌트 A 렌더" />
      </div>

      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>
        구독 중인 속성: <code>isSundayStart</code>만 구독함.
        <br />
        <span style={{ color: '#10b981' }}>
          👉 컨트롤러에서 테마나 폰트 크기를 아무리 바꿔도, 이 카드의 렌더 횟수는 전혀 올라가지 않습니다! (완벽한 리렌더 방어)
        </span>
      </p>

      <div
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '10px',
          fontSize: '0.8rem',
        }}
      >
        현재 기준 요일: <strong style={{ color: '#10b981' }}>{isSundayStart ? '일요일 시작 (주말 퍼스트)' : '월요일 시작 (평일 퍼스트)'}</strong>
      </div>
    </div>
  );
};
