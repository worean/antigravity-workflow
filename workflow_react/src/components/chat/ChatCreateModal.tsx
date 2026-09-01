import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import type { ChannelType, User, Project, Group, ChatChannel } from '@/types';
import { createChannel } from '@/api/chat';
import { useActionFeedback } from '@/hooks/useActionFeedback';
import { ActionFeedbackModal } from '@/components/ActionFeedbackModal';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';

export interface ChatCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: ChannelType;
  allWorkspaceUsers?: User[];
  allWorkspaceProjects?: Project[];
  allWorkspaceGroups?: Group[];
  currentUserId: number;
  onSuccess?: (newChannel: ChatChannel) => void;
}

export const ChatCreateModal: React.FC<ChatCreateModalProps> = ({
  isOpen,
  onClose,
  initialType = 'GLOBAL',
  allWorkspaceUsers = [],
  allWorkspaceProjects = [],
  allWorkspaceGroups = [],
  currentUserId,
  onSuccess,
}) => {
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();
  const overlayProps = useOverlayClickClose(onClose);

  const [createType, setCreateType] = useState<ChannelType>(initialType);
  const [createName, setCreateName] = useState<string>('');
  const [createTopic, setCreateTopic] = useState<string>('');
  const [createTargetUserId, setCreateTargetUserId] = useState<number | null>(null);
  const [createProjectId, setCreateProjectId] = useState<number | null>(null);
  const [createGroupId, setCreateGroupId] = useState<number | null>(null);

  // 🔒 이전 열림 상태 추적용 Ref (타이핑 중 원복 방어)
  const prevIsOpenRef = useRef<boolean>(false);

  useEffect(() => {
    const isNewlyOpened = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (!isOpen) return;

    if (isNewlyOpened) {
      setCreateType(initialType);
      setCreateName('');
      setCreateTopic('');
      setCreateTargetUserId(null);
      setCreateProjectId(allWorkspaceProjects[0]?.id || null);
      setCreateGroupId(allWorkspaceGroups[0]?.id || null);
    }
  }, [isOpen, initialType, allWorkspaceProjects, allWorkspaceGroups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (createType === 'DM' && !createTargetUserId) {
      alert('대화 상대를 선택하세요.');
      return;
    }
    if (createType === 'PROJECT' && !createProjectId) {
      alert('연결할 프로젝트를 선택하세요.');
      return;
    }
    if (createType === 'GROUP' && !createGroupId) {
      alert('연결할 그룹을 선택하세요.');
      return;
    }
    if (createType !== 'DM' && !createName.trim()) {
      alert('채널명을 입력하세요.');
      return;
    }

    await executeAction(
      async () => {
        let payloadName = createName.trim();
        if (createType === 'DM') {
          const target = allWorkspaceUsers.find((u) => u.id === createTargetUserId);
          payloadName = target?.name || target?.email || `User #${createTargetUserId}`;
        }

        return await createChannel({
          name: payloadName,
          type: createType,
          topic: createTopic.trim() || undefined,
          projectId: createType === 'PROJECT' ? (createProjectId ? Number(createProjectId) : undefined) : undefined,
          groupId: createType === 'GROUP' ? (createGroupId ? Number(createGroupId) : undefined) : undefined,
          targetUserId: createType === 'DM' ? (createTargetUserId ? Number(createTargetUserId) : undefined) : undefined,
        });
      },
      {
        onSuccess: (newChannel) => {
          if (onSuccess) onSuccess(newChannel);
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
          {/* Header */}
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
              <MessageSquare size={16} color="var(--primary, #007acc)" />
              <span>새 채팅 채널 생성</span>
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 1. 채널 유형 */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                채널 유형 <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <select
                className="input-field"
                value={createType}
                onChange={(e) => setCreateType(e.target.value as ChannelType)}
              >
                <option value="GLOBAL">📢 공용 채널 (전체 공개)</option>
                <option value="PROJECT">📁 프로젝트 전용 채널</option>
                <option value="GROUP">👥 그룹/부서 전용 채널</option>
                <option value="DM">💬 1:1 다이렉트 메시지 (DM)</option>
              </select>
            </div>

            {/* 2. 조건부 대상 선택 */}
            {createType === 'DM' ? (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                  대화 상대 선택 <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <select
                  className="input-field"
                  value={createTargetUserId || ''}
                  onChange={(e) => setCreateTargetUserId(Number(e.target.value))}
                  required
                >
                  <option value="">-- 사용자를 선택하세요 --</option>
                  {allWorkspaceUsers
                    .filter((u) => u.id !== currentUserId)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name ? `${u.name} (${u.email})` : u.email}
                      </option>
                    ))}
                </select>
              </div>
            ) : createType === 'PROJECT' ? (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                    연결할 프로젝트 <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <select
                    className="input-field"
                    value={createProjectId || ''}
                    onChange={(e) => {
                      const pId = Number(e.target.value);
                      setCreateProjectId(pId);
                      const p = allWorkspaceProjects.find((x) => x.id === pId);
                      if (p) setCreateName(p.name);
                    }}
                    required
                  >
                    <option value="">-- 프로젝트를 선택하세요 --</option>
                    {allWorkspaceProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.key || `PRJ-${p.id}`}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                    채널명 <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="예: 백엔드 개발 회의"
                    required
                  />
                </div>
              </>
            ) : createType === 'GROUP' ? (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                    연결할 그룹/부서 <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <select
                    className="input-field"
                    value={createGroupId || ''}
                    onChange={(e) => {
                      const gId = Number(e.target.value);
                      setCreateGroupId(gId);
                      const g = allWorkspaceGroups.find((x) => x.id === gId);
                      if (g) setCreateName(g.name);
                    }}
                    required
                  >
                    <option value="">-- 그룹을 선택하세요 --</option>
                    {allWorkspaceGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.code || `ID:${g.id}`})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                    채널명 <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="예: 플랫폼본부 전체방"
                    required
                  />
                </div>
              </>
            ) : (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                  채널명 <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="예: 공지사항, 자유토론, 기술공유"
                  required
                  autoFocus
                />
              </div>
            )}

            {/* 3. 토픽 / 설명 */}
            {createType !== 'DM' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                  채널 주제 / 토픽
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={createTopic}
                  onChange={(e) => setCreateTopic(e.target.value)}
                  placeholder="채널의 목적이나 주요 논의 주제"
                />
              </div>
            )}

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
                    <Loader2 size={16} className="animate-spin" /> 생성 중...
                  </>
                ) : (
                  '채널 생성'
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