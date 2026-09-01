import React from 'react';
import type { Group, GroupMember, User as UserType } from '@/types';
import {
  Building2,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  UserPlus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Button, Spinner, Avatar } from '@/components/common';
import { GroupModal } from '@/components/GroupModal';

interface SettingsOrgTabProps {
  isAuthenticated: boolean;
  user: UserType | null;
  treeGroups: Group[];
  flatGroups: Group[];
  loadingGroups: boolean;
  selectedGroupId: number | null;
  setSelectedGroupId: (id: number | null) => void;
  expandedGroupIds: Set<number>;
  setExpandedGroupIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  allUsers: UserType[];
  showGroupForm: boolean;
  setShowGroupForm: (show: boolean) => void;
  groupParentId: number | null;
  setGroupParentId: (id: number | null) => void;
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  newGroupCode: string;
  setNewGroupCode: (code: string) => void;
  newGroupDesc: string;
  setNewGroupDesc: (desc: string) => void;
  showMemberForm: boolean;
  setShowMemberForm: (show: boolean) => void;
  newMemberUserId: number | '';
  setNewMemberUserId: (id: number | '') => void;
  newMemberRole: string;
  setNewMemberRole: (role: string) => void;
  newMemberTitle: string;
  setNewMemberTitle: (title: string) => void;
  isPending: boolean;
  handleCreateGroup: (e: React.FormEvent) => void;
  handleDeleteGroup: (groupId: number, groupName: string) => void;
  handleAddMember: (e: React.FormEvent) => void;
  handleUpdateMemberRole: (member: GroupMember, newRole: string) => void;
  handleRemoveMember: (membershipId: number, memberName: string) => void;
}

