import React, { useState, useEffect } from 'react';
import { useDemoPrefStore } from '@/stores/useDemoPrefStore';
import { RenderCountBadge } from './RenderCountBadge';
import { Database } from 'lucide-react';

export const StorageInspectorCard: React.FC = () => {
  const [rawStorageValue, setRawStorageValue] = useState<string>('');

  const updateRaw = () => {
    const raw = localStorage.getItem('ag_demo_preferences') || '(비어있음)';
    try {
      setRawStorageValue(JSON.stringify(JSON.parse(raw), null, 2));
    } catch {
      setRawStorageValue(raw);
    }
  };

  useEffect(() => {
    updateRaw();
    const unsub = useDemoPrefStore.subscribe(() => {
      updateRaw();
    });
    return () => unsub();
  }, []);

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
          <Database size={16} color="#eab308" />
          실시간 브라우저 LocalStorage 검사기 (`ag_demo_preferences`)
        </h4>
        <RenderCountBadge label="인스펙터 렌더" />
      </div>

      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-sub)' }}>
        Zustand의 <code>persist</code> 미들웨어가 위 컨트롤러의 조작에 따라 실시간으로 기록한 실제 LocalStorage 원본 데이터입니다:
      </p>

      <pre
        style={{
          margin: 0,
          background: 'var(--bg-input)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '10px',
          fontSize: '0.72rem',
          color: '#38bdf8',
          fontFamily: 'Consolas, monospace',
          maxHeight: '160px',
          overflowY: 'auto',
        }}
      >
        {rawStorageValue}
      </pre>
    </div>
  );
};
