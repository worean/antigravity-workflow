import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/useUIStore';
import { useProjects } from '@/api/projects';
import { issueKeys } from '@/api/issues';
import { AuthModal } from '@/components/AuthModal';
import { IssueModal } from '@/components/IssueModal';
import { ChatbotPopup, ChatbotLauncher } from '@/components/chatbot';

/**
 * GlobalModalManager - 전역 UI 모달 관리자
 * 
 * Zustand(useUIStore) 상태를 구독하여 헤더, 사이드바, 단축키, API 인터셉터 등
 * 앱 어디서든 단 한 줄의 스토어 액션으로 호출되는 전역 모달을 집중 렌더링합니다.
 * 내부 모달들은 Portal을 통해 DOM 최상위(#ag-portal-root)에 마운트됩니다.
 */
export const GlobalModalManager: React.FC = () => {
  const queryClient = useQueryClient();

  // 1. 인증/로그인 모달 상태
  const isAuthModalOpen = useUIStore((s) => s.isAuthModalOpen);
  const closeAuthModal = useUIStore((s) => s.closeAuthModal);

  // 2. 빠른 이슈 생성 모달 상태
  const isIssueModalOpen = useUIStore((s) => s.isIssueModalOpen);
  const initialProjectId = useUIStore((s) => s.issueModalInitialProjectId);
  const closeIssueModal = useUIStore((s) => s.closeIssueModal);

  // 프로젝트 목록 캐시 조회 (이슈 생성 모달 셀렉트박스용)
  const { data: projects = [] } = useProjects();

  const handleIssueCreated = () => {
    queryClient.invalidateQueries({ queryKey: issueKeys.all });
    queryClient.invalidateQueries({ queryKey: ['sprints'] });
  };

  return (
    <>
      {/* 🔐 전역 인증 모달 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />

      {/* 📝 전역 빠른 일감 등록 모달 */}
      <IssueModal
        isOpen={isIssueModalOpen}
        onClose={closeIssueModal}
        projects={projects}
        initialProjectId={initialProjectId || undefined}
        onIssueCreated={handleIssueCreated}
      />

      {/* 🤖 AI Chatbot 플로팅 어시스턴트 & 런처 버튼 */}
      <ChatbotPopup />
      <ChatbotLauncher />
    </>
  );
};
