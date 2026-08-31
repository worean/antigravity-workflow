// -*- coding: utf-8 -*-
import React, { memo } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import type { ChannelType } from '@/types';

export interface CategoryConfig {
  type: ChannelType;
  label: string;
  icon: string;
}

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  { type: 'GLOBAL', label: '공용 채널', icon: '📢' },
  { type: 'PROJECT', label: '프로젝트 채널', icon: '📁' },
  { type: 'GROUP', label: '그룹 / 부서 채널', icon: '👥' },
  { type: 'DM', label: '다이렉트 메시지', icon: '💬' },
];

interface ChatCategoryNavProps {
  activeCategory: 'ALL' | ChannelType;
  setActiveCategory: (cat: 'ALL' | ChannelType) => void;
  isAuthenticated: boolean;
  onOpenCreateModal: () => void;
}

export const ChatCategoryNav: React.FC<ChatCategoryNavProps> = memo(({
  activeCategory,
  setActiveCategory,
  isAuthenticated,
  onOpenCreateModal,
}) => {
  return (
    <div
      style={{
        width: '60px',
        background: '#18181b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        gap: '12px',
        borderRight: '1px solid #27272a',
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={() => setActiveCategory('ALL')}
        title="전체 채널"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: activeCategory === 'ALL' ? '14px' : '22px',
          background: activeCategory === 'ALL' ? 'var(--primary)' : '#27272a',
          color: '#fff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <MessageSquare size={20} />
      </button>

      <div style={{ width: '32px', height: '1px', background: '#27272a' }} />

      {CATEGORY_CONFIGS.map((cat) => {
        const isActive = activeCategory === cat.type;
        return (
          <button
            key={cat.type}
            type="button"
            onClick={() => setActiveCategory(cat.type)}
            title={cat.label}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: isActive ? '14px' : '22px',
              background: isActive ? '#3b82f6' : '#27272a',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{cat.icon}</span>
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      {isAuthenticated && (
        <button
          type="button"
          onClick={onOpenCreateModal}
          title="새 채널 생성"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '22px',
            background: '#27272a',
            color: '#10b981',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#10b981';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderRadius = '14px';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#27272a';
            e.currentTarget.style.color = '#10b981';
            e.currentTarget.style.borderRadius = '22px';
          }}
        >
          <Plus size={20} />
        </button>
      )}
    </div>
  );
});

ChatCategoryNav.displayName = 'ChatCategoryNav';