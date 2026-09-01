import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  X,
  Building2,
  FolderPlus,
  Loader2,
  Edit3,
} from 'lucide-react';
import type { Group } from '@/types';
import { createGroup, updateGroup } from '@/services/api';
import { useActionFeedback } from '@/hooks/useActionFeedback';
import { ActionFeedbackModal } from '@/components/ActionFeedbackModal';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';

export interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: number | null;
  group?: Group | null;
  flatGroups?: Group[];
  onSuccess?: (savedGroup?: Group) => void;
}

export const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  parentId = null,
  group = null,
  flatGroups = [],
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();
  const overlayProps = useOverlayClickClose(onClose);

  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(parentId);

  // 🔒 이전 열림 상태 및 대상 그룹 ID 추적용 Ref (타이핑 중 원복 방어)
  const prevIsOpenRef = useRef<boolean>(false);
  const prevGroupIdRef = useRef<number | null>(null);

  useEffect(() => {
    const isNewlyOpened = isOpen && !prevIsOpenRef.current;
    const isGroupChanged = group ? group.id !== prevGroupIdRef.current : prevGroupIdRef.current !== null;

    prevIsOpenRef.current = isOpen;
    prevGroupIdRef.current = group ? group.id : null;

    if (!isOpen) return;

    if (isNewlyOpened || isGroupChanged) {
      if (group) {
        setName(group.name || '');
        setCode(group.code || '');
        setDescription(group.description || '');
        setSelectedParentId(group.parentId || null);
      } else {
        setName('');
        setCode('');
        setDescription('');
        setSelectedParentId(parentId);
      }
    }
  }, [isOpen, group, parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('그룹/부서명을 입력하세요.');

    await executeAction(
      async () => {
        if (group) {
          return await updateGroup(group.id, {
            name: name.trim(),
            code: code.trim() || undefined,
            description: description.trim() || undefined,
            parentId: selectedParentId || undefined,
          });
        } else {
          return await createGroup({
            name: name.trim(),
            code: code.trim() || undefined,
            description: description.trim() || undefined,
            parentId: selectedParentId || undefined,
          });
        }
      },
      {
        onSuccess: (saved) => {
          queryClient.invalidateQueries({ queryKey: ['groups'] });
          if (onSuccess) onSuccess(saved);
          onClose();
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(2px)',
        }}
        {...overlayProps}
      >
        <div
          className="modal-content"
          style={{
            maxWidth: '460px',
            width: '92%',
            padding: '16px 20px',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
            margin: 'auto',
            borderRadius: '6px',
            background: '#252526',
            border: '1px solid #454545',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (IssueModal 100% 동일 구조) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              borderBottom: '1px solid var(--border-light, #3c3c3c)',
              paddingBottom: '8px',
            }}
          >
            <div
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-bright, #fff)',
              }}
            >
              {group ? (
                <>
                  <Edit3 size={16} color="var(--primary, #007acc)" />
                  <span>그룹 정보 수정</span>
                </>
              ) : selectedParentId ? (
                <>
                  <FolderPlus size={16} color="var(--primary, #007acc)" />
                  <span>하위 서브그룹/팀 추가</span>
                </>
              ) : (
                <>
                  <Building2 size={16} color="var(--primary, #007acc)" />
                  <span>최상위 그룹 추가</span>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #888)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                그룹/부서명 <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 플랫폼개발본부, 백엔드팀"
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                그룹 식별 코드 (영문/숫자)
              </label>
              <input
                type="text"
                className="input-field"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="예: PLATFORM, BE_DEV"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                상위 그룹
              </label>
              <select
                className="input-field"
                value={selectedParentId || ''}
                onChange={(e) => setSelectedParentId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">-- 없음 (최상위 그룹) --</option>
                {flatGroups
                  .filter((g) => !group || g.id !== group.id)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.code || `ID:${g.id}`})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                설명
              </label>
              <input
                type="text"
                className="input-field"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="부서 또는 팀의 주요 업무 설명"
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isPending}
                style={{ flex: 1 }}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> 처리 중...
                  </>
                ) : group ? (
                  '그룹 정보 저장'
                ) : (
                  '그룹 생성 완료'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ActionFeedbackModal state={errorState} onClose={closeErrorModal} />
    </>
  );
};
