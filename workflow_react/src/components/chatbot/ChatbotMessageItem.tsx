import React, { useState } from 'react';
import { Zap, Loader2, ChevronDown, ChevronUp, Bot, Search } from 'lucide-react';
import type { ChatbotMessage } from '@/types/chatbot';
import { ChatbotActionCard } from './ChatbotActionCard';
import { MarkdownViewer } from '@/components/common/MarkdownViewer';
import { useChatbotStore } from '@/stores/useChatbotStore';

interface ChatbotMessageItemProps {
  message: ChatbotMessage;
}

export const ChatbotMessageItem: React.FC<ChatbotMessageItemProps> = ({ message }) => {
  const executeAllActions = useChatbotStore((s) => s.executeAllActions);
  const [showSteps, setShowSteps] = useState(false);

  const isUser = message.role === 'user';
  const timeStr = new Date(message.timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const pendingActions = message.actions?.filter((a) => a.status === 'pending') || [];
  const isExecutingAny = message.actions?.some((a) => a.status === 'executing') || false;

  const handleExecuteAll = () => {
    if (pendingActions.length === 0 || isExecutingAny) return;
    executeAllActions(pendingActions.map((a) => a.id));
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '14px',
        maxWidth: '100%',
      }}
    >
      {/* 발화자 및 시간 */}
      <div
        style={{
          fontSize: '0.65rem',
          color: 'var(--text-sub, #888)',
          marginBottom: '3px',
          padding: '0 4px',
        }}
      >
        {isUser ? '나' : 'AntiGravity AI'} • {timeStr}
      </div>

      {/* 말풍선 본체 */}
      <div
        style={{
          maxWidth: '88%',
          padding: '8px 12px',
          borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          background: isUser
            ? 'var(--accent-color, #007acc)'
            : message.isError
            ? 'rgba(241, 76, 76, 0.15)'
            : 'var(--bg-tertiary, #252526)',
          color: isUser ? '#ffffff' : 'var(--text-main, #cccccc)',
          border: isUser
            ? 'none'
            : message.isError
            ? '1px solid rgba(241, 76, 76, 0.4)'
            : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          fontSize: '0.8rem',
          lineHeight: '1.45',
          wordBreak: 'break-word',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* 🤖 주도적 다단계 API 조합 및 실행 과정 (Agentic ReAct Steps) */}
        {!isUser && message.steps && message.steps.length > 0 && (
          <div
            style={{
              marginBottom: '8px',
              padding: '6px 8px',
              borderRadius: '6px',
              background: 'rgba(56, 139, 253, 0.08)',
              border: '1px solid rgba(56, 139, 253, 0.25)',
              fontSize: '0.7rem',
            }}
          >
            <div
              onClick={() => setShowSteps(!showSteps)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none',
                color: '#58a6ff',
                fontWeight: 600,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Bot size={13} color="#58a6ff" />
                <span>AI 자율 API 연쇄 분석 및 실행 ({message.steps.length}단계)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.65rem' }}>
                <span>{showSteps ? '접기' : '자세히'}</span>
                {showSteps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>
            </div>

            {showSteps && (
              <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {message.steps.map((step, idx) => {
                  const isRead = step.tool.startsWith('search') || step.tool.startsWith('get');
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '4px 6px',
                        borderRadius: '4px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        borderLeft: `3px solid ${isRead ? '#388bfd' : '#e3b341'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e6edf3' }}>
                        {isRead ? <Search size={11} color="#388bfd" /> : <Zap size={11} color="#e3b341" />}
                        <span style={{ fontWeight: 600 }}>{step.title}</span>
                      </div>
                      {step.resultSummary && (
                        <div style={{ color: '#8b949e', fontSize: '0.65rem', paddingLeft: '15px' }}>
                          ↳ {step.resultSummary}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {isUser ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
        ) : (
          <div className="chatbot-markdown-content" style={{ fontSize: '0.8rem' }}>
            <MarkdownViewer content={message.content} />
          </div>
        )}

        {/* ⚡ 다중 액션 감지 시 상단 일괄 실행 바 제공 */}
        {pendingActions.length > 1 && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12), rgba(0, 122, 204, 0.12))',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#facc15' }}>
              <Zap size={13} fill="#facc15" />
              <span>
                동시 제안된 <strong>{pendingActions.length}개 작업</strong>
              </span>
            </div>
            <button
              onClick={handleExecuteAll}
              disabled={isExecutingAny}
              style={{
                background: isExecutingAny ? '#555' : 'linear-gradient(135deg, #eab308, #ca8a04)',
                border: 'none',
                borderRadius: '5px',
                color: '#000',
                fontWeight: 700,
                fontSize: '0.72rem',
                padding: '4px 10px',
                cursor: isExecutingAny ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'opacity 0.2s',
              }}
            >
              {isExecutingAny ? (
                <>
                  <Loader2 size={11} className="spin" /> 일괄 실행 중...
                </>
              ) : (
                <>
                  <Zap size={11} fill="#000" /> 모두 실행
                </>
              )}
            </button>
          </div>
        )}

        {/* AI 추천 액션/기능 실행 카드 목록 */}
        {message.actions && message.actions.length > 0 && (
          <div style={{ marginTop: '6px' }}>
            {message.actions.map((action) => (
              <ChatbotActionCard key={action.id} action={action} />
            ))}
          </div>
        )}

        {/* 실시간 토큰 사용량 및 예상 비용 표시 */}
        {message.usage && (
          <div
            style={{
              marginTop: '6px',
              paddingTop: '4px',
              borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
              fontSize: '0.62rem',
              color: 'var(--text-sub, #888)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              userSelect: 'none',
            }}
            title={`입력: ${message.usage.promptTokens} 토큰 / 출력: ${message.usage.completionTokens} 토큰`}
          >
            <span>🪙 {message.usage.totalTokens.toLocaleString()} 토큰</span>
            <span>•</span>
            <span style={{ color: '#4ec9b0', fontWeight: 500 }}>
              약 {message.usage.estimatedCostKrw < 0.01 ? '< 0.01' : message.usage.estimatedCostKrw}원
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
