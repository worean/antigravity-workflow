import React from 'react';
import { Clock, Plus } from 'lucide-react';
import type { Worklog } from '@/types';
import { Avatar } from '@/components/common';
import { formatWorklogTime } from '@/utils/worklogUtils';

interface IssueWorklogsProps {
  worklogs: Worklog[];
  isAuthenticated: boolean;
  showWorklogForm: boolean;
  setShowWorklogForm: (show: boolean) => void;
  worklogHoursInput: string;
  setWorklogHoursInput: (hours: string) => void;
  worklogDescInput: string;
  setWorklogDescInput: (desc: string) => void;
  isLoggingWork: boolean;
  handleCreateWorklog: (e: React.FormEvent) => Promise<void>;
  currentUserId?: number;
}

export const IssueWorklogs: React.FC<IssueWorklogsProps> = ({
  worklogs,
  isAuthenticated,
  showWorklogForm,
  setShowWorklogForm,
  worklogHoursInput,
  setWorklogHoursInput,
  worklogDescInput,
  setWorklogDescInput,
  isLoggingWork,
  handleCreateWorklog,
  currentUserId: _currentUserId,
}) => {
  const totalSpentMinutes = worklogs.reduce((acc, curr) => acc + Number(curr.timeSpent || 0), 0);

  return (
    <div className="glass-panel" style={{ padding: '12px 14px', marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={15} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            작업 시간 기록 (Worklogs)
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', background: 'rgba(0,122,204,0.15)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
            총 {formatWorklogTime(totalSpentMinutes)}
          </span>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowWorklogForm(!showWorklogForm)}
            style={{ fontSize: '0.7rem', height: '22px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={11} /> {showWorklogForm ? '입력 닫기' : '작업 시간 등록'}
          </button>
        )}
      </div>

      {showWorklogForm && (
        <form onSubmit={handleCreateWorklog} style={{ background: '#252526', border: '1px solid #3c3c3c', padding: '8px 10px', borderRadius: 'var(--radius-xs)', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '6px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>소요 시간 (시간) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="24"
                className="input-field"
                style={{ height: '26px', fontSize: '0.75rem' }}
                value={worklogHoursInput}
                onChange={(e) => setWorklogHoursInput(e.target.value)}
                placeholder="예: 1.5"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>작업 내용 / 비고 (선택)</label>
              <input
                type="text"
                className="input-field"
                style={{ height: '26px', fontSize: '0.75rem' }}
                value={worklogDescInput}
                onChange={(e) => setWorklogDescInput(e.target.value)}
                placeholder="어떤 작업을 진행했는지 간단히 입력하세요"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ height: '26px', fontSize: '0.72rem' }}
              disabled={isLoggingWork}
            >
              {isLoggingWork ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      )}

      {worklogs.length === 0 ? (
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
          기록된 작업 시간이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {worklogs.map((w) => (
            <div
              key={w.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                background: '#252526',
                border: '1px solid #333',
                borderRadius: '2px',
                fontSize: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar user={w.user} name={w.user?.name || ''} size={20} shape="circle" />
                <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{w.user?.name || '사용자'}</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>+{formatWorklogTime(w.timeSpent)}</span>
                {w.description && (
                  <span style={{ color: 'var(--text-sub)' }}>- {w.description}</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {new Date(w.startedAt || w.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};