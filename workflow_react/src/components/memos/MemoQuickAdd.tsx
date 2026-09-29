import React, { useState } from 'react';
import type { MemoColor, UserMemoItem } from '@/types/memo';
import { useMemoStore } from '@/stores/useMemoStore';
import { useAuth } from '@/context/AuthContext';
import { Plus } from 'lucide-react';

export interface MemoQuickAddProps {
  issueId?: number | null;
  onSuccess?: (memo: UserMemoItem) => void;
  onCancel?: () => void;
  placeholder?: string;
}

const COLOR_OPTIONS: MemoColor[] = ['yellow', 'blue', 'green', 'pink', 'purple'];
const COLOR_HEX: Record<MemoColor, string> = {
  yellow: '#eab308',
  blue: '#3b82f6',
  green: '#22c55e',
  pink: '#ec4899',
  purple: '#a855f7',
};

export const MemoQuickAdd: React.FC<MemoQuickAddProps> = ({
  issueId = null,
  onSuccess,
  onCancel,
  placeholder = '빠른 메모를 입력하세요...',
}) => {
  const { user } = useAuth();
  const createMemo = useMemoStore((s) => s.createMemo);

  const [text, setText] = useState('');
  const [color, setColor] = useState<MemoColor>('yellow');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !text.trim()) return;

    const created = createMemo(user.id, {
      issueId,
      content: text.trim(),
      color,
      isPinned: false,
    });

    setText('');
    if (onSuccess) onSuccess(created);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '8px',
        background: 'var(--bg-card)',
        borderRadius: '4px',
        border: '1px solid var(--border-light)',
      }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight: '60px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-light)',
          borderRadius: '3px',
          padding: '6px',
          fontSize: '0.78rem',
          color: 'var(--text-bright)',
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: COLOR_HEX[c],
                border: color === c ? '2px solid #ffffff' : 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.7rem', height: '22px' }}
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={!text.trim()}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.7rem', height: '22px', display: 'flex', alignItems: 'center', gap: '2px' }}
          >
            <Plus size={11} /> 등록
          </button>
        </div>
      </div>
    </form>
  );
};
