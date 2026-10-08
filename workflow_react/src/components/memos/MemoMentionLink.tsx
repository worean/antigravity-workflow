import React from 'react';
import { useUIStore } from '@/stores/useUIStore';

interface MemoMentionLinkProps {
  title: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * MemoMentionLink - 텍스트 내 @메모제목을 클릭 가능한 팝업 모달 하이퍼링크로 렌더링
 */
export const MemoMentionLink: React.FC<MemoMentionLinkProps> = ({
  title,
  className = '',
  children,
}) => {
  const openMemoDetail = useUIStore((s) => s.openMemoDetail);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openMemoDetail(title);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1 font-medium transition-colors ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        padding: '1px 6px',
        borderRadius: '4px',
        backgroundColor: 'var(--bg-subtle)',
        color: 'var(--primary)',
        border: '1px solid var(--border-light)',
        cursor: 'pointer',
        fontSize: '0.85em',
        verticalAlign: 'baseline',
      }}
      title={`@${title} 메모 열람하기`}
    >
      <span style={{ opacity: 0.7 }}>@</span>
      <span>{children || title}</span>
    </button>
  );
};

/**
 * renderTextWithMemoMentions - 마크다운이나 일반 텍스트 내 @메모제목을 MemoMentionLink로 변환하는 유틸리티
 */
export const renderTextWithMemoMentions = (text: string): React.ReactNode => {
  if (!text) return text;

  // @단어 패턴 매칭 (한글, 영문, 숫자, 밑줄, 하이픈)
  const regex = /@([a-zA-Z0-9가-힣_-]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    const memoTitle = match[1];
    parts.push(
      <MemoMentionLink key={`mention-${matchIndex}`} title={memoTitle}>
        {memoTitle}
      </MemoMentionLink>
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};
