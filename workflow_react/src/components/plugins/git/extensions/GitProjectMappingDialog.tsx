import React, { useState } from 'react';
import { GitFork, Plus, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ModalWrapper } from '@/components/common/ModalWrapper';
import { useRepoMappings, useCreateRepoMapping, useDeleteRepoMapping } from '@/api/gitPlugin';

interface GitProjectMappingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectKey: string;
  projectName: string;
}

export const GitProjectMappingDialog: React.FC<GitProjectMappingDialogProps> = ({
  isOpen,
  onClose,
  projectId,
  projectKey,
  projectName,
}) => {
  const { data: mappings = [], isLoading, refetch } = useRepoMappings(projectId);
  const createMappingMutation = useCreateRepoMapping();
  const deleteMappingMutation = useDeleteRepoMapping();

  const [repoIdentifier, setRepoIdentifier] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoIdentifier.trim()) {
      setErrorMsg('원격 저장소 식별자(owner/repo)를 입력해주세요.');
      return;
    }

    try {
      setErrorMsg(null);
      await createMappingMutation.mutateAsync({
        projectId,
        repoIdentifier: repoIdentifier.trim(),
        defaultBranch: defaultBranch.trim() || 'main',
      });
      setRepoIdentifier('');
      setSuccessMsg('저장소가 성공적으로 연결되었습니다.');
      refetch();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || '저장소 연결에 실패했습니다.');
    }
  };

  const handleDeleteMapping = async (mappingId: number) => {
    if (!confirm('이 저장소 매핑을 해제하시겠습니까?')) return;
    try {
      await deleteMappingMutation.mutateAsync(mappingId);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || '매핑 해제 실패');
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={`[${projectKey}] Git 저장소 연동 관리`}
      icon={<GitFork size={18} style={{ color: 'var(--primary)' }} />}
      maxWidth="540px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0 0' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
          <strong>{projectName}</strong> 프로젝트에 매핑된 GitHub / GitLab 원격 저장소를 관리합니다.
        </div>

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--accent-rose)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-rose)',
              fontSize: '13px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              backgroundColor: 'rgba(78, 201, 176, 0.1)',
              border: '1px solid var(--secondary)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--secondary)',
              fontSize: '13px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. 현재 매핑 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)' }}>
            현재 연결된 저장소 ({mappings.length})
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', color: 'var(--text-sub)', fontSize: '13px' }}>
              <Loader2 size={16} className="animate-spin" />
              <span>저장소 목록 로딩 중...</span>
            </div>
          ) : mappings.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px dashed var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                fontSize: '12px',
              }}
            >
              연결된 Git 저장소가 없습니다. 아래에서 새 저장소를 추가해보세요.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {mappings.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GitFork size={14} style={{ color: 'var(--accent-cyan)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-bright)' }}>
                      {m.repoIdentifier}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                      (기본: {m.defaultBranch})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteMapping(m.id)}
                    title="저장소 연결 해제"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-rose)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. 새 저장소 연결 폼 */}
        <form
          onSubmit={handleAddMapping}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '14px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            marginTop: '8px',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)' }}>
            새 원격 저장소 추가
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
            <input
              type="text"
              value={repoIdentifier}
              onChange={(e) => setRepoIdentifier(e.target.value)}
              placeholder="owner/repository (예: myorg/web)"
              style={{
                padding: '6px 10px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-bright)',
                fontSize: '12px',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />

            <input
              type="text"
              value={defaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
              placeholder="main"
              style={{
                padding: '6px 10px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-bright)',
                fontSize: '12px',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={createMappingMutation.isPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 14px',
              backgroundColor: 'var(--primary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-on-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: createMappingMutation.isPending ? 'not-allowed' : 'pointer',
              alignSelf: 'flex-end',
            }}
          >
            {createMappingMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            <span>저장소 연결 추가</span>
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};
