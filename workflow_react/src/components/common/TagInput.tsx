import React, { useState, useRef, useEffect } from 'react';
import { Hash } from 'lucide-react';
import { useTags } from '@/api/tags';
import { TagBadge } from './TagBadge';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags = [],
  onChange,
  placeholder = '#태그 #태그1 입력 (스페이스/엔터로 등록)',
  maxTags = 15,
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [isOpenSuggestions, setIsOpenSuggestions] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: allTags = [] } = useTags();

  // 추천 태그 필터링 (현재 입력값과 일치하고 이미 추가되지 않은 태그들)
  const currentCleanInput = inputValue.trim().replace(/^#/, '').toLowerCase();
  const suggestions = allTags
    .filter(
      (t) =>
        !tags.includes(t.name) &&
        (!currentCleanInput || t.name.toLowerCase().includes(currentCleanInput))
    )
    .slice(0, 6);

  const addTag = (rawTag: string) => {
    // 띄어쓰기 또는 콤마로 여러 개 입력된 경우 일괄 처리
    const parsed = rawTag
      .split(/[,\s]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    if (parsed.length === 0) return;

    const nextTags = Array.from(new Set([...tags, ...parsed])).slice(0, maxTags);
    onChange(nextTags);
    setInputValue('');
    setIsOpenSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // 입력창이 비어있을 때 백스페이스 누르면 마지막 태그 삭제
      removeTag(tags[tags.length - 1]);
    }
  };

  // 외부 클릭 시 추천 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpenSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          background: 'var(--bg-input, #1e1e1e)',
          border: '1px solid var(--border-light, #3c3c3c)',
          borderRadius: 'var(--radius-xs, 4px)',
          minHeight: '36px',
          cursor: 'text',
          transition: 'border-color 0.15s ease',
        }}
      >
        {tags.map((tag) => (
          <TagBadge key={tag} tag={tag} onRemove={() => removeTag(tag)} />
        ))}

        {tags.length < maxTags && (
          <div style={{ display: 'inline-flex', alignItems: 'center', flex: 1, minWidth: '120px' }}>
            <span style={{ color: 'var(--text-muted)', marginRight: '2px', fontSize: '0.85rem' }}>#</span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setIsOpenSuggestions(true);
              }}
              onFocus={() => setIsOpenSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 ? placeholder : '태그 추가...'}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: 'var(--text-main, #ffffff)',
                fontSize: '0.82rem',
                width: '100%',
                padding: 0,
              }}
            />
          </div>
        )}
      </div>

      {/* 추천 태그 드롭다운 */}
      {isOpenSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--bg-card, #252526)',
            border: '1px solid var(--border-light, #3c3c3c)',
            borderRadius: 'var(--radius-xs, 4px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 1000,
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            추천 태그 (클릭하여 선택)
          </div>
          {suggestions.map((s) => (
            <div
              key={s.id}
              onClick={() => addTag(s.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '0.78rem',
                color: 'var(--text-main)',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Hash size={12} style={{ color: s.color || '#3b82f6' }} />
                <span>{s.name}</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {s.totalCount || 0}개 항목
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
