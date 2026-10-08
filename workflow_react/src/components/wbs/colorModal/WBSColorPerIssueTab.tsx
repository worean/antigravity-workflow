import React from 'react';
import { WBS_PALETTE, resolveWBSColorTheme } from '@/utils/wbs';
import type { Issue } from '@/types';

interface WBSColorPerIssueTabProps {
  rootIssues: Issue[];
  wbsRootColorMap: Record<number, string>;
  setWBSRootColor: (issueId: number, color: string) => void;
  removeWBSRootColor: (issueId: number) => void;
}

export const WBSColorPerIssueTab: React.FC<WBSColorPerIssueTabProps> = ({
  rootIssues,
  wbsRootColorMap,
  setWBSRootColor,
  removeWBSRootColor,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
      {rootIssues.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          현재 프로젝트에 최상위 일감이 없습니다.
        </div>
      ) : (
        rootIssues.map((iss) => {
          const assignedColor = wbsRootColorMap[iss.id];
          const resolvedTheme = resolveWBSColorTheme(assignedColor, iss.id);

          return (
            <div
              key={iss.id}
              style={{
                padding: '8px 12px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    background: resolvedTheme.base,
                    border: `1px solid ${resolvedTheme.border}`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-bright)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  #{iss.issueNumber || iss.id} {iss.title}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {/* Palette Preset Dropdown */}
                <select
                  value={assignedColor || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setWBSRootColor(iss.id, e.target.value);
                    } else {
                      removeWBSRootColor(iss.id);
                    }
                  }}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    background: 'var(--bg-input)',
                    color: 'var(--text-bright)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-xs)',
                    outline: 'none',
                  }}
                >
                  <option value="">자동 기본색</option>
                  {WBS_PALETTE.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>

                {/* Direct Color Picker */}
                <input
                  type="color"
                  value={assignedColor?.startsWith('#') ? assignedColor : resolvedTheme.base}
                  onChange={(e) => setWBSRootColor(iss.id, e.target.value)}
                  style={{
                    width: '26px',
                    height: '24px',
                    padding: 0,
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                    background: 'none',
                  }}
                  title="직접 색상 지정"
                />

                {assignedColor && (
                  <button
                    type="button"
                    onClick={() => removeWBSRootColor(iss.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      textDecoration: 'underline',
                    }}
                    title="기본 자동 색상으로 복원"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
