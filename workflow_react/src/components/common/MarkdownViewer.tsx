import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
  content?: string | null;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  placeholder = '등록된 세부 설명이 없습니다.',
  className = '',
  style = {},
}) => {
  if (!content || !content.trim()) {
    return (
      <div
        style={{
          padding: '10px 14px',
          background: '#282828',
          borderRadius: 'var(--radius-xs)',
          border: '1px dashed #3c3c3c',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          ...style,
        }}
      >
        {placeholder}
      </div>
    );
  }

  return (
    <div
      className={`markdown-body ${className}`}
      style={{
        padding: '12px 14px',
        background: '#2d2d2d',
        borderRadius: 'var(--radius-xs)',
        border: '1px solid #3c3c3c',
        fontSize: '0.82rem',
        lineHeight: '1.5',
        color: 'var(--text-bright)',
        overflowX: 'auto',
        ...style,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '10px 0 6px', color: 'var(--primary)', borderBottom: '1px solid #3c3c3c', paddingBottom: '4px' }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '8px 0 4px', color: 'var(--text-bright)', borderBottom: '1px solid #383838', paddingBottom: '3px' }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, margin: '6px 0 4px', color: 'var(--text-bright)' }}>
              {children}
            </h3>
          ),
          p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
          ul: ({ children }) => <ul style={{ paddingLeft: '18px', margin: '0 0 8px' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: '18px', margin: '0 0 8px' }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: '2px' }}>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote
              style={{
                margin: '8px 0',
                padding: '6px 10px',
                borderLeft: '3px solid var(--primary)',
                background: 'rgba(0, 122, 204, 0.1)',
                borderRadius: '0 2px 2px 0',
                color: 'var(--text-sub)',
                fontSize: '0.8rem',
              }}
            >
              {children}
            </blockquote>
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            return inline ? (
              <code
                style={{
                  background: '#3c3c3c',
                  color: '#9cdcfe',
                  padding: '1px 5px',
                  borderRadius: '2px',
                  fontSize: '0.85em',
                  fontFamily: 'Consolas, monospace',
                }}
                {...props}
              >
                {children}
              </code>
            ) : (
              <pre
                style={{
                  background: '#1e1e1e',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid #383838',
                  overflowX: 'auto',
                  fontSize: '0.78rem',
                  fontFamily: 'Consolas, monospace',
                  color: '#d4d4d4',
                  margin: '8px 0',
                }}
              >
                <code {...props}>{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '8px 0' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.78rem',
                  background: '#252526',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              style={{
                background: '#333333',
                color: 'var(--text-bright)',
                padding: '5px 8px',
                textAlign: 'left',
                borderBottom: '1px solid #3c3c3c',
                fontWeight: 600,
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                padding: '5px 8px',
                borderBottom: '1px solid #383838',
                color: 'var(--text-main)',
              }}
            >
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#9cdcfe', textDecoration: 'underline' }}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
