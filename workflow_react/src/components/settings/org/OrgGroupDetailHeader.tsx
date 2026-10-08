﻿import React from 'react';
import { Building2, Edit3, UserPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/common';
import type { Group } from '@/types';

interface OrgGroupDetailHeaderProps {
  group: Group;
  isAuthenticated: boolean;
  onEditGroup: () => void;
  onOpenAddMember: () => void;
  onDeleteGroup: () => void;
}

export const OrgGroupDetailHeader: React.FC<OrgGroupDetailHeaderProps> = ({
  group,
  isAuthenticated,
  onEditGroup,
  onOpenAddMember,
  onDeleteGroup,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid var(--border-light)',
        paddingBottom: '12px',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={18} color="var(--primary)" />
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            {group.name}
          </h4>
          {group.code && (
            <span
              style={{
                fontSize: '0.72rem',
                background: 'var(--bg-dark)',
                color: 'var(--text-sub)',
                padding: '2px 6px',
                borderRadius: '3px',
                fontFamily: 'monospace',
                border: '1px solid var(--border-light)',
              }}
            >
              {group.code}
            </span>
          )}
        </div>
        {group.description && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {group.description}
          </p>
        )}
      </div>

      {isAuthenticated && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button variant="secondary" size="sm" icon={<Edit3 size={13} />} onClick={onEditGroup}>
            그룹 수정
          </Button>
          <Button variant="secondary" size="sm" icon={<UserPlus size={13} />} onClick={onOpenAddMember}>
            멤버 배정
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onDeleteGroup}
            style={{ color: 'var(--accent-rose)' }}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      )}
    </div>
  );
};
