import React, { useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, AtSign, X, Loader2 } from 'lucide-react';
import type { ChatChannel } from '@/types';
import { Button } from '@/components/common';

interface ChatInputAreaProps {
  currentChannel: ChatChannel | null;
  isAuthenticated: boolean;
  isSendingMessage: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  handleSendMessage: (e?: React.FormEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  mentionSuggestions: { id: string | number; name: string; type: string }[];
  mentionQuery: string | null;
  handleSelectMention: (item: { id: string | number; name: string; type: string }) => void;
  setMentionQuery: (query: string | null) => void;
  onOpenAuth?: () => void;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  currentChannel,
  isAuthenticated,
  isSendingMessage,
  inputText,
  setInputText,
  handleSendMessage,
  handleKeyDown,
  mentionSuggestions,
  mentionQuery,
  handleSelectMention,
  setMentionQuery,
  onOpenAuth,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 📐 텍스트 입력 내용에 맞춘 자동 높이 조절 (최소 3줄 ~ 최대 화면 절반 45vh)
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const computedHeight = Math.max(54, textarea.scrollHeight);
    textarea.style.height = `${computedHeight}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [inputText, adjustHeight]);

  // 🎯 채널 변경 시 또는 메시지 전송 완료 시 포커스를 inputarea에 지속 유지
  useEffect(() => {
    if (isAuthenticated && !isSendingMessage) {
      textareaRef.current?.focus();
    }
  }, [currentChannel?.id, isSendingMessage, isAuthenticated]);

  const onSelectMentionWithFocus = (item: { id: string | number; name: string; type: string }) => {
    handleSelectMention(item);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingMessage) return;
    handleSendMessage(e);
    // 전송 후에도 포커스를 입력창에 즉시 유지
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  if (!isAuthenticated) {
    return (
      <div
        style={{
          padding: '16px',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-light)',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>채팅에 참여하고 메시지를 보내려면 </span>
        <Button variant="primary" size="sm" onClick={onOpenAuth} style={{ marginLeft: '6px' }}>
          로그인
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '0 16px 20px',
        position: 'relative',
      }}
    >
      {/* Mention Auto-Complete Popup */}
      {mentionQuery !== null && mentionSuggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '90px',
            left: '16px',
            background: 'var(--bg-modal)',
            border: '1px solid var(--border-light)',
            borderRadius: '8px',
            padding: '6px',
            width: '240px',
            maxHeight: '180px',
            overflowY: 'auto',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.2)',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '2px 6px',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-light)',
              marginBottom: '4px',
            }}
          >
            <span>멤버 멘션</span>
            <button
              type="button"
              onClick={() => {
                setMentionQuery(null);
                textareaRef.current?.focus();
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={10} />
            </button>
          </div>
          {mentionSuggestions.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              onClick={() => onSelectMentionWithFocus(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '4px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-main)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-subtle)';
                e.currentTarget.style.color = 'var(--text-bright)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
            >
              <AtSign size={12} color="#3b82f6" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* 💬 Auto-Expanding Chat Input Box (Min 3-rows, Max 45vh with Scrollbar) */}
      <form
        onSubmit={onSubmitForm}
        style={{
          background: isSendingMessage ? 'var(--bg-subtle)' : 'var(--bg-card)',
          borderRadius: '8px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'stretch',
          gap: '10px',
          opacity: isSendingMessage ? 0.8 : 1,
          transition: 'all 0.15s ease',
          minHeight: '74px',
          maxHeight: 'calc(50vh - 20px)',
          border: '1px solid var(--border-light)',
        }}
      >
        {/* 📎 Left Action Buttons (Top-Aligned) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', paddingTop: '2px' }}>
          <button
            type="button"
            disabled={isSendingMessage}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-sub)',
              cursor: isSendingMessage ? 'not-allowed' : 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              opacity: isSendingMessage ? 0.5 : 1,
              transition: 'background-color 0.12s',
            }}
            title="파일 첨부"
            onMouseEnter={(e) => {
              if (!isSendingMessage) e.currentTarget.style.background = 'var(--bg-subtle)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <Paperclip size={18} />
          </button>
        </div>

        {/* 📝 Auto-Expanding Textarea (Focus Kept On Send, No Manual Resize, Max 45vh) */}
        <textarea
          ref={textareaRef}
          value={inputText}
          readOnly={isSendingMessage}
          onChange={(e) => {
            setInputText(e.target.value);
            adjustHeight();
          }}
          onKeyDown={(e) => {
            handleKeyDown(e);
          }}
          placeholder={
            isSendingMessage
              ? '메시지를 전송하고 응답을 기다리는 중입니다...'
              : `#${currentChannel?.name || '채널'}에 메시지 보내기... (@멘션 지원, Enter: 전송, Shift+Enter: 줄바꿈)`
          }
          rows={3}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            resize: 'none', // 🚫 사용자 임의 크기 조절 금지
            outline: 'none',
            minHeight: '54px', // 📐 기본 3줄 높이
            maxHeight: 'calc(50vh - 45px)', // 🔝 최대 화면 절반까지만 확장
            overflowY: 'auto', // 📜 초과 시 스크롤바 대체
            lineHeight: 1.45,
            padding: '2px 0',
            cursor: isSendingMessage ? 'wait' : 'text',
            fontFamily: 'inherit',
          }}
        />

        {/* 🚀 Right Send Button (Bottom-Aligned) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-end' }}>
          <button
            type="submit"
            disabled={isSendingMessage || !inputText.trim()}
            style={{
              background: isSendingMessage ? 'var(--primary)' : inputText.trim() ? 'var(--primary)' : 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              color: isSendingMessage ? '#fff' : inputText.trim() ? '#fff' : 'var(--text-muted)',
              cursor: isSendingMessage ? 'wait' : inputText.trim() ? 'pointer' : 'default',
              padding: '6px 10px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              minWidth: '34px',
              height: '30px',
            }}
            title={isSendingMessage ? '전송 중...' : '메시지 전송 (Enter)'}
          >
            {isSendingMessage ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};