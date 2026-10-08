﻿import React from 'react';
import { Save, RotateCcw } from 'lucide-react';

interface IssueDrawerDraftBannerProps {
  onDiscardDraft: () => void;
}

export const IssueDrawerDraftBanner: React.FC<IssueDrawerDraftBannerProps> = ({
  onDiscardDraft,
}) => {
  return (
    <div
      style={{
        background: 'var(--warning-bg, rgba(234, 179, 8, 0.12))',
        border: '1px solid var(--warning-border, rgba(234, 179, 8, 0.35))',
        borderRadius: 'var(--radius-xs)',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        fontSize: '0.75rem',
        color: 'var(--warning-text, var(--primary))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Save size={13} />
        <span>이전에 작성 중이던 수정본이 복원되었습니다.</span>
      </div>
      <button
        type="button"
        onClick={onDiscardDraft}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-sub)',
          cursor: 'pointer',
          fontSize: '0.72rem',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          textDecoration: 'underline',
        }}
        title="임시 저장본을 버리고 서버 원본 데이터로 되돌립니다."
      >
        <RotateCcw size={11} /> 원본으로 되돌리기
      </button>
    </div>
  );
};
