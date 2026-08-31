// -*- coding: utf-8 -*-
import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import type { Sprint } from '@/types';
import { Button, StatusBadge, PriorityBadge } from '@/components/common';

interface SprintIssuesTabProps {
  sprint: Sprint;
  onOpenIssueDetail?: (issueId: number) => void;
  onOpenManageIssuesModal?: (sprint: Sprint) => void;
}

export const SprintIssuesTab: React.FC<SprintIssuesTabProps> = ({
  sprint,
  onOpenIssueDetail,
  onOpenManageIssuesModal,
}) => {
  const sprintIssues = sprint.issues || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
          스프린트 할당 이슈 ({sprintIssues.length}개)
        </span>
        {onOpenManageIssuesModal && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenManageIssuesModal(sprint)}
          >
            이슈 할당/해제 관리
          </Button>
        )}
      </div>

      {sprintIssues.length === 0 ? (
        <div
          style={{
            padding: '50px 20px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-xs)',
            border: '1px dashed var(--border-light)',
            color: 'var(--text-muted)',
          }}
        >
          <AlertCircle size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>
            할당된 이슈가 없습니다.
          </div>
          {onOpenManageIssuesModal && (
            <Button
              size="sm"
              variant="primary"
              style={{ marginTop: '10px' }}
              onClick={() => onOpenManageIssuesModal(sprint)}
            >
              백로그에서 이슈 가져오기
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sprintIssues.map((iss) => (
            <div
              key={iss.id}
              onClick={() => onOpenIssueDetail && onOpenIssueDetail(iss.id)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: onOpenIssueDetail ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                  #{iss.issueNumber || iss.id}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-bright)' }}>
                  {iss.title}
                </span>
                {onOpenIssueDetail && <ExternalLink size={11} color="var(--text-muted)" />}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {iss.assignee && (
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {iss.assignee.name}
                  </span>
                )}
                {iss.priority && <PriorityBadge priority={iss.priority as any} size="sm" />}
                {iss.status && <StatusBadge status={iss.status as any} size="sm" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};