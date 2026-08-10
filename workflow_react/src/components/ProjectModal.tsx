import React, { useState } from 'react';
import { createProject } from '../services/api';
import { X, FolderPlus, Loader2 } from 'lucide-react';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { ActionFeedbackModal } from './ActionFeedbackModal';
import type { Project } from '../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProject: Project) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await executeAction(
      async () => {
        return await createProject({ name, key: key.toUpperCase(), description });
      },
      {
        onSuccess: (createdProject) => {
          setName('');
          setKey('');
          setDescription('');
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
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderPlus size={22} color="var(--primary)" /> 신규 프로젝트 생성
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">프로젝트 명칭 (Name)</label>
              <input
                type="text"
                className="input-field"
                placeholder="예: AntiGravity Core Systems"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
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

            <div className="form-group">
              <label className="form-label">프로젝트 설명 (Description)</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="프로젝트의 목적 및 개요를 작성해주세요..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isPending} style={{ flex: 1 }}>
                취소
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> 생성 중...
                  </>
                ) : (
                  '프로젝트 만들기'
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
