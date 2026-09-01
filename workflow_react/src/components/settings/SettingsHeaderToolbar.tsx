import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export const SettingsHeaderToolbar: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <SettingsIcon size={16} color="var(--primary)" />
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-bright)' }}>
          시스템 및 환경 설정 (Settings)
        </span>
      </div>
    </div>
  );
};