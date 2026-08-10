import React, { useState, useEffect } from 'react';
import type { Worklog, Issue } from '../types';
import { getWorklogs, getIssues, createWorklog } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Clock, Plus, CheckSquare } from 'lucide-react';

export const WorklogsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [showForm, setShowForm] = useState<boolean>(false);
  const [issueId, setIssueId] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(60);
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
    setSubmitting(true);

    try {
      await createWorklog({
        issueId,
        timeSpentMinutes: minutes,
        description,
      });
      setDescription('');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>작업 로그 (Worklogs)</h2>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
            이슈별 소요 시간 및 작업 내역을 기록하여 생산성을 관리합니다.
          </p>
        </div>

        {isAuthenticated && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> {showForm ? '닫기' : '작업 시간 기록'}
          </button>
        )}
      </div>

      {showForm && (
        <form
          className="glass-panel"
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          onSubmit={handleCreateWorklog}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>작업 시간 기록 추가</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
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
            <div className="form-group">
              <label className="form-label">소요 시간 (분 단위)</label>
              <input
                type="number"
                className="input-field"
                placeholder="60"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                min={1}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">작업 내용 요약</label>
            <input
              type="text"
              className="input-field"
              placeholder="예: 데이터베이스 마이그레이션 스크립트 검증 및 테스트 진행"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>
              취소
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? '저장 중...' : '기록 저장'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          작업 로그 불러오는 중...
        </div>
      ) : worklogs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          등록된 작업 로그가 없습니다.
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {worklogs.map((w) => (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckSquare size={16} color="var(--primary)" />
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      이슈 #{w.issueId} {w.issue?.title ? `- ${w.issue.title}` : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)' }}>
                    {w.description || '작업내용 미작성'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--secondary)' }}>
                      <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      {Math.floor(w.timeSpentMinutes / 60)}h {w.timeSpentMinutes % 60}m
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      작성자: {w.user?.name || w.user?.email || `User #${w.userId}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
