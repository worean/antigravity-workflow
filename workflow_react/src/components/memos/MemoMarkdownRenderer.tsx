import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { renderTextWithMemoMentions } from './MemoMentionLink';

interface MemoMarkdownRendererProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 텍스트 내 @메모제목 멘션을 감지하여 MemoMentionLink로 변환하는 헬퍼
 */
const renderChildrenWithMentions = (children: React.ReactNode): React.ReactNode => {
  if (typeof children === 'string') {
    return renderTextWithMemoMentions(children);
  }
  if (Array.isArray(children)) {
    return children.map((child, idx) => {
      if (typeof child === 'string') {
        return <React.Fragment key={idx}>{renderTextWithMemoMentions(child)}</React.Fragment>;
      }
      return child;
    });
  }
  return children;
};

/**
 * MemoMarkdownRenderer - GitHub Flavored Markdown(GFM) 및 @메모제목 멘션을 완벽 지원하는 렌더러
 */
export const MemoMarkdownRenderer: React.FC<MemoMarkdownRendererProps> = ({
  content,
  className = '',
  style = {},
}) => {
  if (!content || !content.trim()) {
    return (
      <div
        style={{
          padding: '12px 14px',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-xs)',
          border: '1px dashed var(--border-light)',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          ...style,
        }}
      >
        내용이 비어 있습니다.
      </div>
    );
  }

  return (
    <div
      className={`memo-markdown-body ${className}`}
      style={{
        fontSize: '0.92rem',
        lineHeight: 1.65,
        color: 'var(--text-main)',
        wordBreak: 'break-word',
        ...style,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '16px 0 8px', color: 'var(--text-bright)', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
              {renderChildrenWithMentions(children)}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: '1.18rem', fontWeight: 600, margin: '14px 0 6px', color: 'var(--text-bright)', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
              {renderChildrenWithMentions(children)}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '12px 0 4px', color: 'var(--text-bright)' }}>
              {renderChildrenWithMentions(children)}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '10px 0 4px', color: 'var(--text-bright)' }}>
              {renderChildrenWithMentions(children)}
            </h4>
          ),
          p: ({ children }) => (
            <p style={{ margin: '0 0 10px 0', lineHeight: 1.65 }}>
              {renderChildrenWithMentions(children)}
            </p>
          ),
          ul: ({ children }) => (
            <ul style={{ paddingLeft: '20px', margin: '0 0 10px 0', listStyleType: 'disc' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingLeft: '20px', margin: '0 0 10px 0', listStyleType: 'decimal' }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: '3px', lineHeight: 1.6 }}>
              {renderChildrenWithMentions(children)}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote
              style={{
                margin: '10px 0',
                padding: '8px 12px',
                borderLeft: '4px solid var(--primary)',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
                color: 'var(--text-sub)',
              }}
            >
              {renderChildrenWithMentions(children)}
            </blockquote>
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            return inline ? (
              <code
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--accent-cyan, #38bdf8)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '0.85em',
                  fontFamily: 'Consolas, monospace',
                  border: '1px solid var(--border-light)',
                }}
                {...props}
              >
                {children}
              </code>
            ) : (
              <pre
                style={{
                  background: 'var(--bg-subtle, #1e1e1e)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  overflowX: 'auto',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  fontFamily: 'Consolas, monospace',
                  color: 'var(--text-bright)',
                  margin: '10px 0',
                }}
              >
                <code {...props}>{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '12px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', border: '1px solid var(--border-light)' }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{ background: 'var(--bg-subtle)', color: 'var(--text-bright)', padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid var(--border-light)', fontWeight: 600 }}>
              {renderChildrenWithMentions(children)}
            </th>
          ),
          td: ({ children }) => (
            <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-light)', color: 'var(--text-main)' }}>
              {renderChildrenWithMentions(children)}
            </td>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
              {children}
            </a>
          ),
          hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '16px 0' }} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
