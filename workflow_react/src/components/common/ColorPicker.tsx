import React, { useState, useEffect } from 'react';
import { Check, Hash } from 'lucide-react';
import {
  PALETTE_PRESETS,
  isValidHex,
  getOptimalContrastText,
} from '@/utils/colorUtils';

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets?: readonly string[] | string[];
  allowCustom?: boolean;
  label?: string;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  presets = PALETTE_PRESETS,
  allowCustom = true,
  label,
  className = '',
}) => {
  const [customHex, setCustomHex] = useState(value || '#3b82f6');
  const [isHexError, setIsHexError] = useState(false);

  useEffect(() => {
    setCustomHex(value || '#3b82f6');
  }, [value]);

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.trim();
    if (!input.startsWith('#') && input.length > 0) {
      input = '#' + input;
    }
    setCustomHex(input);

    if (isValidHex(input)) {
      setIsHexError(false);
      onChange(input);
    } else {
      setIsHexError(true);
    }
  };

  const currentContrast = getOptimalContrastText(value || '#3b82f6');

  return (
    <div className={`ag-color-picker ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {label && (
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-bright)' }}>
          {label}
        </div>
      )}

      {/* 1. 프리셋 컬러 스와치 그리드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gap: '6px',
        }}
      >
        {presets.map((presetColor) => {
          const isSelected = value?.toLowerCase() === presetColor.toLowerCase();
          const contrast = getOptimalContrastText(presetColor);

          return (
            <button
              key={presetColor}
              type="button"
              onClick={() => {
                onChange(presetColor);
                setCustomHex(presetColor);
                setIsHexError(false);
              }}
              title={presetColor}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                backgroundColor: presetColor,
                border: isSelected
                  ? '2px solid var(--text-bright, #fff)'
                  : '1px solid rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSelected ? '0 0 0 2px var(--primary)' : 'none',
                transition: 'transform 0.1s ease',
                padding: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
            >
              {isSelected && <Check size={14} color={contrast.color} strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      {/* 2. 직접 HEX 입력창 및 실시간 컬러 미리보기 */}
      {allowCustom && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              backgroundColor: isValidHex(value) ? value : '#3b82f6',
              border: '1px solid var(--border-light)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: currentContrast.color }}>
              Aa
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-subtle)',
              border: `1px solid ${isHexError ? 'var(--status-urgent, #ef4444)' : 'var(--border-light)'}`,
              borderRadius: '4px',
              padding: '2px 8px',
              flex: 1,
            }}
          >
            <Hash size={12} color="var(--text-muted)" style={{ marginRight: '4px' }} />
            <input
              type="text"
              value={customHex.replace('#', '')}
              onChange={(e) => handleCustomChange({ ...e, target: { ...e.target, value: '#' + e.target.value } })}
              placeholder="HEX (예: 3b82f6)"
              maxLength={8}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                width: '100%',
                fontFamily: 'Consolas, monospace',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
