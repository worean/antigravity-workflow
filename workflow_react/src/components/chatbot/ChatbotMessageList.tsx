import React, { useEffect, useRef } from 'react';
import { useChatbotStore } from '@/stores/useChatbotStore';
import { ChatbotMessageItem } from './ChatbotMessageItem';
import { SUGGESTED_PROMPTS } from '@/api/chatbot';
import { Bot, Loader2 } from 'lucide-react';

export const ChatbotMessageList: React.FC = () => {
  const messages = useChatbotStore((s) => s.messages);
  const isThinking = useChatbotStore((s) => s.isThinking);
  const sendMessage = useChatbotStore((s) => s.sendMessage);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 메시지 업데이트 또는 생각 중 상태 변경 시 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      {/* 메시지 아이템 목록 */}
      {messages.map((msg) => (
        <ChatbotMessageItem key={msg.id} message={msg} />
      ))}

      {/* 추천 프롬프트 칩 (첫 환영 메시지만 있을 때 노출) */}
      {messages.length <= 1 && (
        <div style={{ marginTop: '10px', marginBottom: '14px' }}>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-sub, #888)',
              marginBottom: '8px',
              fontWeight: 600,
            }}
          >
            💡 추천 기능 및 질문
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p.id}
                onClick={() => sendMessage(p.prompt)}
                style={{
                  textAlign: 'left',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-main, #ccc)',
                  fontSize: '0.73rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 122, 204, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(0, 122, 204, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI 생각 중(추론 중) 인디케이터 */}
      {isThinking && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(0, 122, 204, 0.08)',
            border: '1px solid rgba(0, 122, 204, 0.2)',
            color: '#388bfd',
            fontSize: '0.75rem',
            alignSelf: 'flex-start',
            marginBottom: '10px',
          }}
        >
          <Loader2 size={14} className="spin" />
          <Bot size={14} />
          <span>AI가 워크플로우 분석 및 답변을 생성하고 있습니다...</span>
        </div>
      )}

      <div ref={bottomRef} style={{ height: '1px' }} />
    </div>
  );
};
