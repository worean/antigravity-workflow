import React, { useState } from 'react';
import { createProject } from '@/services/api';
import { FolderPlus, Hash } from 'lucide-react';
import { useActionFeedback } from '@/hooks/useActionFeedback';
import { ActionFeedbackModal } from './ActionFeedbackModal';
import { ModalWrapper, Button, TagInput } from './common';
import type { Project } from '@/types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProject: Project) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);

  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await executeAction(
      async () => {
        return await createProject({ name, key: key.toUpperCase(), description, tags });
      },
      {
        onSuccess: (createdProject) => {
          setName('');
          setKey('');
          setDescription('');
          setTags([]);
          onSuccess(createdProject);
          onClose();
        },
      }
    );
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key && val.length >= 2) {
      setKey(val.substring(0, 3).toUpperCase());
    }
  };

  return (
    <>
      <ModalWrapper
        isOpen={isOpen}
        onClose={onClose}
        title="신규 프로젝트 생성"
        icon={<FolderPlus size={16} color="var(--primary)" />}
        maxWidth="440px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">프로젝트 명칭</label>
            <input
              type="text"
              className="input-field"
              placeholder="예: AntiGravity Core Systems"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">프로젝트 키 (Key - 이슈 접두사)</label>
            <input
              type="text"
              className="input-field"
              placeholder="예: AGY"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              maxLength={10}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">프로젝트 설명</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="프로젝트 목적 및 개요 작성..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 🏷️ 태그 입력 영역 */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Hash size={12} color="var(--primary)" />
              <span>프로젝트 태그</span>
            </label>
            <TagInput tags={tags} onChange={setTags} placeholder="#태그 #태그1 입력 (스페이스/엔터)" />
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isPending} style={{ flex: 1 }}>
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isPending}
              disabled={!name.trim() || !key.trim()}
              style={{ flex: 1 }}
            >
              생성하기
            </Button>
          </div>
        </form>
      </ModalWrapper>

      <ActionFeedbackModal state={errorState} onClose={closeErrorModal} />
    </>
  );
};