export const SettingsOrgTab: React.FC<SettingsOrgTabProps> = ({
  isAuthenticated,
  user,
  treeGroups,
  flatGroups,
  loadingGroups,
  selectedGroupId,
  setSelectedGroupId,
  expandedGroupIds,
  setExpandedGroupIds,
  allUsers,
  showGroupForm,
  setShowGroupForm,
  groupParentId,
  setGroupParentId,
  newGroupName: _newGroupName,
  setNewGroupName,
  newGroupCode: _newGroupCode,
  setNewGroupCode,
  newGroupDesc: _newGroupDesc,
  setNewGroupDesc,
  showMemberForm,
  setShowMemberForm,
  newMemberUserId,
  setNewMemberUserId,
  newMemberRole,
  setNewMemberRole,
  newMemberTitle,
  setNewMemberTitle,
  isPending,
  handleCreateGroup,
  handleDeleteGroup,
  handleAddMember,
  handleUpdateMemberRole,
  handleRemoveMember,
}) => {
  const selectedGroup = flatGroups.find((g) => g.id === selectedGroupId) || flatGroups[0] || null;

  const toggleGroupExpand = (groupId: number) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

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
                onClick={() => setSelectedGroupId(group.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  paddingLeft: `${8 + depth * 14}px`,
                  background: isSelected ? '#37373d' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
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
                        toggleGroupExpand(group.id);
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
                      background: isSelected ? 'var(--primary)' : '#333333',
                      color: isSelected ? '#ffffff' : 'var(--text-sub)',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      fontWeight: 600,
                    }}
                    title="소속 멤버 수"
                  >
                    {group.members?.length || 0}
                  </span>

                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGroupParentId(group.id);
                        setNewGroupName('');
                        setNewGroupCode('');
                        setNewGroupDesc('');
                        setShowGroupForm(true);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Header Title & Top Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', flexShrink: 0 }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={16} color="var(--primary)" />
            조직도 및 부서/팀 계층 관리
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            본부, 부서, 서브그룹 및 팀 계층 구조를 정의하고 소속 팀원과 관리자 권한을 관리합니다.
          </p>
        </div>
        {isAuthenticated && (
          <Button
            variant="primary"
            size="sm"
            icon={<FolderPlus size={13} />}
            onClick={() => {
              setGroupParentId(null);
              setNewGroupName('');
              setNewGroupCode('');
              setNewGroupDesc('');
              setShowGroupForm(true);
            }}
          >
            최상위 그룹 추가
          </Button>
        )}
      </div>

      {loadingGroups ? (
        <Spinner centered label="조직도 데이터 불러오는 중..." />
      ) : (
        <div style={{ display: 'flex', gap: '14px', flex: 1, minHeight: '400px' }}>
          {/* Left Column: Organization Tree */}
          <div
            style={{
              width: '320px',
              flexShrink: 0,
              background: '#252526',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-sub)', borderBottom: '1px solid #333', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

          {/* Right Column: Selected Group Detail & Members */}
          <div
            style={{
              flex: 1,
              background: '#252526',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
            }}
          >
            {selectedGroup ? (
              <>
                {/* Group Details Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #333', paddingBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={18} color="var(--primary)" />
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                        {selectedGroup.name}
                      </h4>
                      {selectedGroup.code && (
                        <span style={{ fontSize: '0.72rem', background: '#333', color: 'var(--text-sub)', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace' }}>
                          {selectedGroup.code}
                        </span>
                      )}
                    </div>
                    {selectedGroup.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {selectedGroup.description}
                      </p>
                    )}
                  </div>

                  {isAuthenticated && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<UserPlus size={13} />}
                        onClick={() => {
                          setNewMemberUserId('');
                          setNewMemberRole('MEMBER');
                          setNewMemberTitle('');
                          setShowMemberForm(true);
                        }}
                      >
                        멤버 배정
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteGroup(selectedGroup.id, selectedGroup.name)}
                        style={{ color: '#f87171' }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Group Members List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="var(--primary)" />
                      <span>소속 멤버 및 권한 목록 ({selectedGroup.members?.length || 0}명)</span>
                    </div>
                  </div>

                  {!selectedGroup.members || selectedGroup.members.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', border: '1px dashed #3e3e42', borderRadius: 'var(--radius-xs)' }}>
                      해당 그룹에 배정된 멤버가 없습니다. '멤버 배정' 버튼을 눌러 팀원을 추가하세요.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedGroup.members.map((member) => {
                        const mUser = member.user;
                        const roleUpper = (member.role || 'MEMBER').toUpperCase();

                        return (
                          <div
                            key={member.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              background: '#2d2d2d',
                              border: '1px solid var(--border-light)',
                              borderRadius: 'var(--radius-xs)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Avatar user={mUser} size={28} shape="circle" />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                                    {mUser?.name || '사용자'}
                                  </span>
                                  {member.title && (
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                      ({member.title})
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {mUser?.email}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {/* Role Selector */}
                              {isAuthenticated ? (
                                <select
                                  value={member.role || 'MEMBER'}
                                  onChange={(e) => handleUpdateMemberRole(member, e.target.value)}
                                  className="input-field"
                                  style={{
                                    fontSize: '0.72rem',
                                    height: '24px',
                                    padding: '0 6px',
                                    width: 'auto',
                                    background:
                                      roleUpper === 'OWNER' || roleUpper === 'ADMIN' || roleUpper === 'LEADER'
                                        ? 'rgba(230, 162, 60, 0.15)'
                                        : 'var(--bg-input)',
                                    color:
                                      roleUpper === 'OWNER' || roleUpper === 'ADMIN' || roleUpper === 'LEADER'
                                        ? '#e6a23c'
                                        : 'var(--text-main)',
                                    border:
                                      roleUpper === 'OWNER' || roleUpper === 'ADMIN' || roleUpper === 'LEADER'
                                        ? '1px solid rgba(230, 162, 60, 0.4)'
                                        : '1px solid var(--border-light)',
                                  }}
                                >
                                  {(() => {
                                    const isCurGroupOwner = user?.role === 'ADMIN' || selectedGroup.members?.some((m) => m.userId === user?.id && m.role?.toUpperCase() === 'OWNER');
                                    return (
                                      <>
                                        {isCurGroupOwner && (
                                          <option value="OWNER">👑 1. 오너 (Owner - 기존 오너 자동 승계)</option>
                                        )}
                                        <option value="ADMIN">⭐ 2. 관리자 (PM - 여러명 가능)</option>
                                        <option value="MEMBER">💻 3. 담당자 (개발자)</option>
                                        <option value="VIEWER">👁️ 4. 참석자 (리뷰어)</option>
                                      </>
                                    );
                                  })()}
                                </select>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                    background: roleUpper === 'LEADER' ? 'rgba(230, 162, 60, 0.2)' : 'rgba(0, 122, 204, 0.15)',
                                    color: roleUpper === 'LEADER' ? '#e6a23c' : 'var(--accent-cyan)',
                                  }}
                                >
                                  {member.role}
                                </span>
                              )}

                              {isAuthenticated && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(member.id, mUser?.name || mUser?.email || '멤버')}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                  }}
                                  title="그룹에서 제외"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                좌측 조직도에서 그룹을 선택하세요.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Group Create / Edit Modal (IssueModal 표준) */}
      <GroupModal
        isOpen={showGroupForm}
        onClose={() => setShowGroupForm(false)}
        parentId={groupParentId}
        flatGroups={flatGroups}
        onSuccess={() => {
          if (handleCreateGroup) {
            handleCreateGroup({ preventDefault: () => {} } as any);
          }
        }}
      />

      {/* 2. Add Member Modal (IssueModal 표준 화면 중앙 정렬) */}
      {showMemberForm && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setShowMemberForm(false)}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '440px',
              width: '92%',
              padding: '16px 20px',
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto',
              margin: 'auto',
              borderRadius: '6px',
              background: '#252526',
              border: '1px solid #454545',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                borderBottom: '1px solid var(--border-light, #3c3c3c)',
                paddingBottom: '8px',
              }}
            >
              <h3
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: 0,
                  color: 'var(--text-bright, #fff)',
                }}
              >
                <UserPlus size={16} color="var(--primary, #007acc)" />
                <span>'{selectedGroup?.name}' 멤버 배정</span>
              </h3>
              <button
                onClick={() => setShowMemberForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #888)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                  배정할 사용자 <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <select
                  className="input-field"
                  value={newMemberUserId}
                  onChange={(e) => setNewMemberUserId(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">-- 사용자를 선택하세요 --</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ? `${u.name} (${u.email})` : u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                  그룹(조직) 내 권한 <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <select
                  className="input-field"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                >
                  {(() => {
                    const isCurGroupOwner = user?.role === 'ADMIN' || selectedGroup?.members?.some((m) => m.userId === user?.id && m.role?.toUpperCase() === 'OWNER');
                    return (
                      <>
                        {isCurGroupOwner && (
                          <option value="OWNER">👑 1. 오너 (Owner - 기존 오너 자동 승계)</option>
                        )}
                        <option value="ADMIN">⭐ 2. 관리자 (PM - 여러명 가능)</option>
                        <option value="MEMBER">💻 3. 담당자 (개발자)</option>
                        <option value="VIEWER">👁️ 4. 참석자 (리뷰어)</option>
                      </>
                    );
                  })()}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                  직책 (Title)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={newMemberTitle}
                  onChange={(e) => setNewMemberTitle(e.target.value)}
                  placeholder="예: 수석연구원, 테크리드, 개발자"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowMemberForm(false)}
                  disabled={isPending}
                  style={{ flex: 1 }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isPending}
                  style={{ flex: 1 }}
                >
                  {isPending ? '배정 중...' : '배정 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};