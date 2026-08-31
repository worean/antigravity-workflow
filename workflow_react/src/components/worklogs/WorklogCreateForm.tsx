// -*- coding: utf-8 -*-
import React from 'react';
import type { Issue } from '@/types';
import { Button } from '@/components/common';
import { hoursToMinutes } from '@/utils/worklogUtils';

interface WorklogCreateFormProps {
  issues: Issue[];
  issueId: number;
  setIssueId: (id: number) => void;
  hoursInput: string;
  setHoursInput: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

export const WorklogCreateForm: React.FC<WorklogCreateFormProps> = ({
  issues,
  issueId,
  setIssueId,
  hoursInput,
  setHoursInput,
  description,
  setDescription,
  submitting,
  onSubmit,
  onCancel,
}) => {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        padding: '10px 12px',
      }}
    >
      <form style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} onSubmit={onSubmit}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
          작업 시간 기록 추가
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">대상 이슈 (Issue)</label>
            <select
              className="input-field"
              value={issueId}
              onChange={(e) => setIssueId(Number(e.target.value))}
            >
              {issues.map((i) => (
                <option key={i.id} value={i.id}>
                  #{i.id} - {i.title}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">소요 시간 (시간 단위, 예: 1.4 또는 5.5)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              className="input-field"
              placeholder="예: 1.4 또는 5.5"
              value={hoursInput}
              onChange={(e) => setHoursInput(e.target.value)}
              required
            />
          </div>
        </div>

        {hoursInput && !isNaN(parseFloat(hoursInput)) && parseFloat(hoursInput) > 0 && (
          <div style={{ fontSize: '0.72rem', color: '#9cdcfe' }}>
            💡 <strong>{hoursInput}시간</strong> ➔ DB에 <strong>{hoursToMinutes(parseFloat(hoursInput))}분</strong>으로 자동 환산 저장
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">작업 내용 요약</label>
          <input
            type="text"
            className="input-field"
            placeholder="예: API 엔드포인트 구현 및 테스트 진행"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
            기록 저장
          </Button>
        </div>
      </form>
    </div>
  );
};