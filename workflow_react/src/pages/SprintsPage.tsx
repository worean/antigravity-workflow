import React, { useState, useEffect } from 'react';
import type { Sprint, Project } from '../types';
import { getSprints, getProjects, createSprint } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Target, Layers } from 'lucide-react';

export const SprintsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [showForm, setShowForm] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [projectId, setProjectId] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sData, pData] = await Promise.all([getSprints(), getProjects()]);
      setSprints(sData);
      setProjects(pData);
      if (pData.length > 0) setProjectId(pData[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      await createSprint({ name, goal, projectId });
      setName('');
      setGoal('');
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '스프린트 생성 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>스프린트 관리 (Sprints)</h2>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
            프로젝트 목표를 설정하고 이터레이션(Iteration) 단위 작업을 관리합니다.
          </p>
        </div>

        {isAuthenticated && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> {showForm ? '닫기' : '새 스프린트 시작'}
          </button>
        )}
      </div>

      {showForm && (
        <form
          className="glass-panel"
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          onSubmit={handleCreateSprint}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>신규 스프린트 생성</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">스프린트 이름</label>
              <input
                type="text"
                className="input-field"
                placeholder="예: Sprint 1 - Core Auth API"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">대상 프로젝트</label>
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
          </div>
          <div className="form-group">
            <label className="form-label">스프린트 목표 (Goal)</label>
            <input
              type="text"
              className="input-field"
              placeholder="예: 회원가입 및 JWT 토큰 기반 인가 시스템 구현 완료"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>
              취소
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? '생성 중...' : '스프린트 생성'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          스프린트 데이터 불러오는 중...
        </div>
      ) : sprints.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          등록된 활성 스프린트가 없습니다.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {sprints.map((s) => (
            <div key={s.id} className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="badge badge-in-progress">ACTIVE</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{s.id}</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>{s.name}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
                <Target size={14} style={{ display: 'inline', marginRight: '4px' }} />
                목표: {s.goal || '설정된 목표가 없습니다.'}
              </p>
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Layers size={14} style={{ display: 'inline', marginRight: '4px' }} /> 프로젝트 ID: #{s.projectId}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
