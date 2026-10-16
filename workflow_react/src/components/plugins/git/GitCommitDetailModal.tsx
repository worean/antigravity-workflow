import React, { useState, useEffect } from 'react';
import { GitCommit, AlertCircle, Loader2, FileText } from 'lucide-react';
import { ModalWrapper } from '@/components/common/ModalWrapper';
import { useCommitDetail } from '@/api/gitPlugin';
import { GitCommitFileTree } from './GitCommitFileTree';
import { GitCommitDiffCard } from './GitCommitDiffCard';
import { GitCommitSummaryHeader } from './GitCommitSummaryHeader';
import { GitCommitDiffToolbar } from './GitCommitDiffToolbar';

interface GitCommitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoMappingId?: number;
  commitHash?: string;
  repoIdentifier?: string;
}

export const GitCommitDetailModal: React.FC<GitCommitDetailModalProps> = ({
  isOpen,
  onClose,
  repoMappingId,
  commitHash,
  repoIdentifier,
}) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  const { data: commit, isLoading, error } = useCommitDetail(
    repoMappingId,
    commitHash,
    isOpen && Boolean(repoMappingId && commitHash)
  );

  const activeFiles = commit?.files || [];

  // 파일 목록이 로드되면 첫 번째 파일을 자동으로 기본 선택 (선택된 파일이 없거나 유효하지 않은 경우)
  useEffect(() => {
    if (activeFiles.length > 0) {
      if (!selectedFile || !activeFiles.some((f) => f.filename === selectedFile)) {
        setSelectedFile(activeFiles[0].filename);
      }
    } else {
      setSelectedFile(null);
    }
  }, [activeFiles, selectedFile]);

  const handleSelectFile = (filename: string) => {
    setSelectedFile(filename);
    if (viewMode === 'all') {
      const id = `file-diff-${encodeURIComponent(filename).replace(/[%._]/g, '-')}`;
      const targetElement = document.getElementById(id);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const currentFile = activeFiles.find((f) => f.filename === selectedFile) || activeFiles[0];
  const currentIndex = activeFiles.findIndex((f) => f.filename === (currentFile?.filename || ''));

  const handlePrevFile = () => {
    if (currentIndex > 0) {
      setSelectedFile(activeFiles[currentIndex - 1].filename);
    }
  };

  const handleNextFile = () => {
    if (currentIndex < activeFiles.length - 1) {
      setSelectedFile(activeFiles[currentIndex + 1].filename);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitCommit size={18} style={{ color: 'var(--primary)' }} />
          <span>커밋 상세 수정사항 (Commit Diff)</span>
          {repoIdentifier && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--accent-cyan)',
                fontFamily: 'monospace',
              }}
            >
              {repoIdentifier}
            </span>
          )}
        </div>
      }
      maxWidth="min(1380px, 96vw)"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(86vh - 40px)',
          minHeight: '520px',
          maxHeight: '840px',
          gap: '12px',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-sub)',
            }}
          >
            <Loader2 size={24} className="animate-spin" />
            <span>커밋 수정 내역 및 Diff 데이터를 불러오는 중...</span>
          </div>
        ) : error || !commit ? (
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: 'var(--accent-rose)',
            }}
          >
            <AlertCircle size={36} />
            <div style={{ fontWeight: 600 }}>커밋 정보를 불러올 수 없습니다.</div>
            <div style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
              저장소 권한 또는 커밋 해시({commitHash?.slice(0, 7)})를 확인해주세요.
            </div>
          </div>
        ) : (
          <>
            {/* 1. GitHub 스타일 커밋 요약 헤더 카드 (고정) */}
            <GitCommitSummaryHeader commit={commit} activeFiles={activeFiles} />

            {/* 2. 본문 영역: 좌측 계층 파일 트리 + 우측 세로 스크롤 Diff 뷰어 */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                flex: 1,
                overflow: 'hidden',
                minHeight: 0,
              }}
            >
              {/* 좌측: 계층 디렉토리 파일 트리 */}
              <div style={{ width: '310px', flexShrink: 0, height: '100%' }}>
                <GitCommitFileTree
                  files={activeFiles}
                  selectedFile={selectedFile}
                  onSelectFile={handleSelectFile}
                />
              </div>

              {/* 우측: 파일별 Unified Diff 뷰어 (단일 집중 보기 & 전체 연속 보기 듀얼 모드) */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  overflow: 'hidden',
                  minHeight: 0,
                  height: '100%',
                }}
              >
                {/* 우측 상단 서브 툴바: 파일 네비게이션 & 뷰 모드 전환 */}
                <GitCommitDiffToolbar
                  activeFiles={activeFiles}
                  currentFile={currentFile}
                  currentIndex={currentIndex}
                  viewMode={viewMode}
                  onPrevFile={handlePrevFile}
                  onNextFile={handleNextFile}
                  onViewModeChange={setViewMode}
                />

                {/* Diff 본문 스크롤 영역 (단일 모드: fillContainer로 내부 세로스크롤, 전체 모드: 컨테이너 세로스크롤) */}
                <div
                  className="custom-scrollbar"
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: viewMode === 'single' ? '0px' : '14px',
                    overflowY: viewMode === 'single' ? 'hidden' : 'auto',
                    overflowX: 'hidden',
                    paddingRight: viewMode === 'single' ? '0px' : '6px',
                    minHeight: 0,
                    height: '100%',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--scrollbar-thumb) transparent',
                  }}
                >
                  {activeFiles.length === 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        padding: '48px 16px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-sub)',
                        gap: '8px',
                      }}
                    >
                      <FileText size={28} style={{ color: 'var(--text-muted)' }} />
                      <div style={{ fontWeight: 600 }}>변경된 파일 내역이 없습니다.</div>
                    </div>
                  ) : viewMode === 'single' ? (
                    currentFile ? (
                      <GitCommitDiffCard
                        key={currentFile.filename}
                        file={currentFile}
                        fillContainer={true}
                      />
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flex: 1,
                          padding: '48px 16px',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-sub)',
                          gap: '8px',
                        }}
                      >
                        <FileText size={28} style={{ color: 'var(--text-muted)' }} />
                        <div style={{ fontWeight: 600 }}>좌측 트리에서 확인할 파일을 선택해주세요.</div>
                      </div>
                    )
                  ) : (
                    activeFiles.map((file) => (
                      <GitCommitDiffCard
                        key={file.filename}
                        file={file}
                        fillContainer={false}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ModalWrapper>
  );
};
