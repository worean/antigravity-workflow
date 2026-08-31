// -*- coding: utf-8 -*-
import React from 'react';
import { Calendar, Sparkles, X } from 'lucide-react';
import type { Sprint, Project } from '@/types';
import { Button } from '@/components/common';

interface SprintFormModalProps {
  showFormModal: boolean;
  setShowFormModal: (show: boolean) => void;
  editingSprint: Sprint | null;
  formName: string;
  setFormName: (name: string) => void;
  formGoal: string;
  setFormGoal: (goal: string) => void;
  formProjectId: number;
  setFormProjectId: (id: number) => void;
  formStartDate: string;
  setFormStartDate: (date: string) => void;
  formEndDate: string;
  setFormEndDate: (date: string) => void;
  formStatus: string;
  setFormStatus: (status: string) => void;
  formSubmitting: boolean;
  projects: Project[];
  applyDatePreset: (weeks: number) => void;
  handleAutoFillDatesFromProject: () => Promise<void>;
  handleSubmitForm: (e: React.FormEvent) => Promise<void>;
}

export const SprintFormModal: React.FC<SprintFormModalProps> = ({
  showFormModal,
  setShowFormModal,
  editingSprint,
  formName,
  setFormName,
  formGoal,
  setFormGoal,
  formProjectId,
  setFormProjectId,
  formStartDate,
  setFormStartDate,
  formEndDate,
  setFormEndDate,
  formStatus,
  setFormStatus,
  formSubmitting,
  projects,
  applyDatePreset,
  handleAutoFillDatesFromProject,
  handleSubmitForm,
}) => {
  if (!showFormModal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={() => setShowFormModal(false)}
    >
      <div
        style={{
          background: '#1e1e1e',
          border: '1px solid #3c3c3c',
          borderRadius: 'var(--radius-sm)',
          width: '100%',
          maxWidth: '480px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333333', paddingBottom: '10px' }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-bright)' }}>
            {editingSprint ? '스프린트 수정' : '새 스프린트 생성'}
          </span>
          <button
            onClick={() => setShowFormModal(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">스프린트 이름 *</label>
            <input
              type="text"
              className="input-field"
              placeholder="예: 2026 Q3 Sprint 1"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">소속 프로젝트 *</label>
            <select
              className="input-field"
              value={formProjectId}
              onChange={(e) => setFormProjectId(Number(e.target.value))}
              disabled={!!editingSprint}
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">스프린트 목표 (Goal)</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="이번 스프린트에서 달성하고자 하는 핵심 목표"
              value={formGoal}
              onChange={(e) => setFormGoal(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Date Picker & Presets */}
          <div style={{ background: '#252526', border: '1px solid #383838', padding: '10px', borderRadius: 'var(--radius-xs)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> 기간 설정
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => applyDatePreset(1)}
                  style={{ background: '#333333', border: '1px solid #444', color: 'var(--text-sub)', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '2px', cursor: 'pointer' }}
                >
                  1주
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset(2)}
                  style={{ background: '#333333', border: '1px solid #444', color: 'var(--text-sub)', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '2px', cursor: 'pointer' }}
                >
                  2주
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset(4)}
                  style={{ background: '#333333', border: '1px solid #444', color: 'var(--text-sub)', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '2px', cursor: 'pointer' }}
                >
                  4주
                </button>
                {!editingSprint && (
                  <button
                    type="button"
                    onClick={handleAutoFillDatesFromProject}
                    style={{ background: 'rgba(204,167,0,0.15)', border: '1px solid rgba(204,167,0,0.4)', color: '#cca700', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                    title="프로젝트 내 이슈들의 시작계획일 최솟값과 기한 최댓값으로 자동 설정"
                  >
                    <Sparkles size={10} /> 이슈기반 자동계산
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>시작일</label>
                <input
                  type="date"
                  className="input-field"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>종료 기한일</label>
                <input
                  type="date"
                  className="input-field"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">진행 상태</label>
            <select
              className="input-field"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
            >
              <option value="PLANNED">계획 중 (PLANNED)</option>
              <option value="ACTIVE">진행 중 (ACTIVE)</option>
              <option value="COMPLETED">완료됨 (COMPLETED)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowFormModal(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={formSubmitting}
            >
              {editingSprint ? '수정 완료' : '스프린트 생성'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};