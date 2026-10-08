import React from 'react';
import type { User as UserType } from '@/types';
import { Building2, RefreshCw, Crown, Briefcase, ExternalLink, Clock } from 'lucide-react';
import { Button, Spinner } from '@/components/common';

interface ProfileGroupListProps {
  user: UserType | null;
  loadingProfile: boolean;
  loadProfileData: () => Promise<void>;
  setSelectedGroupId: (groupId: number) => void;
  setActiveSubTab: (tab: any) => void;
}

export const ProfileGroupList: React.FC<ProfileGroupListProps> = ({
  user,
  loadingProfile,
  loadProfileData,
  setSelectedGroupId,
  setActiveSubTab,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={15} color="var(--primary)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)' }}>
            현재 소속된 조직 및 그룹 (My Groups & Teams)
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              padding: '1px 6px',
              background: 'var(--primary)',
              color: 'var(--text-bright, #ffffff)',
              borderRadius: '10px',
              fontWeight: 600,
            }}
          >
            {user?.groupMemberships?.length || 0}
          </span>
        </div>

        <button
          type="button"
          onClick={loadProfileData}
          disabled={loadingProfile}
          title="소속 그룹 정보 새로고침"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            padding: '2px 6px',
            borderRadius: 'var(--radius-xs)',
          }}
        >
          <RefreshCw size={12} className={loadingProfile ? 'spin' : ''} />
          새로고침
        </button>
      </div>

      {loadingProfile ? (
        <Spinner centered label="소속 그룹 정보 불러오는 중..." />
      ) : user?.groupMemberships && user.groupMemberships.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {user.groupMemberships.map((membership) => {
            const grp = membership.group;
            const isLeader = membership.role === 'LEADER';
            const hasParent = grp?.parent;

            return (
              <div
                key={membership.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* 1st Row: Group Name, Code, and Role Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Building2 size={15} color={isLeader ? 'var(--accent-yellow, #e6a23c)' : 'var(--primary)'} />
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                      {grp?.name || `그룹 #${membership.groupId}`}
                    </span>
                    {grp?.code && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '1px 5px',
                          background: 'var(--border-light)',
                          color: 'var(--text-sub)',
                          borderRadius: '3px',
                          fontFamily: 'monospace',
                        }}
                      >
                        {grp.code}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {(() => {
                      const roleUpper = (membership.role || 'MEMBER').toUpperCase();
                      if (roleUpper === 'ADMIN' || roleUpper === 'LEADER') {
                        return (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 8px',
                              background: 'rgba(230, 162, 60, 0.15)',
                              color: 'var(--accent-yellow, #e6a23c)',
                              border: '1px solid rgba(230, 162, 60, 0.3)',
                              borderRadius: '12px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Crown size={11} />
                            {roleUpper === 'ADMIN' ? '그룹 관리자' : '그룹 리더'}
                          </span>
                        );
                      }
                      return (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 8px',
                            background: 'var(--bg-subtle)',
                            color: 'var(--text-sub)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '12px',
                          }}
                        >
                          일반 멤버
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* 2nd Row: Hierarchy Parent Path */}
                {hasParent && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>상위 조직:</span>
                    <span
                      style={{
                        padding: '1px 6px',
                        background: 'var(--bg-subtle)',
                        borderRadius: '3px',
                        color: 'var(--text-sub)',
                        fontWeight: 500,
                      }}
                    >
                      {grp?.parent?.name}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>➔</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{grp?.name}</span>
                  </div>
                )}

                {/* 3rd Row: Assigned Job Title in Group & Action */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    flexWrap: 'wrap',
                    paddingTop: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-sub)' }}>
                      조직 내 역할:
                    </span>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: membership.title ? 'var(--text-bright)' : 'var(--text-muted)',
                      }}
                    >
                      {membership.title || '지정된 직함 없음'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(membership.groupId);
                      setActiveSubTab('organization');
                    }}
                    style={{
                      background: 'var(--btn-secondary-bg)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-sub)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '3px 8px',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--btn-secondary-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--btn-secondary-bg)';
                    }}
                  >
                    <span>조직도에서 확인</span>
                    <ExternalLink size={11} />
                  </button>
                </div>

                {/* 4th Row: Joined Date */}
                {membership.joinedAt && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.68rem',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid var(--border-light)',
                      paddingTop: '6px',
                      marginTop: '2px',
                    }}
                  >
                    <Clock size={10} />
                    <span>
                      소속 등록일:{' '}
                      {new Date(membership.joinedAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            background: 'var(--bg-subtle)',
            border: '1px dashed var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            textAlign: 'center',
            gap: '8px',
          }}
        >
          <Building2 size={28} color="var(--text-muted)" />
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)' }}>
            현재 소속된 조직 또는 그룹(부서/팀)이 없습니다.
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.4 }}>
            조직도 관리에서 새로운 그룹을 생성하여 본인을 추가하거나, 소속 그룹 관리자에게 멤버 등록을 요청하세요.
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<Building2 size={12} />}
            onClick={() => setActiveSubTab('organization')}
            style={{ marginTop: '4px' }}
          >
            조직도 및 권한 관리 바로가기
          </Button>
        </div>
      )}
    </div>
  );
};
