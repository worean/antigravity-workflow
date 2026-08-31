// -*- coding: utf-8 -*-
import React from 'react';
import { Building2, Trash2, X } from 'lucide-react';
import type { Project, Group } from '@/types';
import { Button } from '@/components/common';

interface ProjectGroupsTabProps {
  project: Project;
  allGroups: Group[];
  isPM: boolean;
  handleUpdateGroupRole: (groupId: number, role: string) => Promise<void>;
  handleRemoveGroup: (groupId: number) => Promise<void>;
  showAddGroupModal: boolean;
  setShowAddGroupModal: (show: boolean) => void;
  selectedGroupIdToAdd: number | '';
  setSelectedGroupIdToAdd: (id: number | '') => void;
  selectedGroupRole: string;
  setSelectedGroupRole: (role: string) => void;
  handleAddGroup: (e: React.FormEvent) => Promise<void>;
}

export const ProjectGroupsTab: React.FC<ProjectGroupsTabProps> = ({
  project,
  allGroups,
  isPM,
  handleUpdateGroupRole,
  handleRemoveGroup,
  showAddGroupModal,
  setShowAddGroupModal,
  selectedGroupIdToAdd,
  setSelectedGroupIdToAdd,
  selectedGroupRole,
  setSelectedGroupRole,
  handleAddGroup,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
        💡 그룹 참여 시 해당 그룹의 모든 구성원이 프로젝트에 권한을 부여받으며, 개인 멤버와의 중복 참여도 허용됩니다.
      </div>

      {(!project.groups || project.groups.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          참여 중인 조직 그룹이 없습니다.
        </div>
      ) : (
        project.groups.map((g) => (
          <div
            key={g.id || g.groupId}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#252526',
              border: '1px solid #333333',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '4px',
                  background: 'rgba(78, 201, 176, 0.15)',
                  color: '#4ec9b0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{g.group?.name}</span>
                  {g.group?.code && (
                    <span style={{ fontSize: '0.65rem', background: '#333', color: 'var(--text-sub)', padding: '1px 5px', borderRadius: '3px' }}>
                      {g.group.code}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {g.group?.parent ? `${g.group.parent.name} 하위 · ` : ''}
                  {g.group?.members ? `구성원 ${g.group.members.length}명` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isPM ? (
                <select
                  className="input-field"
                  value={g.role}
                  onChange={(e) => handleUpdateGroupRole(g.groupId, e.target.value)}
                  style={{ width: '95px', height: '24px', fontSize: '0.72rem', padding: '0 4px' }}
                >
                  <option value="ADMIN">관리자 (ADMIN)</option>
                  <option value="MEMBER">멤버 (MEMBER)</option>
                  <option value="VIEWER">뷰어 (VIEWER)</option>
                </select>
              ) : (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    background: 'rgba(78, 201, 176, 0.15)',
                    color: '#4ec9b0',
                    fontWeight: 600,
                  }}
                >
                  {g.role}
                </span>
              )}

              {isPM && (
                <button
                  type="button"
                  onClick={() => handleRemoveGroup(g.groupId)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f43f5e',
                    cursor: 'pointer',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="그룹 제외"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))
      )}

      {/* Modal: Add Group */}
      {showAddGroupModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '380px',
              background: '#252526',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                참여 그룹 추가
              </div>
              <button onClick={() => setShowAddGroupModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddGroup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                  추가할 조직 그룹 선택 *
                </label>
                <select
                  className="input-field"
                  value={selectedGroupIdToAdd}
                  onChange={(e) => setSelectedGroupIdToAdd(Number(e.target.value))}
                  required
                  style={{ width: '100%', fontSize: '0.8rem' }}
                >
                  <option value="">조직 그룹을 선택하세요...</option>
                  {allGroups
                    .filter((g) => !project.groups?.some((pg) => pg.groupId === g.id))
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} {g.code ? `(${g.code})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                  그룹 기본 역할 (Role)
                </label>
                <select
                  className="input-field"
                  value={selectedGroupRole}
                  onChange={(e) => setSelectedGroupRole(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem' }}
                >
                  <option value="MEMBER">멤버 (MEMBER) - 기본</option>
                  <option value="ADMIN">관리자 (ADMIN)</option>
                  <option value="VIEWER">뷰어 (VIEWER)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddGroupModal(false)}>
                  취소
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={!selectedGroupIdToAdd}>
                  추가하기
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};