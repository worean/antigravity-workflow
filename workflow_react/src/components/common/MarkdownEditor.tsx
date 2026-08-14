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

  // Helper: 선택 구문 마크다운 포맷팅 래핑 / 텍스트 삽입
  const insertMarkdown = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  // 들여쓰기(Tab), 내어쓰기(Shift+Tab), 자동 목록(Enter) 스마트 핸들링
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;

    // 1. Tab / Shift+Tab 스마트 들여쓰기 & 내어쓰기
    if (e.key === 'Tab') {
      e.preventDefault();
      const tabStr = '  '; // 2 스페이스 들여쓰기

      if (e.shiftKey) {
        // Shift + Tab: 2칸 내어쓰기
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        if (value.substring(lineStart, lineStart + 2) === tabStr) {
          const newValue = value.substring(0, lineStart) + value.substring(lineStart + 2);
          onChange(newValue);
          setTimeout(() => {
            textarea.setSelectionRange(
              Math.max(lineStart, selectionStart - 2),
              Math.max(lineStart, selectionEnd - 2)
            );
          }, 0);
        }
      } else {
        // Tab: 2칸 들여쓰기 삽입
        const newValue =
          value.substring(0, selectionStart) + tabStr + value.substring(selectionEnd);
        onChange(newValue);
        setTimeout(() => {
          textarea.setSelectionRange(selectionStart + 2, selectionStart + 2);
        }, 0);
      }
      return;
    }

    // 2. Enter 키 자동 목록 이어나가기 (- , * , 1. )
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent.isComposing) return;

      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = value.substring(lineStart, selectionStart);

      // Unordered list (- or *)
      const bulletMatch = currentLine.match(/^(\s*)([-*])\s+(.*)/);
      if (bulletMatch) {
        const indent = bulletMatch[1];
        const symbol = bulletMatch[2];
        const content = bulletMatch[3];

        if (!content.trim()) {
          // 비어있는 목록 줄에서 Enter 누르면 목록 종료
          e.preventDefault();
          const newValue = value.substring(0, lineStart) + value.substring(selectionStart);
          onChange(newValue);
          return;
        }

        e.preventDefault();
        const nextListStr = `\n${indent}${symbol} `;
        const newValue =
          value.substring(0, selectionStart) + nextListStr + value.substring(selectionEnd);
        onChange(newValue);
        setTimeout(() => {
          textarea.setSelectionRange(
            selectionStart + nextListStr.length,
            selectionStart + nextListStr.length
          );
        }, 0);
        return;
      }

      // Ordered list (1. 2. 3.)
      const numMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)/);
      if (numMatch) {
        const indent = numMatch[1];
        const nextNum = parseInt(numMatch[2], 10) + 1;
        const content = numMatch[3];

        if (!content.trim()) {
          e.preventDefault();
          const newValue = value.substring(0, lineStart) + value.substring(selectionStart);
          onChange(newValue);
          return;
        }

        e.preventDefault();
        const nextListStr = `\n${indent}${nextNum}. `;
        const newValue =
          value.substring(0, selectionStart) + nextListStr + value.substring(selectionEnd);
        onChange(newValue);
        setTimeout(() => {
          textarea.setSelectionRange(
            selectionStart + nextListStr.length,
            selectionStart + nextListStr.length
          );
        }, 0);
        return;
      }
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
        background: 'rgba(15, 23, 42, 0.4)',
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
          background: 'rgba(255, 255, 255, 0.03)',
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
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
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
          background: 'transparent',
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
