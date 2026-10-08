import React, { useState } from 'react';
import { RotateCcw, Sparkles, Layers } from 'lucide-react';
import { ModalWrapper, Button } from '@/components/common';
import { usePrefStore } from '@/stores/usePrefStore';
import { resolveWBSColorTheme } from '@/utils/wbs';
import type { Issue } from '@/types';
import type { WBSColorTheme } from '@/types/wbs';
import { WBSColorModeTab, WBSColorPerIssueTab } from './colorModal';

interface WBSColorConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootIssues: Issue[];
}

export const WBSColorConfigModal: React.FC<WBSColorConfigModalProps> = ({
  isOpen,
  onClose,
  rootIssues,
}) => {
  const [activeTab, setActiveTab] = useState<'mode' | 'per_issue'>('mode');
  const [customHexInput, setCustomHexInput] = useState<string>('#0284c7');

  const wbsColorMode = usePrefStore((s) => s.wbsColorMode);
  const wbsDefaultTheme = usePrefStore((s) => s.wbsDefaultTheme);
  const wbsRootColorMap = usePrefStore((s) => s.wbsRootColorMap);

  const setWBSColorMode = usePrefStore((s) => s.setWBSColorMode);
  const setWBSDefaultTheme = usePrefStore((s) => s.setWBSDefaultTheme);
  const setWBSRootColor = usePrefStore((s) => s.setWBSRootColor);
  const removeWBSRootColor = usePrefStore((s) => s.removeWBSRootColor);
  const resetWBSColors = usePrefStore((s) => s.resetWBSColors);

  // 미리보기용 현재 대표 테마
  const previewTheme: WBSColorTheme = resolveWBSColorTheme(wbsDefaultTheme);

  const handleReset = () => {
    if (window.confirm('모든 간트차트 색상 설정을 기본값(다채로운 멀티 컬러)으로 초기화하시겠습니까?')) {
      resetWBSColors();
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="WBS 간트차트 색상 설정" maxWidth="620px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8rem' }}>
        {/* Sub Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-light)',
            gap: '8px',
            paddingBottom: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('mode')}
            style={{
              padding: '6px 12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'mode' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'mode' ? 'var(--text-bright)' : 'var(--text-muted)',
              fontWeight: activeTab === 'mode' ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} />
            <span>기본 색상 모드</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('per_issue')}
            style={{
              padding: '6px 12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'per_issue' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'per_issue' ? 'var(--text-bright)' : 'var(--text-muted)',
              fontWeight: activeTab === 'per_issue' ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={14} />
            <span>일감별 색상 지정 ({rootIssues.length}개)</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'mode' ? (
          <WBSColorModeTab
            wbsColorMode={wbsColorMode}
            setWBSColorMode={setWBSColorMode}
            wbsDefaultTheme={wbsDefaultTheme}
            setWBSDefaultTheme={setWBSDefaultTheme}
            customHexInput={customHexInput}
            setCustomHexInput={setCustomHexInput}
            previewTheme={previewTheme}
          />
        ) : (
          <WBSColorPerIssueTab
            rootIssues={rootIssues}
            wbsRootColorMap={wbsRootColorMap}
            setWBSRootColor={setWBSRootColor}
            removeWBSRootColor={removeWBSRootColor}
          />
        )}

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '12px',
            marginTop: '4px',
          }}
        >
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-sub)',
              cursor: 'pointer',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RotateCcw size={12} />
            <span>기본값으로 초기화</span>
          </button>

          <Button variant="primary" size="sm" onClick={onClose}>
            적용 및 닫기
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
};
