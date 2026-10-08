import React from 'react';
import { Palette, Check } from 'lucide-react';
import { WBS_PALETTE } from '@/utils/wbs';
import type { WBSColorTheme } from '@/types/wbs';

interface WBSColorModeTabProps {
  wbsColorMode: 'multi' | 'single';
  setWBSColorMode: (mode: 'multi' | 'single') => void;
  wbsDefaultTheme: string;
  setWBSDefaultTheme: (theme: string) => void;
  customHexInput: string;
  setCustomHexInput: (hex: string) => void;
  previewTheme: WBSColorTheme;
}

export const WBSColorModeTab: React.FC<WBSColorModeTabProps> = ({
  wbsColorMode,
  setWBSColorMode,
  wbsDefaultTheme,
  setWBSDefaultTheme,
  customHexInput,
  setCustomHexInput,
  previewTheme,
}) => {
  const handleSelectDefaultPreset = (name: string) => {
    setWBSDefaultTheme(name);
  };

  const handleApplyCustomHex = (hex: string) => {
    setCustomHexInput(hex);
    setWBSDefaultTheme(hex);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Color Mode Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontWeight: 600, color: 'var(--text-bright)' }}>표시 모드 선택</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div
            onClick={() => setWBSColorMode('multi')}
            style={{
              padding: '10px 12px',
              border: wbsColorMode === 'multi' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
              background: wbsColorMode === 'multi' ? 'var(--nav-item-active, rgba(0, 122, 204, 0.12))' : 'var(--bg-subtle)',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>🌈 멀티 컬러 (기본)</span>
              {wbsColorMode === 'multi' && <Check size={14} color="var(--primary)" />}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>
              최상위 일감마다 12가지 팔레트 중 고유한 색상을 자동 부여하여 식별합니다.
            </span>
          </div>

          <div
            onClick={() => setWBSColorMode('single')}
            style={{
              padding: '10px 12px',
              border: wbsColorMode === 'single' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
              background: wbsColorMode === 'single' ? 'var(--nav-item-active, rgba(0, 122, 204, 0.12))' : 'var(--bg-subtle)',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>🎨 단일 색상 통일</span>
              {wbsColorMode === 'single' && <Check size={14} color="var(--primary)" />}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>
              모든 간트 바를 아래에서 선택한 색상 테마 하나로 깔끔하게 통일합니다.
            </span>
          </div>
        </div>
      </div>

      {/* 12 Presets Palette Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
          {wbsColorMode === 'single' ? '단일 통일 테마 선택' : '기본 기준 테마'}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
          {WBS_PALETTE.map((theme) => {
            const isSelected = wbsDefaultTheme === theme.name;
            return (
              <button
                key={theme.name}
                type="button"
                onClick={() => handleSelectDefaultPreset(theme.name)}
                style={{
                  padding: '6px',
                  background: 'var(--bg-subtle)',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    width: '28px',
                    height: '20px',
                    background: theme.base,
                    borderRadius: '3px',
                    border: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected && <Check size={12} color="var(--text-bright, #ffffff)" />}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{theme.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={15} color="var(--primary)" />
          <span style={{ fontWeight: 500, color: 'var(--text-bright)' }}>사용자 지정 색상 (HEX)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="color"
            value={customHexInput}
            onChange={(e) => handleApplyCustomHex(e.target.value)}
            style={{
              width: '32px',
              height: '24px',
              padding: 0,
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              background: 'none',
            }}
            title="컬러 피커로 선택"
          />
          <input
            type="text"
            value={customHexInput}
            onChange={(e) => handleApplyCustomHex(e.target.value)}
            style={{
              width: '80px',
              padding: '3px 6px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-bright)',
              borderRadius: 'var(--radius-xs)',
            }}
          />
        </div>
      </div>

      {/* Live Preview Card */}
      <div
        style={{
          padding: '10px 12px',
          background: 'var(--bg-dark)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          실시간 간트 바 미리보기 (Live Preview)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { label: '진척률 0% (계획 상태)', prog: 0 },
            { label: '진척률 50% (진행 상태)', prog: 50 },
            { label: '진척률 100% (완료 상태)', prog: 100 },
          ].map(({ label, prog }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-sub)', width: '130px' }}>{label}</span>
              <div
                style={{
                  flex: 1,
                  height: '22px',
                  background: previewTheme.bgEmpty,
                  border: `2px solid ${previewTheme.border}`,
                  borderRadius: '3px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${prog}%`,
                    background: previewTheme.base,
                    opacity: 0.85,
                  }}
                />
                <span
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: 'var(--text-bright, #ffffff)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                  }}
                >
                  샘플 일감 바 ({prog}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
