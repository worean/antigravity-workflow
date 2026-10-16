import React from 'react';
import { Bot, Minimize2, Maximize2, X, RotateCcw, Sparkles, Zap } from 'lucide-react';
import { useChatbotStore } from '@/stores/useChatbotStore';
import { AVAILABLE_MODELS } from '@/api/chatbot';
import type { ChatbotModel } from '@/types/chatbot';

export const ChatbotHeader: React.FC = () => {
  const selectedModel = useChatbotStore((s) => s.selectedModel);
  const autoExecute = useChatbotStore((s) => s.autoExecute);
  const isMinimized = useChatbotStore((s) => s.isMinimized);
  const isThinking = useChatbotStore((s) => s.isThinking);
  const setModel = useChatbotStore((s) => s.setModel);
  const toggleAutoExecute = useChatbotStore((s) => s.toggleAutoExecute);
  const toggleMinimize = useChatbotStore((s) => s.toggleMinimize);
  const closeChatbot = useChatbotStore((s) => s.closeChatbot);
  const clearMessages = useChatbotStore((s) => s.clearMessages);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-header)',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        userSelect: 'none',
      }}
    >
      {/* 좌측 타이틀 & 모델 선택 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-on-primary)',
            position: 'relative',
          }}
        >
          <Bot size={16} />
          {isThinking && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--secondary)',
                boxShadow: '0 0 8px var(--secondary)',
              }}
            />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              AI Assistant
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '1px 5px',
                borderRadius: '4px',
                background: 'var(--badge-progress-bg)',
                color: 'var(--badge-progress-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Sparkles size={10} /> Smart
            </span>
          </div>

          {/* 모델 선택 셀렉트 */}
          <select
            value={selectedModel}
            onChange={(e) => setModel(e.target.value as ChatbotModel)}
            style={{
              fontSize: '0.72rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-sub)',
              cursor: 'pointer',
              outline: 'none',
              padding: '0',
            }}
            title="AI 추론 모델 선택"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                {m.name} ({m.provider})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 우측 도구 버튼들 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Auto Mode 토글 버튼 */}
        <button
          onClick={toggleAutoExecute}
          title={
            autoExecute
              ? '⚡ Auto Mode 활성화됨: AI 제안 기능 자동 실행 (클릭 시 수동 승인 모드로 전환)'
              : '⚡ Auto Mode 비활성화됨: 수동 승인 모드 (클릭 시 자동 실행 켜기)'
          }
          style={{
            background: autoExecute ? 'var(--badge-review-bg)' : 'var(--bg-subtle)',
            border: autoExecute ? '1px solid var(--badge-review-border)' : '1px solid var(--border-light)',
            color: autoExecute ? 'var(--accent-amber)' : 'var(--text-sub)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.68rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s ease',
          }}
        >
          <Zap size={12} fill={autoExecute ? 'var(--accent-amber)' : 'none'} />
          <span>{autoExecute ? 'Auto ON' : 'Auto OFF'}</span>
        </button>

        <button
          onClick={clearMessages}
          title="대화 초기화"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-sub)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RotateCcw size={14} />
        </button>

        <button
          onClick={toggleMinimize}
          title={isMinimized ? '확장' : '최소화'}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-sub)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
        </button>

        <button
          onClick={closeChatbot}
          title="닫기 (Esc)"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-sub)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
