﻿import React, { useState, useEffect } from 'react';
import { GitPullRequest, Loader2, AlertCircle } from 'lucide-react';
import { ModalWrapper } from '@/components/common/ModalWrapper';
import { useCreatePullRequest } from '@/api/gitPlugin';

interface CreatePullRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueId: number;
  issueNumber: number;
  issueTitle: string;
  availableRepositories: Array<{
    id: number;
    repoIdentifier: string;
    defaultBranch: string;
  }>;
}

export const CreatePullRequestModal: React.FC<CreatePullRequestModalProps> = ({
  isOpen,
  onClose,
  issueId,
  issueNumber,
  issueTitle,
  availableRepositories,
}) => {
  const [selectedRepoId, setSelectedRepoId] = useState<number>(availableRepositories[0]?.id || 0);
  const [headBranch, setHeadBranch] = useState<string>('');
  const [baseBranch, setBaseBranch] = useState<string>('main');
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createPrMutation = useCreatePullRequest();

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      const defaultRepo = availableRepositories[0];
      if (defaultRepo) {
        setSelectedRepoId(defaultRepo.id);
        setBaseBranch(defaultRepo.defaultBranch || 'main');
      }
      setTitle(`[#${issueNumber}] ${issueTitle}`);
      setBody(`## 📋 연관 일감\n- Resolves #${issueNumber}\n\n## 🔍 작업 내용\n- `);
    }
  }, [isOpen, issueNumber, issueTitle, availableRepositories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepoId) {
      setErrorMsg('대상 저장소를 선택해주세요.');
      return;
    }
    if (!headBranch.trim()) {
      setErrorMsg('작업 브랜치(Head Branch)를 입력해주세요.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('PR 제목을 입력해주세요.');
      return;
    }

    try {
      setErrorMsg(null);
      await createPrMutation.mutateAsync({
        repoMappingId: selectedRepoId,
        issueId,
        title: title.trim(),
        body: body.trim(),
        head: headBranch.trim(),
        base: baseBranch.trim() || 'main',
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Pull Request 생성에 실패했습니다.');
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="원격 Pull Request (MR) 생성"
      icon={<GitPullRequest size={18} style={{ color: 'var(--primary)' }} />}
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 0 0' }}>
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
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>대상 원격 저장소</label>
          <select
            value={selectedRepoId}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedRepoId(id);
              const found = availableRepositories.find((r) => r.id === id);
              if (found) setBaseBranch(found.defaultBranch || 'main');
            }}
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
            {availableRepositories.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.repoIdentifier} (기본: {repo.defaultBranch})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>Head 브랜치 (내 작업)</label>
            <input
              type="text"
              value={headBranch}
              onChange={(e) => setHeadBranch(e.target.value)}
              placeholder="feature/issue-123-branch"
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>Base 브랜치 (병합 대상)</label>
            <input
              type="text"
              value={baseBranch}
              onChange={(e) => setBaseBranch(e.target.value)}
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
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>PR 제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="[#123] 기능 구현 제목"
            style={{
              padding: '8px 10px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-bright)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>PR 본문 설명</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            style={{
              padding: '8px 10px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-bright)',
              fontSize: '13px',
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={createPrMutation.isPending}
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
            disabled={createPrMutation.isPending}
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
              cursor: createPrMutation.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {createPrMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            <span>Pull Request 생성</span>
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};
