import React from 'react';
import { Filter, Search, Plus } from 'lucide-react';
import type { Project, User } from '@/types';
import { useTags } from '@/api/tags';
import { getProjectMembers } from '@/utils/projectMembers';

interface KanbanFilterBarProps {
  filterProjectId: number | 'ALL';
  handleProjectFilterChange: (projId: number | 'ALL') => void;
  filterAssigneeId: number | 'ALL' | 'MY';
  handleAssigneeFilterChange: (assigneeId: number | 'ALL' | 'MY') => void;
  filterTag?: string;
  handleTagFilterChange?: (tagName: string) => void;
  searchTerm: string;
  handleSearchChange: (search: string) => void;
  projects: Project[];
  users: User[];
  isAuthenticated: boolean;
  onOpenCreateIssue: () => void;
  onOpenAuth?: () => void;
}

export const KanbanFilterBar: React.FC<KanbanFilterBarProps> = ({
  filterProjectId,
  handleProjectFilterChange,
  filterAssigneeId,
  handleAssigneeFilterChange,
  filterTag = 'ALL',
  handleTagFilterChange,
  searchTerm,
  handleSearchChange,
  projects,
  users,
  isAuthenticated,
  onOpenCreateIssue,
  onOpenAuth,
}) => {
  const { data: allTags = [] } = useTags();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        background: 'var(--bg-card)',
        padding: '6px 10px',
        borderRadius: 'var(--radius-xs)',
        border: '1px solid var(--border-light)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-sub)', fontSize: '0.78rem' }}>
        <Filter size={13} color="var(--primary)" />
        <span>필터:</span>
      </div>

      {/* Project Filter */}
      <select
        value={filterProjectId}
        onChange={(e) => handleProjectFilterChange(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
        className="input-field"
        style={{ width: 'auto', minWidth: '140px' }}
      >
        <option value="ALL">전체 프로젝트 ({projects.length})</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.key})
          </option>
        ))}
      </select>

      {/* Assignee Filter */}
      <select
        value={filterAssigneeId}
        onChange={(e) =>
          handleAssigneeFilterChange(
            e.target.value === 'MY' ? 'MY' : e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
          )
        }
        className="input-field"
        style={{ width: 'auto', minWidth: '130px' }}
      >
        <option value="ALL">전체 담당자</option>
        {isAuthenticated && <option value="MY">내 담당 일감 (My Tasks)</option>}
        {getProjectMembers(
          filterProjectId !== 'ALL' ? projects.find((p) => p.id === filterProjectId) : undefined,
          users
        ).map((u) => (
          <option key={u.id} value={u.id}>
            {u.name ? `${u.name} (${u.email})` : u.email}
          </option>
        ))}
      </select>

      {/* 🏷️ Tag Filter Dropdown */}
      {handleTagFilterChange && (
        <select
          value={filterTag}
          onChange={(e) => handleTagFilterChange(e.target.value)}
          className="input-field"
          style={{ width: 'auto', minWidth: '120px' }}
        >
          <option value="ALL">전체 태그 ({allTags.length})</option>
          {allTags.map((t) => (
            <option key={t.id} value={t.name}>
              #{t.name} ({t.issuesCount ?? t.totalCount ?? 0})
            </option>
          ))}
        </select>
      )}

      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: '160px' }}>
        <Search size={13} color="var(--text-muted)" />
        <input
          type="text"
          className="input-field"
          placeholder="이슈 검색 또는 #태그..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Quick Create Action */}
      <button
        onClick={() => {
          if (!isAuthenticated && onOpenAuth) {
            onOpenAuth();
            return;
          }
          onOpenCreateIssue();
        }}
        className="btn-primary"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          fontSize: '0.78rem',
          height: '26px',
          whiteSpace: 'nowrap',
        }}
      >
        <Plus size={13} />
        <span>새 이슈</span>
      </button>
    </div>
  );
};