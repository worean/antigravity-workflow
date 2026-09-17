import React, { useState } from 'react';
import { Layers, X, Sparkles } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';

interface WorkspaceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_ICONS = ['🚀', '🏢', '⚡', '🌟', '💻', '🎯', '🔥', '🛡️', '📦', '🔬'];

export const WorkspaceCreateModal: React.FC<WorkspaceCreateModalProps> = ({ isOpen, onClose }) => {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🚀');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('워크스페이스 이름을 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
      });
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '워크스페이스 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(2px)',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--bg-header)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                새 워크스페이스 생성
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                독립된 물리 데이터베이스와 프로젝트 공간을 생성합니다.
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: '2px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {error && (
            <div
              style={{
                padding: '8px 10px',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(241, 76, 76, 0.12)',
                border: '1px solid var(--accent-rose)',
                color: '#ff8080',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              {error}
            </div>
          )}

          {/* Icon Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
              아이콘 선택
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {DEFAULT_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  style={{
                    width: '32px',
                    height: '32px',
                    fontSize: '1rem',
                    background: icon === emoji ? 'var(--primary-subtle)' : 'var(--bg-dark)',
                    border: icon === emoji ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
              워크스페이스 이름 <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 알파 개발팀, 코어 연구소"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-bright)',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Description Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
              설명 (선택)
            </label>
            <textarea
              rows={2}
              placeholder="워크스페이스 목적이나 소개를 입력하세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-bright)',
                fontSize: '0.8rem',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '5px 12px' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="btn btn-primary"
              style={{ padding: '5px 14px' }}
            >
              <Sparkles size={12} />
              <span>{isSubmitting ? '생성 중...' : '워크스페이스 생성'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
