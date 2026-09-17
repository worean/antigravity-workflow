import React, { useEffect } from 'react';
import { Portal } from '@/components/common/Portal';
import { useChatbotStore } from '@/stores/useChatbotStore';
import { ChatbotHeader } from './ChatbotHeader';
import { ChatbotMessageList } from './ChatbotMessageList';
import { ChatbotInputArea } from './ChatbotInputArea';

export const ChatbotPopup: React.FC = () => {
  const isOpen = useChatbotStore((s) => s.isOpen);
  const isMinimized = useChatbotStore((s) => s.isMinimized);
  const closeChatbot = useChatbotStore((s) => s.closeChatbot);
  const toggleChatbot = useChatbotStore((s) => s.toggleChatbot);

  // 글로벌 단축키: Alt + J 로 챗봇 토글, Escape 로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + J
      if (e.altKey && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        toggleChatbot();
      }

      // Escape 로 닫기
      if (e.key === 'Escape' && isOpen) {
        closeChatbot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleChatbot, closeChatbot]);

  if (!isOpen) return null;

  return (
    <Portal containerId="ag-portal-root">
      <div
        role="dialog"
        aria-label="AI 어시스턴트 대화창"
        style={{
          position: 'fixed',
          bottom: '84px',
          right: '24px',
          width: isMinimized ? '320px' : '380px',
          height: isMinimized ? 'auto' : '580px',
          maxHeight: 'calc(100vh - 120px)',
          maxWidth: 'calc(100vw - 48px)',
          background: 'var(--bg-primary, #181818)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1100, // --z-popup
          overflow: 'hidden',
          transition: 'height 0.25s cubic-bezier(0.16, 1, 0.3, 1), width 0.25s ease',
        }}
      >
        <ChatbotHeader />

        {!isMinimized && (
          <>
            <ChatbotMessageList />
            <ChatbotInputArea />
          </>
        )}
      </div>
    </Portal>
  );
};
