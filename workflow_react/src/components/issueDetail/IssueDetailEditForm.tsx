// -*- coding: utf-8 -*-
import React from 'react';
import { Save, Calendar } from 'lucide-react';
import type { Project, User, Issue, CustomFieldDefinition } from '../../types';
import {
  PrioritySelect,
  StatusSelect,
  IssueTypeSelect,
  MarkdownEditor,
} from '../common';

interface IssueDetailEditFormProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  projectId: number;
  setProjectId: (id: number) => void;
  parentId: number | null;
  setParentId: (id: number | null) => void;
  assigneeId: number | undefined;
  setAssigneeId: (id: number | undefined) => void;
  priorityId: number;
  setPriorityId: (id: number) => void;
  statusId: number;
  setStatusId: (id: number) => void;
  typeId: number;
  setTypeId: (id: number) => void;
  progress: number;
  setProgress: (progress: number) => void;
  plannedStartDate: string;
  setPlannedStartDate: (date: string) => void;
  dueDate: string;
  setDueDate: (date: string) => void;
  actualStartDate: string;
  setActualStartDate: (date: string) => void;
  actualEndDate: string;
  setActualEndDate: (date: string) => void;
  customDefs: CustomFieldDefinition[];
  customFieldsData: Record<string, any>;
  setCustomFieldsData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  projects: Project[];
  candidateParentIssues: Issue[];
  users: User[];
  isPending: boolean;
  handleUpdateIssue: (e: React.FormEvent) => Promise<void>;
  toggleEditing: (targetEditing?: boolean) => void;
}

export const IssueDetailEditForm: React.FC<IssueDetailEditFormProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  projectId,
  setProjectId,
  parentId,
  setParentId,
  assigneeId,
  setAssigneeId,
  priorityId,
  setPriorityId,
  statusId,
  setStatusId,
  typeId,
  setTypeId,
  progress,
  setProgress,
  plannedStartDate,
  setPlannedStartDate,
  dueDate,
  setDueDate,
  actualStartDate,
  setActualStartDate,
  actualEndDate,
  setActualEndDate,
  customDefs,
  customFieldsData,
  setCustomFieldsData,
  projects,
  candidateParentIssues,
  users,
  isPending,
  handleUpdateIssue,
  toggleEditing,
}) => {
  return (
    <form onSubmit={handleUpdateIssue} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">제목 *</label>
        <input
          type="text"
          className="input-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">프로젝트</label>
          <select
            className="input-field"
            value={projectId}
            onChange={(e) => setProjectId(Number(e.target.value))}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">상위 이슈 (Parent Issue)</label>
          <select
            className="input-field"
            value={parentId || ''}
            onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">-- 없음 (최상위 이슈) --</option>
            {candidateParentIssues.map((pIssue) => (
              <option key={pIssue.id} value={pIssue.id}>
                #{pIssue.id} {pIssue.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">담당자</label>
          <select
            className="input-field"
            value={assigneeId || ''}
            onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">미지정</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ? `${u.name} (${u.email})` : u.email}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">이슈 유형</label>
          <IssueTypeSelect value={typeId} onChange={setTypeId} />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">우선순위</label>
          <PrioritySelect value={priorityId} onChange={setPriorityId} />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">상태</label>
          <StatusSelect value={statusId} onChange={setStatusId} />
        </div>
      </div>

      {/* Schedule Dates Editing */}
      <div style={{ background: '#252526', border: '1px solid #3c3c3c', padding: '8px 10px', borderRadius: 'var(--radius-xs)', marginTop: '2px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={13} /> 일정 및 기한 설정
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">시작 계획일</label>
            <input
              type="date"
              className="input-field"
              value={plannedStartDate}
              onChange={(e) => setPlannedStartDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">기한 (만료일)</label>
            <input
              type="date"
              className="input-field"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">실제 시작일</label>
            <input
              type="date"
              className="input-field"
              value={actualStartDate}
              onChange={(e) => setActualStartDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">실제 종료일</label>
            <input
              type="date"
              className="input-field"
              value={actualEndDate}
              onChange={(e) => setActualEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>진척도: {progress}%</label>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>0% ~ 100%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--primary)', height: '5px' }}
        />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">상세 내용 (마크다운)</label>
        <MarkdownEditor
          value={description}
          onChange={setDescription}
          placeholder="이슈 상세 설명 (GFM Markdown 지원)"
          minHeight="140px"
        />
      </div>

      {/* Custom Fields Edit Section */}
      {customDefs.length > 0 && (
        <div style={{ background: '#252526', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid #3c3c3c' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginBottom: '6px', fontWeight: 600 }}>
            ⚙️ 커스텀 필드 설정
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
            {customDefs.map((def) => (
              <div key={def.id} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>
                  {def.name} {def.isRequired && <span style={{ color: '#f14c4c' }}>*</span>}
                </label>
                <input
                  type={def.fieldType === 'NUMBER' ? 'number' : def.fieldType === 'DATE' ? 'date' : 'text'}
                  className="input-field"
                  style={{ height: '26px', fontSize: '0.75rem' }}
                  value={customFieldsData[def.key] ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCustomFieldsData((prev) => ({ ...prev, [def.key]: v }));
                  }}
                  required={def.isRequired}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => toggleEditing(false)}
        >
          취소
        </button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
          <Save size={13} /> {isPending ? '저장 중...' : '저장 완료'}
        </button>
      </div>
    </form>
  );
};