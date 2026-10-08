﻿import React from 'react';
import { Building2, FolderPlus, ChevronRight, ChevronDown, Edit3 } from 'lucide-react';
import type { Group } from '@/types';

interface OrgTreeSidebarProps {
  treeGroups: Group[];
  flatGroups: Group[];
  selectedGroupId: number | null;
  onSelectGroup: (id: number) => void;
  expandedGroupIds: Set<number>;
  onToggleExpand: (id: number) => void;
  isAuthenticated: boolean;
  onEditGroup: (group: Group) => void;
  onAddSubGroup: (parentId: number) => void;
}

export const OrgTreeSidebar: React.FC<OrgTreeSidebarProps> = ({
  treeGroups,
  flatGroups,
  selectedGroupId,
  onSelectGroup,
  expandedGroupIds,
  onToggleExpand,
  isAuthenticated,
  onEditGroup,
  onAddSubGroup,
}) => {
  const renderGroupTree = (groups: Group[], depth: number = 0) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {groups.map((group) => {
          const isSelected = selectedGroupId === group.id;
          const isExpanded = expandedGroupIds.has(group.id);
          const hasChildren = group.children && group.children.length > 0;

          return (
            <div key={group.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                onClick={() => onSelectGroup(group.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  paddingLeft: `${8 + depth * 14}px`,
                  background: isSelected ? 'var(--nav-item-active, rgba(0, 122, 204, 0.15))' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                  fontSize: '0.76rem',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'background 0.1s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand(group.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                  ) : (
                    <span style={{ width: '13px', display: 'inline-block' }} />
                  )}

                  <Building2 size={13} color={isSelected ? 'var(--primary)' : 'var(--text-muted)'} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {group.name}
                  </span>
                  {group.code && (
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      ({group.code})
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      background: isSelected ? 'var(--primary)' : 'var(--border-light)',
                      color: isSelected ? 'var(--text-bright)' : 'var(--text-sub)',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      fontWeight: 600,
                    }}
                    title="소속 멤버 수"
                  >
                    {group.members?.length || 0}
                  </span>

                  {isAuthenticated && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditGroup(group);
                        }}
                        title="그룹 정보 수정"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddSubGroup(group.id);
                        }}
                        title="하위 서브그룹 추가"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <FolderPlus size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {hasChildren && isExpanded && (
                <div style={{ marginLeft: '4px' }}>
                  {renderGroupTree(group.children!, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        width: '320px',
        flexShrink: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--text-sub)',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>조직 계층 구조 (Tree)</span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          총 {flatGroups.length}개 그룹
        </span>
      </div>

      {treeGroups.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          등록된 그룹/부서가 없습니다.
        </div>
      ) : (
        renderGroupTree(treeGroups)
      )}
    </div>
  );
};
