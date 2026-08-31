// -*- coding: utf-8 -*-
import React from 'react';
import { Filter, Search, Plus } from 'lucide-react';
import type { Project, User } from '@/types';
import { getProjectMembers } from '@/utils/projectMembers';

interface KanbanFilterBarProps {
  filterProjectId: number | 'ALL';
  handleProjectFilterChange: (projId: number | 'ALL') => void;
  filterAssigneeId: number | 'ALL' | 'MY';
  handleAssigneeFilterChange: (assigneeId: number | 'ALL' | 'MY') => void;
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
  searchTerm,
  handleSearchChange,
  projects,
  users,
  isAuthenticated,
  onOpenCreateIssue,
  onOpenAuth,
}) => {
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

      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: '160px' }}>
        <Search size={13} color="var(--text-muted)" />
        <input
          type="text"
          className="input-field"
          placeholder="이슈 검색 (제목/설명)..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Auth Buttons */}
      {!isAuthenticated && onOpenAuth && (
        <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
          로그인
        </button>
      )}
      {isAuthenticated && (
        <button className="btn btn-primary btn-sm" onClick={onOpenCreateIssue}>
          <Plus size={13} /> 이슈 생성
        </button>
      )}
    </div>
  );
};