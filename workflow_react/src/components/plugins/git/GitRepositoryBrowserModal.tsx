import React, { useState, useMemo } from 'react';
import { GitFork, Search, RefreshCw, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { ModalWrapper } from '@/components/common/ModalWrapper';
import {
  useGitConfig,
  useRepoMappings,
  useRemoteRepositories,
  useCreateRepoMapping,
  useDeleteRepoMapping,
} from '@/api/gitPlugin';
import { GitConnectedRepoCard } from './GitConnectedRepoCard';
import { GitRemoteRepoCard } from './GitRemoteRepoCard';

interface GitRepositoryBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: number;
  projectKey?: string;
  projectName?: string;
}

export const GitRepositoryBrowserModal: React.FC<GitRepositoryBrowserModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectKey,
  projectName,
}) => {
  const [activeTab, setActiveTab] = useState<'connected' | 'remote'>('connected');
  const [searchTerm, setSearchTerm] = useState('');
  const [mappingRepoName, setMappingRepoName] = useState<string | null>(null);

  const { data: config } = useGitConfig();
  const { data: allMappings = [], refetch: refetchMappings, isLoading: isMappingsLoading } = useRepoMappings(projectId);
  const {
    data: remoteRepos = [],
    refetch: refetchRemote,
    isLoading: isRemoteLoading,
    isRefetching: isRemoteRefetching,
    error: remoteError,
  } = useRemoteRepositories(projectId, isOpen && Boolean(config?.isEnabled && config?.hasToken));

  const createMappingMutation = useCreateRepoMapping();
  const deleteMappingMutation = useDeleteRepoMapping();

  // 현재 프로젝트에 매핑된 목록 필터링
  const connectedMappings = useMemo(() => {
    if (!projectId) return allMappings;
    return allMappings.filter((m) => m.projectId === projectId);
  }, [allMappings, projectId]);

  // 검색어 필터링된 연결 저장소 목록
  const filteredConnected = useMemo(() => {
    if (!searchTerm.trim()) return connectedMappings;
    const term = searchTerm.toLowerCase();
    return connectedMappings.filter((m) => m.repoIdentifier.toLowerCase().includes(term));
  }, [connectedMappings, searchTerm]);

  // 검색어 필터링된 원격 저장소 목록
  const filteredRemote = useMemo(() => {
    if (!searchTerm.trim()) return remoteRepos;
    const term = searchTerm.toLowerCase();
    return remoteRepos.filter(
      (r) => r.fullName.toLowerCase().includes(term) || (r.description && r.description.toLowerCase().includes(term))
    );
  }, [remoteRepos, searchTerm]);

  const handleMapRepo = async (repoIdentifier: string, defaultBranch: string) => {
    if (!projectId) return;
    setMappingRepoName(repoIdentifier);
    try {
      await createMappingMutation.mutateAsync({
        projectId,
        repoIdentifier,
        defaultBranch,
      });
      await Promise.all([refetchMappings(), refetchRemote()]);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || '저장소 매핑에 실패했습니다.');
    } finally {
      setMappingRepoName(null);
    }
  };

  const handleDeleteMapping = async (id: number) => {
    if (confirm('이 저장소 매핑을 해제하시겠습니까?')) {
      await deleteMappingMutation.mutateAsync(id);
      await Promise.all([refetchMappings(), refetchRemote()]);
    }
  };

  const providerLabel = config?.provider === 'GITLAB' ? 'GitLab' : 'GitHub';

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Git 저장소 브라우저</span>
          {projectKey && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'rgba(0, 122, 204, 0.15)',
                color: 'var(--accent-cyan)',
              }}
            >
              [{projectKey}] {projectName}
            </span>
          )}
        </div>
      }
      icon={<GitFork size={18} style={{ color: 'var(--primary)' }} />}
      maxWidth="780px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '440px' }}>
        {/* 플러그인 비활성 또는 토큰 미등록 경고 */}
        {(!config?.isEnabled || !config?.hasToken) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid var(--accent-amber)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-amber)',
              fontSize: '12px',
            }}
          >
            <AlertCircle size={15} />
            <span>
              {!config?.isEnabled
                ? 'Git 플러그인이 비활성화 상태입니다. 환경설정에서 플러그인을 활성화해주세요.'
                : '등록된 Access Token이 없습니다. 환경설정에서 토큰을 등록해야 원격 저장소를 조회할 수 있습니다.'}
            </span>
          </div>
        )}

        {/* 상단 탭 & 검색바 컨트롤 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          {/* 서브 탭 */}
          <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('connected')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: activeTab === 'connected' ? 600 : 400,
                backgroundColor: activeTab === 'connected' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'connected' ? 'var(--text-bright)' : 'var(--text-sub)',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
              }}
            >
              <CheckCircle2 size={13} style={{ color: 'var(--secondary)' }} />
              <span>연결된 저장소 ({connectedMappings.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('remote')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: activeTab === 'remote' ? 600 : 400,
                backgroundColor: activeTab === 'remote' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'remote' ? 'var(--text-bright)' : 'var(--text-sub)',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
              }}
            >
              <GitFork size={13} style={{ color: 'var(--primary)' }} />
              <span>원격 {providerLabel} 전체 ({remoteRepos.length})</span>
            </button>
          </div>

          {/* 검색창 & 새로고침 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '320px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                flex: 1,
              }}
            >
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="저장소 검색..."
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-bright)',
                  fontSize: '12px',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                refetchMappings();
                refetchRemote();
              }}
              title="새로고침"
              disabled={isRemoteRefetching}
              style={{
                padding: '6px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-sub)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <RefreshCw size={13} className={isRemoteRefetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* 탭 1: 연결된 저장소 목록 */}
        {activeTab === 'connected' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
            {isMappingsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', gap: '8px', color: 'var(--text-sub)' }}>
                <Loader2 size={18} className="animate-spin" />
                <span>연결된 저장소 정보를 불러오는 중...</span>
              </div>
            ) : filteredConnected.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-light)',
                  color: 'var(--text-sub)',
                  gap: '10px',
                  textAlign: 'center',
                }}
              >
                <GitFork size={30} style={{ color: 'var(--text-muted)' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
                  {searchTerm ? '검색된 연결 저장소가 없습니다' : '현재 프로젝트에 연결된 Git 저장소가 없습니다'}
                </div>
                <div style={{ fontSize: '12px' }}>
                  상단 <b>[원격 {providerLabel} 전체]</b> 탭에서 원하는 저장소를 원클릭으로 연결할 수 있습니다.
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('remote')}
                  style={{
                    marginTop: '6px',
                    padding: '6px 14px',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--text-on-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  원격 저장소 목록 보기
                </button>
              </div>
            ) : (
              filteredConnected.map((m) => (
                <GitConnectedRepoCard
                  key={m.id}
                  mapping={m}
                  config={config}
                  onDeleteMapping={handleDeleteMapping}
                  showDelete={Boolean(projectId)}
                />
              ))
            )}
          </div>
        )}

        {/* 탭 2: 원격 GitHub/GitLab 전체 저장소 목록 */}
        {activeTab === 'remote' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
            {isRemoteLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', gap: '8px', color: 'var(--text-sub)' }}>
                <Loader2 size={18} className="animate-spin" />
                <span>원격 {providerLabel} 저장소 목록을 조회하는 중...</span>
              </div>
            ) : remoteError ? (
              <div style={{ padding: '16px', color: 'var(--accent-rose)', fontSize: '13px', textAlign: 'center' }}>
                원격 저장소를 불러올 수 없습니다. 설정에서 Access Token 권한을 확인해주세요.
              </div>
            ) : filteredRemote.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-sub)',
                  gap: '8px',
                }}
              >
                <GitFork size={30} style={{ color: 'var(--text-muted)' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>조회된 원격 저장소가 없습니다</div>
              </div>
            ) : (
              filteredRemote.map((repo) => (
                <GitRemoteRepoCard
                  key={repo.id}
                  repo={repo}
                  projectId={projectId}
                  onMapRepo={handleMapRepo}
                  isMapping={mappingRepoName === repo.fullName}
                />
              ))
            )}
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
