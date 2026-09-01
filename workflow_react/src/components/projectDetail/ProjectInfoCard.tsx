import React from 'react';
import type { Project } from '@/types';
import { MarkdownViewer, MarkdownEditor } from '@/components/common';

interface ProjectInfoCardProps {
  project: Project;
  isEditing: boolean;
  editName: string;
  setEditName: (name: string) => void;
  editKey: string;
  setEditKey: (key: string) => void;
  editDescription: string;
  setEditDescription: (desc: string) => void;
}

export const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({
  project,
  isEditing,
  editName,
  setEditName,
  editKey,
  setEditKey,
  editDescription,
  setEditDescription,
}) => {
  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
      }}
    >
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                프로젝트 이름 *
              </label>
              <input
                type="text"
                className="input-field"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="프로젝트 이름을 입력하세요"
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ width: '140px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                식별 키 (Key) *
              </label>
              <input
                type="text"
                className="input-field"
                value={editKey}
                onChange={(e) => setEditKey(e.target.value.toUpperCase())}
                placeholder="KEY"
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
              프로젝트 설명 및 개요
            </label>
            <MarkdownEditor
              value={editDescription}
              onChange={setEditDescription}
              placeholder="프로젝트의 목적, 목표 및 범위를 마크다운으로 작성하세요..."
              minHeight="140px"
            />
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-bright)', margin: 0 }}>
              {project.name}
            </h2>
          </div>
          {project.description ? (
            <MarkdownViewer content={project.description} />
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
              등록된 프로젝트 설명이 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};