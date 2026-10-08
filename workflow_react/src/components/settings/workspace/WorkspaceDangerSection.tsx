﻿import React from 'react';
import { Trash2 } from 'lucide-react';

interface WorkspaceDangerSectionProps {
  onDeleteWorkspace: () => void;
}

export const WorkspaceDangerSection: React.FC<WorkspaceDangerSectionProps> = ({
  onDeleteWorkspace,
}) => {
  return (
    <div
      style={{
        background: 'rgba(241, 76, 76, 0.08)',
        border: '1px solid rgba(241, 76, 76, 0.3)',
        borderRadius: 'var(--radius-xs)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Trash2 size={16} color="var(--accent-rose)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ff8080' }}>
          위험 구역 (Danger Zone)
        </span>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: '1.4' }}>
        워크스페이스를 삭제하면 해당 워크스페이스의 모든 프로젝트, 일감, 채팅 데이터 및 물리 데이터베이스 파일이 영구 삭제됩니다.
      </p>
      <div>
        <button
          type="button"
          onClick={onDeleteWorkspace}
          style={{
            background: 'var(--accent-rose)',
            border: 'none',
            color: 'var(--text-bright)',
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-xs)',
            cursor: 'pointer',
          }}
        >
          워크스페이스 영구 삭제
        </button>
      </div>
    </div>
  );
};
