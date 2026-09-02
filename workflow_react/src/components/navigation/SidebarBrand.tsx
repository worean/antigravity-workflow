import React from 'react';
import { Code2 } from 'lucide-react';

export const SidebarBrand: React.FC = () => {
  return (
    <div
      style={{
        padding: '8px 8px 12px 8px',
        borderBottom: '1px solid var(--border-light)',
        marginBottom: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: 'var(--radius-xs)',
          background: 'linear-gradient(135deg, #007acc 0%, #0e639c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 8px rgba(0, 122, 204, 0.4)',
        }}
      >
        <Code2 size={14} color="#ffffff" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--text-bright)',
            letterSpacing: '-0.2px',
            lineHeight: 1.2,
          }}
        >
          AntiGravity
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            color: 'var(--accent-cyan)',
            background: 'rgba(0,122,204,0.15)',
            padding: '0 4px',
            borderRadius: '2px',
            fontWeight: 600,
          }}
        >
          Workflow
        </span>
      </div>
    </div>
  );
};
