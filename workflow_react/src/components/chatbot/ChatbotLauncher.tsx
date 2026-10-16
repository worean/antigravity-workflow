import React from 'react';
import { Bot, X, Sparkles } from 'lucide-react';
import { Portal } from '@/components/common/Portal';
import { useChatbotStore } from '@/stores/useChatbotStore';

export const ChatbotLauncher: React.FC = () => {
  const isOpen = useChatbotStore((s) => s.isOpen);
  const isThinking = useChatbotStore((s) => s.isThinking);
  const toggleChatbot = useChatbotStore((s) => s.toggleChatbot);

  return (
    <Portal containerId="ag-portal-root">
      <button
        onClick={toggleChatbot}
        title={isOpen ? 'AI 어시스턴트 닫기 (Esc)' : 'AI 어시스턴트 열기 (Alt + J)'}
        aria-label="AI 어시스턴트 토글"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '52px',
          height: '52px',
          borderRadius: '26px',
          background: isOpen
            ? 'var(--bg-card)'
            : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
          color: 'var(--text-on-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100, // --z-popup
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isOpen ? (
          <X size={22} />
        ) : (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={24} />
            <Sparkles
              size={12}
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                color: 'var(--accent-amber)',
              }}
            />
          </div>
        )}

        {/* 생각 중/추론 중일 때 외곽 펄스 링 */}
        {isThinking && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              left: '-3px',
              right: '-3px',
              bottom: '-3px',
              borderRadius: '28px',
              border: '2px solid var(--secondary)',
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
              pointerEvents: 'none',
            }}
          />
        )}
      </button>
    </Portal>
  );
};
