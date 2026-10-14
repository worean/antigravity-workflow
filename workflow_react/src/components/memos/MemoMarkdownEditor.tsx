import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Heading,
  List,
  CheckSquare,
  Code,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  Eye,
  Edit2,
} from 'lucide-react';
import { MemoMarkdownRenderer } from './MemoMarkdownRenderer';
import { applyMarkdownSyntax, handleMarkdownKeyAction } from '@/utils/markdownUtils';

export interface MemoMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

export const MemoMarkdownEditor: React.FC<MemoMarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '마크다운 문법으로 작성하세요. (예: # 제목, - 목록, @참조메모)',
  rows = 10,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 공통 markdownUtils 기반 선택 구문 삽입
  const insertSyntax = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const res = applyMarkdownSyntax(
      value,
      textarea.selectionStart,
      textarea.selectionEnd,
      before,
      after,
      defaultText
    );
    onChange(res.newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(res.newSelectionStart, res.newSelectionEnd);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea || e.nativeEvent.isComposing) return;

    const res = handleMarkdownKeyAction(
      e.key,
      e.shiftKey,
      value,
      textarea.selectionStart,
      textarea.selectionEnd
    );

    if (res) {
      e.preventDefault();
      onChange(res.newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(res.newSelectionStart, res.newSelectionEnd);
      }, 0);
    }
  };

  const toolbarButtons = [
    { icon: <Bold size={13} />, label: '굵게', action: () => insertSyntax('**', '**', '굵은 텍스트') },
    { icon: <Italic size={13} />, label: '기울임', action: () => insertSyntax('*', '*', '기울임 텍스트') },
    { icon: <Heading size={13} />, label: '제목', action: () => insertSyntax('### ', '', '제목') },
    { icon: <List size={13} />, label: '목록', action: () => insertSyntax('- ', '', '항목') },
    { icon: <CheckSquare size={13} />, label: '체크박스', action: () => insertSyntax('- [ ] ', '', '할 일') },
    { icon: <Quote size={13} />, label: '인용', action: () => insertSyntax('> ', '', '인용구') },
    { icon: <Code size={13} />, label: '코드', action: () => insertSyntax('`', '`', 'code') },
    {
      icon: <TableIcon size={13} />,
      label: '표',
      action: () =>
        insertSyntax(
          '\n| 열 1 | 열 2 | 열 3 |\n| --- | --- | --- |\n| 내용 1 | 내용 2 | 내용 3 |\n',
          '',
          ''
        ),
    },
    { icon: <LinkIcon size={13} />, label: '링크', action: () => insertSyntax('[', '](https://)', '링크 텍스트') },
  ];

  return (
    <div
      style={{
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--bg-subtle)',
        overflow: 'hidden',
      }}
    >
      {/* 상단 탭 및 툴바 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-light)',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        {/* 편집 / 미리보기 탭 */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '4px',
              border: activeTab === 'write' ? '1px solid var(--primary)' : '1px solid transparent',
              backgroundColor: activeTab === 'write' ? 'var(--bg-subtle)' : 'transparent',
              color: activeTab === 'write' ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Edit2 size={12} />
            <span>편집</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '4px',
              border: activeTab === 'preview' ? '1px solid var(--primary)' : '1px solid transparent',
              backgroundColor: activeTab === 'preview' ? 'var(--bg-subtle)' : 'transparent',
              color: activeTab === 'preview' ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Eye size={12} />
            <span>미리보기</span>
          </button>
        </div>

        {/* 퀵 포맷팅 툴바 (작성 모드일 때만 표시) */}
        {activeTab === 'write' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {toolbarButtons.map((btn, idx) => (
              <button
                key={idx}
                type="button"
                onClick={btn.action}
                disabled={disabled}
                title={btn.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '24px',
                  borderRadius: '3px',
                  border: '1px solid transparent',
                  backgroundColor: 'transparent',
                  color: 'var(--text-sub)',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.color = 'var(--text-bright)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-sub)';
                }}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 본문 영역 */}
      {activeTab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '12px 14px',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            boxSizing: 'border-box',
            resize: 'vertical',
            fontFamily: 'Consolas, "Pretendard", monospace',
            minHeight: '160px',
          }}
        />
      ) : (
        <div
          style={{
            padding: '14px 16px',
            minHeight: '160px',
            maxHeight: '400px',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <MemoMarkdownRenderer content={value} />
        </div>
      )}
    </div>
  );
};
