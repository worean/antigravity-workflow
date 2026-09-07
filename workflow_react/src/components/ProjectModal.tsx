﻿import React, { useState } from 'react';
import { createProject } from '@/services/api';
import { FolderPlus, Hash, Globe, ShieldCheck, Lock } from 'lucide-react';
import { useActionFeedback } from '@/hooks/useActionFeedback';
import { ActionFeedbackModal } from './ActionFeedbackModal';
import { ModalWrapper, Button, TagInput } from './common';
import type { Project, ProjectVisibility } from '@/types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProject: Project) => void;
}

const VISIBILITY_OPTIONS: Array<{
  value: ProjectVisibility;
  label: string;
  icon: React.ElementType;
  desc: string;
}> = [
  {
    value: 'PUBLIC',
    label: '전체 공개 (Public)',
    icon: Globe,
    desc: '누구나 프로젝트를 열람하고 이슈에 참여할 수 있습니다.',
  },
  {
    value: 'PROTECTED',
    label: '부서/그룹 한정 (Protected)',
    icon: ShieldCheck,
    desc: '프로젝트 멤버 및 지정 부서/그룹 소속 팀원만 접근할 수 있습니다.',
  },
  {
    value: 'PRIVATE',
    label: '비공개 (Private)',
    icon: Lock,
    desc: '프로젝트 소유자와 직접 등록된 멤버만 접근할 수 있습니다.',
  },
];

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [visibility, setVisibility] = useState<ProjectVisibility>('PUBLIC');
  const [tags, setTags] = useState<string[]>([]);

  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await executeAction(
      async () => {
        return await createProject({
          name,
          key: key.toUpperCase(),
          description,
          visibility,
          tags,
        });
      },
      {
        onSuccess: (createdProject) => {
          setName('');
          setKey('');
          setDescription('');
          setVisibility('PUBLIC');
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
        maxWidth="480px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

          {/* 🔒 공개 범위 설정 (Visibility) */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <span>접근 및 공개 범위</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {VISIBILITY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = visibility === opt.value;
                return (
                  <label
                    key={opt.value}
                    onClick={() => setVisibility(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-xs)',
                      background: isSelected ? 'rgba(0, 122, 204, 0.12)' : 'var(--bg-card-hover)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="project-visibility"
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => setVisibility(opt.value)}
                      style={{ marginTop: '2px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 600, color: isSelected ? 'var(--primary-light, #3794ff)' : 'var(--text-bright)' }}>
                        <Icon size={13} />
                        <span>{opt.label}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                        {opt.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
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

          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
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
