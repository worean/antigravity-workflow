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
import { useModalLayer } from '@/hooks/useModalLayer';
import { Portal } from '@/components/common/Portal';
import { useUIStore } from '@/stores/useUIStore';

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
  const { zIndex: dynamicZIndex } = useModalLayer(isOpen, {
    onClose,
    triggerKey: group?.id ?? parentId ?? 'new',
  });
  const overlayProps = useOverlayClickClose(onClose);

  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(parentId);

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
            description: description.trim(),
            parentId: selectedParentId ? Number(selectedParentId) : null,
          });
        }
        return await createGroup({
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          parentId: selectedParentId || undefined,
        });
      },
      {
        onSuccess: (saved) => {
          queryClient.invalidateQueries({ queryKey: ['groups'] });
          useUIStore
            .getState()
            .showToast(group ? '그룹 정보가 수정되었습니다.' : '그룹이 성공적으로 생성되었습니다.', 'success');
          if (onSuccess) onSuccess(saved);
          onClose();
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: dynamicZIndex,
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
            background: 'var(--bg-modal)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-lg)',
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              borderBottom: '1px solid var(--border-light)',
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
                color: 'var(--text-bright)',
              }}
            >
              {group ? (
                <>
                  <Edit3 size={16} color="var(--primary)" />
                  <span>그룹 정보 수정</span>
                </>
              ) : selectedParentId ? (
                <>
                  <FolderPlus size={16} color="var(--primary)" />
                  <span>하위 서브그룹/팀 추가</span>
                </>
              ) : (
                <>
                  <Building2 size={16} color="var(--primary)" />
                  <span>최상위 그룹 추가</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                그룹/부서명 <span style={{ color: 'var(--status-urgent)' }}>*</span>
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
    </Portal>
  );
};
