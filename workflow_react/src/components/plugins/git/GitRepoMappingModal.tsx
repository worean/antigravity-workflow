﻿import React, { useState } from 'react';
import { GitFork, Loader2, AlertCircle } from 'lucide-react';
import { ModalWrapper } from '@/components/common/ModalWrapper';
import { useCreateRepoMapping } from '@/api/gitPlugin';

interface GitRepoMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Array<{ id: number; name: string; key: string }>;
  onSuccess?: () => void;
}

export const GitRepoMappingModal: React.FC<GitRepoMappingModalProps> = ({
  isOpen,
  onClose,
  projects,
  onSuccess,
}) => {
  const [projectId, setProjectId] = useState<number>(projects[0]?.id || 0);
  const [repoIdentifier, setRepoIdentifier] = useState<string>('');
  const [defaultBranch, setDefaultBranch] = useState<string>('main');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createMappingMutation = useCreateRepoMapping();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setErrorMsg('대상 프로젝트를 선택해주세요.');
      return;
    }
    if (!repoIdentifier.trim()) {
      setErrorMsg('저장소 식별자를 입력해주세요 (예: owner/repository).');
      return;
    }

    try {
      setErrorMsg(null);
      await createMappingMutation.mutateAsync({
        projectId,
        repoIdentifier: repoIdentifier.trim(),
        defaultBranch: defaultBranch.trim() || 'main',
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || '저장소 매핑 추가에 실패했습니다.');
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="프로젝트 - Git 저장소 매핑 추가"
      icon={<GitFork size={18} style={{ color: 'var(--primary)' }} />}
      maxWidth="500px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0 0' }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>대상 AntiGravity 프로젝트</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(Number(e.target.value))}
            style={{
              padding: '8px 10px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-bright)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.key}] {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>
            원격 저장소 식별자 (Owner/Repo 또는 Group/Project)
          </label>
          <input
            type="text"
            value={repoIdentifier}
            onChange={(e) => setRepoIdentifier(e.target.value)}
            placeholder="myorg/backend-service"
            style={{
              padding: '8px 10px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-bright)',
              fontSize: '13px',
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            GitHub 리포지토리(예: <code>facebook/react</code>) 또는 GitLab 프로젝트 경로
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>기본 브랜치 (Default Branch)</label>
          <input
            type="text"
            value={defaultBranch}
            onChange={(e) => setDefaultBranch(e.target.value)}
            placeholder="main"
            style={{
              padding: '8px 10px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-bright)',
              fontSize: '13px',
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={createMappingMutation.isPending}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={createMappingMutation.isPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              backgroundColor: 'var(--primary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-on-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: createMappingMutation.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {createMappingMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            <span>매핑 등록</span>
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};
