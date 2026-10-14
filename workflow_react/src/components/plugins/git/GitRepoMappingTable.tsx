import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { GitRepoMapping } from '@/api/gitPlugin';

interface GitRepoMappingTableProps {
  mappings: GitRepoMapping[];
  onOpenAddModal: () => void;
  onDeleteMapping: (id: number) => void;
}

export const GitRepoMappingTable: React.FC<GitRepoMappingTableProps> = ({
  mappings,
  onOpenAddModal,
  onDeleteMapping,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        padding: '20px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-bright)' }}>
            프로젝트 - Git 저장소 매핑
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
            각 프로젝트에 연결될 원격 저장소를 지정합니다.
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenAddModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            backgroundColor: 'var(--primary)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-on-primary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          <span>매핑 추가</span>
        </button>
      </div>

      {mappings.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-sub)', fontSize: '13px' }}>
          등록된 저장소 매핑이 없습니다. 상단의 '매핑 추가' 버튼을 눌러 프로젝트를 연결하세요.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-sub)', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px' }}>프로젝트</th>
              <th style={{ padding: '8px 10px' }}>원격 저장소 식별자</th>
              <th style={{ padding: '8px 10px' }}>기본 브랜치</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((m) => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--border-divider)' }}>
                <td style={{ padding: '10px', color: 'var(--text-bright)', fontWeight: 500 }}>
                  [{m.projectKey}] {m.projectName}
                </td>
                <td style={{ padding: '10px', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                  {m.repoIdentifier}
                </td>
                <td style={{ padding: '10px', fontFamily: 'monospace', color: 'var(--text-sub)' }}>
                  {m.defaultBranch}
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => onDeleteMapping(m.id)}
                    title="매핑 해제"
                    style={{
                      padding: '4px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-rose)',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
