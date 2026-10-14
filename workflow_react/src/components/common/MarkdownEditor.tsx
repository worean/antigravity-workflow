import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  FileCode,
  Quote,
  Link,
} from 'lucide-react';
import { applyMarkdownSyntax, handleMarkdownKeyAction } from '@/utils/markdownUtils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: string;
  className?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Markdown 문법을 사용하여 입력하세요...',
  rows = 8,
  minHeight = '180px',
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Helper: 공통 markdownUtils 기반 마크다운 구문 삽입
  const insertMarkdown = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const res = applyMarkdownSyntax(
      value,
      textarea.selectionStart,
      textarea.selectionEnd,
      prefix,
      suffix,
      defaultText
    );
    onChange(res.newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(res.newSelectionStart, res.newSelectionEnd);
    }, 0);
  };

  // 들여쓰기(Tab), 내어쓰기(Shift+Tab), 자동 목록(Enter) 스마트 핸들링
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    if (e.nativeEvent.isComposing) return;

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
    { label: 'Bold (굵게)', icon: Bold, action: () => insertMarkdown('**', '**', '텍스트') },
    { label: 'Italic (기울임)', icon: Italic, action: () => insertMarkdown('*', '*', '텍스트') },
    { label: 'Heading 1', icon: Heading1, action: () => insertMarkdown('# ', '', '제목') },
    { label: 'Heading 2', icon: Heading2, action: () => insertMarkdown('## ', '', '소제목') },
    { label: 'Bullet List (목록)', icon: List, action: () => insertMarkdown('- ', '', '항목') },
    { label: 'Numbered List (순서 목록)', icon: ListOrdered, action: () => insertMarkdown('1. ', '', '첫번째 항목') },
    { label: 'Checklist (체크리스트)', icon: CheckSquare, action: () => insertMarkdown('- [ ] ', '', '할 일 항목') },
    { label: 'Inline Code (인라인 코드)', icon: Code, action: () => insertMarkdown('`', '`', 'code') },
    { label: 'Code Block (코드 블록)', icon: FileCode, action: () => insertMarkdown('```js\n', '\n```', 'console.log("hello");') },
    { label: 'Quote (인용구)', icon: Quote, action: () => insertMarkdown('> ', '', '인용할 문장') },
    { label: 'Link (링크)', icon: Link, action: () => insertMarkdown('[', '](https://)', '링크 텍스트') },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        background: 'var(--bg-card)',
        overflow: 'hidden',
      }}
    >
      {/* Markdown Quick Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          padding: '6px 8px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        {toolbarButtons.map((btn, idx) => {
          const IconComponent = btn.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={btn.action}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-sub)',
                padding: '4px 6px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              title={btn.label}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary-subtle)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--text-sub)';
              }}
            >
              <IconComponent size={14} />
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', paddingRight: '4px' }}>
          💡 Tab: 들여쓰기 | Shift+Tab: 내어쓰기
        </div>
      </div>

      {/* Editor Textarea */}
      <textarea
        ref={textareaRef}
        className={`input-field ${className}`}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%',
          border: 'none',
          borderRadius: 0,
          background: 'var(--bg-input)',
          color: 'var(--text-main)',
          minHeight,
          resize: 'vertical',
          fontSize: '0.88rem',
          fontFamily: 'monospace',
          lineHeight: '1.5',
          padding: '12px 14px',
        }}
      />
    </div>
  );
};
