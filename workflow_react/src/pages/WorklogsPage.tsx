import React, { useState, useEffect } from 'react';
import type { Worklog, Issue } from '../types';
import { getWorklogs, getIssues, createWorklog } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Clock, Plus, CheckSquare } from 'lucide-react';
import { Button, Card, Spinner, UserBadge } from '../components/common';
import { hoursToMinutes, formatWorklogTime } from '../utils/worklogUtils';

export const WorklogsPage: React.FC = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [showForm, setShowForm] = useState<boolean>(false);
  const [issueId, setIssueId] = useState<number>(1);
  const [hoursInput, setHoursInput] = useState<string>('1.0');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wData, iData] = await Promise.all([getWorklogs(), getIssues()]);
      setWorklogs(wData);
      setIssues(iData);
      if (iData.length > 0) setIssueId(iData[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWorklog = async (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(hoursInput);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('유효한 작업 시간(시간 단위, 예: 1.4 또는 5.5)을 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const calculatedMinutes = hoursToMinutes(hoursNum);
      await createWorklog({
        issueId,
        timeSpent: calculatedMinutes,
        timeSpentHours: hoursNum,
        description,
      });
      setDescription('');
      setHoursInput('1.0');
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '작업 로그 등록 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Header Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={14} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            작업 로그 (Worklogs - {worklogs.length}건)
          </span>
        </div>

        {isAuthenticated && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={12} />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '닫기' : '작업 시간 기록'}
          </Button>
        )}
      </div>

      {showForm && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '10px 12px',
          }}
        >
          <form
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            onSubmit={handleCreateWorklog}
          >
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
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>
                취소
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                기록 저장
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <Spinner centered label="작업 로그 불러오는 중..." />
      ) : worklogs.length === 0 ? (
        <Card variant="glass" padding="24px" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          등록된 작업 로그가 없습니다.
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {worklogs.map((w) => (
            <div
              key={w.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: 'var(--radius-xs)',
                background: '#252526',
                border: '1px solid var(--border-light)',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <CheckSquare size={13} color="var(--primary)" />
                <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                  #{w.issueId} {w.issue?.title ? `- ${w.issue.title}` : ''}
                </span>
                <span style={{ color: 'var(--text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                  {w.description ? `| ${w.description}` : ''}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--secondary)' }}>
                  <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />
                  {formatWorklogTime(w.timeSpent)}
                </div>
                <UserBadge user={w.user} currentUserId={currentUser?.id} size="sm" />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {new Date(w.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
