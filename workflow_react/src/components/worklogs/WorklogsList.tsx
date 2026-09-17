import React from 'react';
import type { Worklog, User } from '@/types';
import { Card, Spinner } from '@/components/common';
import { WorklogListItem } from './WorklogListItem';

interface WorklogsListProps {
  worklogs: Worklog[];
  loading: boolean;
  isAuthenticated: boolean;
  currentUser: User | null;
}

export const WorklogsList: React.FC<WorklogsListProps> = ({
  worklogs,
  loading,
  isAuthenticated,
  currentUser,
}) => {
  if (loading) {
    return <Spinner centered label="작업 로그 불러오는 중..." />;
  }

  if (worklogs.length === 0) {
    return (
      <Card variant="glass" padding="24px" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        {!isAuthenticated ? '로그인 후 팀원들의 작업 시간 기록을 조회하거나 등록할 수 있습니다.' : '등록된 작업 로그가 없습니다.'}
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {worklogs.map((w) => (
        <WorklogListItem key={w.id} worklog={w} currentUser={currentUser} />
      ))}
    </div>
  );
};