﻿import React, { useState, useEffect } from 'react';
import { GitBranch, Loader2, AlertCircle } from 'lucide-react';
import { ModalWrapper } from '@/components/common/ModalWrapper';
import { useCreateBranch } from '@/api/gitPlugin';

interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueNumber: number;
  issueTitle: string;
  availableRepositories: Array<{
    id: number;
    repoIdentifier: string;
    defaultBranch: string;
  }>;
}

export const CreateBranchModal: React.FC<CreateBranchModalProps> = ({
  isOpen,
  onClose,
  issueNumber,
  issueTitle,
  availableRepositories,
}) => {
  const [selectedRepoId, setSelectedRepoId] = useState<number>(availableRepositories[0]?.id || 0);
  const [branchType, setBranchType] = useState<string>('feature');
  const [branchName, setBranchName] = useState<string>('');
  const [refBranch, setRefBranch] = useState<string>('main');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createBranchMutation = useCreateBranch();

  // 제목을 영문 slug 형태로 변환 (특수문자 제거, 공백 -> 하이픈)
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 30);
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      const defaultRepo = availableRepositories[0];
      if (defaultRepo) {
        setSelectedRepoId(defaultRepo.id);
        setRefBranch(defaultRepo.defaultBranch || 'main');
      }
      const slug = generateSlug(issueTitle) || 'task';
      setBranchName(`${branchType}/issue-${issueNumber}-${slug}`);
    }
  }, [isOpen, issueNumber, issueTitle, availableRepositories]);

  const handleTypeChange = (type: string) => {
    setBranchType(type);
    const slug = generateSlug(issueTitle) || 'task';
    setBranchName(`${type}/issue-${issueNumber}-${slug}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepoId) {
      setErrorMsg('대상 저장소를 선택해주세요.');
      return;
    }
    if (!branchName.trim()) {
      setErrorMsg('브랜치명을 입력해주세요.');
      return;
    }

    try {
      setErrorMsg(null);
      await createBranchMutation.mutateAsync({
        repoMappingId: selectedRepoId,
        branchName: branchName.trim(),
        refBranch: refBranch.trim() || 'main',
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || '브랜치 생성에 실패했습니다.');
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="원격 Git 브랜치 생성"
      icon={<GitBranch size={18} style={{ color: 'var(--primary)' }} />}
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
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>대상 원격 저장소</label>
          <select
            value={selectedRepoId}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedRepoId(id);
              const found = availableRepositories.find((r) => r.id === id);
              if (found) setRefBranch(found.defaultBranch || 'main');
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>브랜치 접두어 (Type)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['feature', 'bugfix', 'hotfix', 'refactor'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  fontSize: '12px',
                  fontWeight: branchType === t ? 600 : 400,
                  backgroundColor: branchType === t ? 'var(--primary)' : 'var(--bg-input)',
                  color: branchType === t ? 'var(--text-on-primary)' : 'var(--text-main)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>생성할 브랜치명</label>
          <input
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="feature/issue-123-new-branch"
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
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>기준 브랜치 (Base Ref)</label>
          <input
            type="text"
            value={refBranch}
            onChange={(e) => setRefBranch(e.target.value)}
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
            disabled={createBranchMutation.isPending}
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
            disabled={createBranchMutation.isPending}
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
              cursor: createBranchMutation.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {createBranchMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            <span>원격 브랜치 생성</span>
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};
