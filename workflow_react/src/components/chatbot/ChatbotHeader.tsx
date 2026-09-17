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
        borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
        background: 'var(--bg-secondary, #1e1e1e)',
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
            background: 'linear-gradient(135deg, #007acc 0%, #0098ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
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
                background: '#4ec9b0',
                boxShadow: '0 0 8px #4ec9b0',
              }}
            />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #fff)' }}>
              AI Assistant
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '1px 5px',
                borderRadius: '4px',
                background: 'rgba(0, 122, 204, 0.2)',
                color: '#388bfd',
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
              color: 'var(--text-sub, #888)',
              cursor: 'pointer',
              outline: 'none',
              padding: '0',
            }}
            title="AI 추론 모델 선택"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id} style={{ background: '#252526', color: '#ccc' }}>
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
            background: autoExecute ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: autoExecute ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            color: autoExecute ? '#facc15' : 'var(--text-sub, #888)',
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
          <Zap size={12} fill={autoExecute ? '#facc15' : 'none'} />
          <span>{autoExecute ? 'Auto ON' : 'Auto OFF'}</span>
        </button>

        <button
          onClick={clearMessages}
          title="대화 초기화"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-sub, #888)',
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
            color: 'var(--text-sub, #888)',
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
            color: 'var(--text-sub, #888)',
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
