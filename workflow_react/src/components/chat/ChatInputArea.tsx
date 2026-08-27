// -*- coding: utf-8 -*-
import React from 'react';
import { Send, Paperclip, AtSign, X } from 'lucide-react';
import type { ChatChannel } from '../../types';
import { Button } from '../common';

interface ChatInputAreaProps {
  currentChannel: ChatChannel | null;
  isAuthenticated: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
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
  if (!isAuthenticated) {
    return (
      <div
        style={{
          padding: '16px',
          background: '#2b2d31',
          borderTop: '1px solid #27272a',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#8e9297',
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
            bottom: '70px',
            left: '16px',
            background: '#2b2d31',
            border: '1px solid #1f2023',
            borderRadius: '8px',
            padding: '6px',
            width: '240px',
            maxHeight: '180px',
            overflowY: 'auto',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.5)',
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
              color: '#8e9297',
              borderBottom: '1px solid #35373c',
              marginBottom: '4px',
            }}
          >
            <span>멤버 멘션</span>
            <button
              type="button"
              onClick={() => setMentionQuery(null)}
              style={{ background: 'none', border: 'none', color: '#8e9297', cursor: 'pointer' }}
            >
              <X size={10} />
            </button>
          </div>

          {mentionSuggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectMention(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 8px',
                background: 'none',
                border: 'none',
                color: '#dcddde',
                fontSize: '0.74rem',
                cursor: 'pointer',
                borderRadius: '4px',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#35373c';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#dcddde';
              }}
            >
              <AtSign size={12} color="#3b82f6" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={handleSendMessage}
        style={{
          background: '#383a40',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
        }}
      >
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: '#b9bbbe',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '2px',
          }}
          title="파일 첨부"
        >
          <Paperclip size={18} />
        </button>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`#${currentChannel?.name || '채널'}에 메시지 보내기... (@멘션 지원, Enter로 전송)`}
          rows={1}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '0.82rem',
            resize: 'none',
            outline: 'none',
            maxHeight: '120px',
            lineHeight: 1.4,
            padding: '4px 0',
          }}
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          style={{
            background: inputText.trim() ? '#3b82f6' : 'none',
            border: 'none',
            color: inputText.trim() ? '#fff' : '#72767d',
            cursor: inputText.trim() ? 'pointer' : 'default',
            padding: '6px 8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          title="전송"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};