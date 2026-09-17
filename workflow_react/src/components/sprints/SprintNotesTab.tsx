import React, { useState, useEffect } from 'react';
import { Save, FileText, Coffee, Target, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button, MarkdownEditor, MarkdownViewer } from '@/components/common';
import { updateSprint } from '@/services/api';
import type { Sprint } from '@/types';

interface SprintNotesTabProps {
  sprint: Sprint;
  isAuthenticated: boolean;
  onSprintUpdated?: () => void;
  onOpenAuth?: () => void;
}

const TEMPLATES = {
  MEETING: `### 📌 스프린트 회의록 & 결정사항
- **일시**: ${new Date().toLocaleDateString('ko-KR')}
- **참석자**: 
- **주요 안건**:
  1. 
  2. 

#### 💡 핵심 결정 사항 (Key Decisions)
- [결정 1]
- [결정 2]

#### 🚀 Action Items
- [ ] 담당자 / 작업 내용 / 기한
`,
  STANDUP: `### ☕ 데일리 스크럼 (Daily Standup Memo)
- **일자**: ${new Date().toLocaleDateString('ko-KR')}

#### 1. 어제 진행한 작업
- 

#### 2. 오늘 진행할 작업
- 

#### 3. 장애물 & 블로커 (Blockers)
- 
`,
  RETRO: `### 🎯 스프린트 회고 (KPT Retrospective)

#### 🟢 Keep (잘한 점 & 유지할 점)
- 

#### 🔴 Problem (아쉬운 점 & 마주친 문제)
- 

#### 🔵 Try (다음에 시도해볼 개선 방안)
- 
`,
};

export const SprintNotesTab: React.FC<SprintNotesTabProps> = ({
  sprint,
  isAuthenticated,
  onSprintUpdated,
  onOpenAuth,
}) => {
  const [notes, setNotes] = useState<string>(sprint.notes || '');
  const [isEditing, setIsEditing] = useState<boolean>(!sprint.notes);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<boolean>(false);

  useEffect(() => {
    setNotes(sprint.notes || '');
    if (!sprint.notes) {
      setIsEditing(true);
    }
  }, [sprint.notes]);

  const handleSaveNotes = async () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setIsSaving(true);
    try {
      await updateSprint(sprint.id, { notes });
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2500);
      setIsEditing(false);
      if (onSprintUpdated) onSprintUpdated();
    } catch (err: any) {
      console.error('Failed to save sprint notes:', err);
      alert(err.response?.data?.error || '회의록 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInsertTemplate = (templateType: 'MEETING' | 'STANDUP' | 'RETRO') => {
    const textToAppend = TEMPLATES[templateType];
    setNotes((prev) => (prev ? prev + '\n\n' + textToAppend : textToAppend));
    setIsEditing(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Toolbar & Quick Templates */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        {/* Template Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginRight: '4px' }}>
            <Sparkles size={12} style={{ display: 'inline', marginRight: '3px' }} />
            빠른 템플릿:
          </span>
          <Button
            size="sm"
            variant="secondary"
            icon={<FileText size={12} />}
            onClick={() => handleInsertTemplate('MEETING')}
          >
            회의록 템플릿
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Coffee size={12} />}
            onClick={() => handleInsertTemplate('STANDUP')}
          >
            데일리 스크럼
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Target size={12} />}
            onClick={() => handleInsertTemplate('RETRO')}
          >
            KPT 회고
          </Button>
        </div>

        {/* View/Edit Toggle and Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {saveFeedback && (
            <span
              style={{
                fontSize: '0.72rem',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CheckCircle2 size={13} /> 저장 완료!
            </span>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '미리보기 모드' : '편집 모드'}
          </Button>

          {isEditing && (
            <Button
              size="sm"
              variant="primary"
              icon={<Save size={13} />}
              onClick={handleSaveNotes}
              disabled={isSaving}
            >
              {isSaving ? '저장 중...' : '회의록 저장'}
            </Button>
          )}
        </div>
      </div>

      {/* Editor or Viewer Body */}
      {isEditing ? (
        <div style={{ minHeight: '340px' }}>
          <MarkdownEditor
            value={notes}
            onChange={setNotes}
            placeholder="스프린트 진행 중 결정된 회의록, 데일리 스크럼 메모, 블로커 해결 방법 등을 자유롭게 기록하세요 (마크다운 지원)"
            minHeight="340px"
          />
        </div>
      ) : (
        <div
          style={{
            minHeight: '300px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '16px',
          }}
        >
          {notes ? (
            <MarkdownViewer content={notes} />
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-muted)',
              }}
            >
              <FileText size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                작성된 스프린트 회의록이나 메모가 없습니다.
              </div>
              <div style={{ fontSize: '0.75rem' }}>
                상단의 <strong>'편집 모드'</strong> 또는 <strong>'빠른 템플릿'</strong>을 클릭하여 스프린트 메모를 작성해보세요.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};