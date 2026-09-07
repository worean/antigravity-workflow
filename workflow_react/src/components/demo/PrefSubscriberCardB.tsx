import React from 'react';
import { useDemoPrefStore } from '@/stores/useDemoPrefStore';
import { RenderCountBadge } from './RenderCountBadge';
import { Palette } from 'lucide-react';

export const PrefSubscriberCardB: React.FC = () => {
  // ⭐ 핵심: themeMode 와 fontSize 만 골라서 구독합니다!
  const themeMode = useDemoPrefStore((s) => s.themeMode);
  const fontSize = useDemoPrefStore((s) => s.fontSize);

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
          <Palette size={16} color="#f43f5e" />
          컴포넌트 B (헤더/스타일러 위젯 모델)
        </h4>
        <RenderCountBadge label="컴포넌트 B 렌더" />
      </div>

      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>
        구독 중인 속성: <code>themeMode</code>, <code>fontSize</code>만 구독함.
        <br />
        <span style={{ color: '#f43f5e' }}>
          👉 컨트롤러에서 '일요일 시작'이나 '카드 축소'를 토글해도, 이 카드의 렌더 횟수는 1도 올라가지 않습니다!
        </span>
      </p>

      <div
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '10px',
          fontSize: `${fontSize}px`,
        }}
      >
        선택된 테마: <strong style={{ color: '#f43f5e' }}>{themeMode.toUpperCase()}</strong> (폰트 크기: {fontSize}px)
      </div>
    </div>
  );
};
