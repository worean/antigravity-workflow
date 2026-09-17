import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useChatbotStore } from '@/stores/useChatbotStore';

export const ChatbotInputArea: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isThinking = useChatbotStore((s) => s.isThinking);
  const autoExecute = useChatbotStore((s) => s.autoExecute);
  const toggleAutoExecute = useChatbotStore((s) => s.toggleAutoExecute);
  const isOpen = useChatbotStore((s) => s.isOpen);
  const isMinimized = useChatbotStore((s) => s.isMinimized);
  const sendMessage = useChatbotStore((s) => s.sendMessage);

  // 팝업 열릴 때 포커스
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!inputText.trim() || isThinking) return;
    const textToSend = inputText;
    setInputText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // 자동 높이 조절 (최대 120px)
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div
      style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
        background: 'var(--bg-secondary, #1e1e1e)',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          background: 'var(--bg-input, #2d2d2d)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
          borderRadius: '8px',
          padding: '6px 10px',
        }}
      >
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="무엇이든 물어보거나 지시하세요... (Enter 전송)"
          rows={1}
          disabled={isThinking}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main, #ffffff)',
            fontSize: '0.8rem',
            lineHeight: '1.4',
            resize: 'none',
            outline: 'none',
            padding: 0,
            maxHeight: '120px',
            fontFamily: 'inherit',
          }}
        />

        <button
          onClick={handleSend}
          disabled={!inputText.trim() || isThinking}
          title="전송 (Enter)"
          style={{
            background: inputText.trim() && !isThinking ? 'var(--accent-color, #007acc)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: inputText.trim() && !isThinking ? '#ffffff' : 'var(--text-sub, #666)',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() && !isThinking ? 'pointer' : 'default',
            transition: 'background 0.15s, color 0.15s',
            flexShrink: 0,
          }}
        >
          {isThinking ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '6px',
          padding: '0 2px',
          fontSize: '0.64rem',
          color: 'var(--text-sub, #666)',
        }}
      >
        <span>Shift + Enter 로 줄바꿈</span>
        <span
          onClick={toggleAutoExecute}
          style={{
            cursor: 'pointer',
            color: autoExecute ? '#facc15' : 'var(--text-sub, #777)',
            fontWeight: autoExecute ? 600 : 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            background: autoExecute ? 'rgba(234, 179, 8, 0.1)' : 'transparent',
            padding: '1px 6px',
            borderRadius: '4px',
            border: autoExecute ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid transparent',
            transition: 'all 0.15s ease',
          }}
          title="클릭하여 Auto Mode를 켜거나 끌 수 있습니다."
        >
          ⚡ {autoExecute ? 'Auto: ON (즉시 실행)' : 'Auto: OFF'}
        </span>
        <span>Alt + J 로 열기/닫기</span>
      </div>
    </div>
  );
};
