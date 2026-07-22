import React, { useEffect, useState } from 'react';

interface Props {
  token: string;
  user: any;
  onLogout: () => void;
}

export const Dashboard: React.FC<Props> = ({ token, user, onLogout }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<string>('연결 대기중');

  // 모달 & 폼 상태
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // 프로젝트 생성 폼
  const [projectName, setProjectName] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  // 이슈 생성 폼
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | string>('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. 프로젝트 및 이슈 목록 가져오기
  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/projects/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/issues/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/health');
      const data = await res.json();
      if (data.status === 'OK') setServerStatus('workflow_server 정상 동작중');
    } catch {
      setServerStatus('workflow_server 연결 실패');
    }
  };

  useEffect(() => {
    checkHealth();
    fetchProjects();
    fetchIssues();
  }, []);

  // 2. ➕ 새 프로젝트 생성 핸들러 (JWT authorization)
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch('http://localhost:4000/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: projectName,
          key: projectKey || projectName.slice(0, 3).toUpperCase(),
          description: projectDesc
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '프로젝트 생성 실패');

      setMessage({ type: 'success', text: `✨ 프로젝트 '${data.name}' (${data.key})가 생성되었습니다!` });
      setProjectName('');
      setProjectKey('');
      setProjectDesc('');
      setShowProjectModal(false);
      fetchProjects();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // 3. ➕ 새 이슈 생성 핸들러 (JWT authorization)
  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedProjectId && projects.length === 0) {
      setMessage({ type: 'error', text: '이슈를 생성하려면 먼저 프로젝트를 하나 생성해주세요.' });
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/issues/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: issueTitle,
          description: issueDesc,
          projectId: Number(selectedProjectId || (projects[0] && projects[0].id))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '이슈 생성 실패');

      setMessage({ type: 'success', text: `🎉 이슈 '${data.title}'가 성공적으로 등록되었습니다!` });
      setIssueTitle('');
      setIssueDesc('');
      setShowIssueModal(false);
      fetchIssues();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div style={{ maxWidth: '960px', width: '100%', padding: '12px 0' }}>
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="pulse-badge online" style={{ marginBottom: '8px' }}>
            🟢 {serverStatus}
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 600 }}>안녕하세요, {user.name}님!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{user.email}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowProjectModal(true)}
            className="btn-gradient"
            style={{ padding: '10px 16px', fontSize: '13px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
          >
            ➕ 새 프로젝트
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="btn-gradient"
            style={{ padding: '10px 16px', fontSize: '13px' }}
          >
            ➕ 새 이슈
          </button>

          <button onClick={onLogout} style={{
            background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)',
            color: 'white', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer'
          }}>
            로그아웃
          </button>
        </div>
      </div>

      {/* 알림 메시지 */}
      {message && (
        <div style={{
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: message.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          color: message.type === 'success' ? '#34d399' : '#f87171',
          padding: '14px 18px', borderRadius: '12px', fontSize: '14px', marginBottom: '20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>{message.text}</div>
          <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* 🚀 1. 새 프로젝트 생성 폼 (모달/카드형) */}
      {showProjectModal && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#34d399' }}>📁 내 새 프로젝트 생성</h3>
          <form onSubmit={handleCreateProject}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>프로젝트 이름 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="예: AntiGravity Web App"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>프로젝트 Key *</label>
                <input
                  type="text"
                  className="input-field"
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                  placeholder="예: AGY"
                  maxLength={10}
                  required
                />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>프로젝트 설명</label>
              <textarea
                className="input-field"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="프로젝트 상세 목적 및 주요 지표를 입력하세요."
                rows={2}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowProjectModal(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>취소</button>
              <button type="submit" className="btn-gradient" style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>프로젝트 생성 완료</button>
            </div>
          </form>
        </div>
      )}

      {/* 🚀 2. 새 이슈 생성 폼 (모달/카드형) */}
      {showIssueModal && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px', border: '1px solid rgba(66, 133, 244, 0.4)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#60a5fa' }}>✏️ 내 계정으로 새 이슈 작성</h3>
          <form onSubmit={handleCreateIssue}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>연동 프로젝트 선택 *</label>
              <select
                className="input-field"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)' }}
              >
                {projects.length === 0 && <option value="">프로젝트가 없습니다 (먼저 프로젝트 생성 필요)</option>}
                {projects.map(p => (
                  <option key={p.id} value={p.id}>[{p.key}] {p.name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>이슈 제목 *</label>
              <input
                type="text"
                className="input-field"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="예: 구글 OAuth 토큰 검증 로직 추가"
                required
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>상세 설명</label>
              <textarea
                className="input-field"
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                placeholder="이슈에 대한 상세 수행 작업이나 지침을 입력하세요."
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowIssueModal(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>취소</button>
              <button type="submit" className="btn-gradient" style={{ padding: '8px 20px' }}>이슈 등록 완료</button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--text-primary)' }}>📂 내 프로젝트 목록 ({projects.length})</h3>
        {projects.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>등록된 프로젝트가 없습니다. '➕ 새 프로젝트' 버튼으로 추가해보세요.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {projects.map(p => (
              <div key={p.id} style={{
                background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{p.key}</span>
                <h4 style={{ fontSize: '15px', marginTop: '6px', fontWeight: 600 }}>{p.name}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{p.description || '설명 없음'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issues List from Backend */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>📋 내 이슈 목록 ({issues.length})</h3>
          <button onClick={() => { fetchProjects(); fetchIssues(); }} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>
            {loading ? '새로고침 중...' : '🔄 목록 새로고침'}
          </button>
        </div>

        {issues.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
            등록된 이슈가 없습니다. 상단의 '➕ 새 이슈' 버튼으로 이슈를 추가해보세요.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {issues.map(issue => (
              <div key={issue.id} style={{
                background: 'rgba(255, 255, 255, 0.04)', padding: '16px', borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '600', fontSize: '16px' }}>{issue.title}</div>
                  <span style={{ fontSize: '11px', background: 'rgba(66, 133, 244, 0.2)', color: '#60a5fa', padding: '3px 8px', borderRadius: '4px' }}>
                    Project #{issue.projectId}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
                  {issue.description || '설명 없음'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
