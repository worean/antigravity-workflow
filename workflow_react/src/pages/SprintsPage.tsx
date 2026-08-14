import React, { useState, useEffect } from 'react';
import type { Sprint, Project } from '../types';
import { getSprints, getProjects, createSprint } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Target, Zap } from 'lucide-react';
import { Button, Card, Spinner, StatusBadge, ProjectBadge } from '../components/common';

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
          <Zap size={14} color="#cca700" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            스프린트 관리 ({sprints.length})
          </span>
        </div>

        {isAuthenticated && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={12} />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '닫기' : '스프린트 생성'}
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
            onSubmit={handleCreateSprint}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              새 스프린트 추가
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">스프린트 이름</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예: Sprint 1 - Core API"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
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
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">목표 (Goal)</label>
              <input
                type="text"
                className="input-field"
                placeholder="예: 사용자 인증 및 이슈 관리 핵심 로직 배포"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>
                취소
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                생성
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <Spinner centered label="스프린트 불러오는 중..." />
      ) : sprints.length === 0 ? (
        <Card variant="glass" padding="24px" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          등록된 스프린트가 없습니다.
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
          {sprints.map((s) => (
            <div
              key={s.id}
              style={{
                background: '#252526',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-bright)' }}>
                  {s.name}
                </span>
                <StatusBadge status={s.status} size="sm" />
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Target size={12} color="#cca700" />
                <span>{s.goal || '설정된 목표 없음'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid #383838', paddingTop: '4px', marginTop: '2px' }}>
                <ProjectBadge project={s.project} projectId={s.projectId} size="sm" />
                <span>{s._count?.issues ?? 0}개 이슈</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
