import React, { useState } from 'react';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';
import { useModalLayer } from '@/hooks/useModalLayer';
import { Portal } from '@/components/common/Portal';
import { UserPlus, X, Send, Copy, Check, KeyRound } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { createWorkspaceInvitation, joinWorkspaceByToken } from '@/api/workspaces';

interface WorkspaceInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-xs)',
  color: 'var(--text-bright)',
  fontSize: '0.8rem',
  outline: 'none',
};

const alertErrorStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: '0.75rem',
  backgroundColor: 'rgba(241, 76, 76, 0.12)',
  border: '1px solid var(--accent-rose)',
  color: 'var(--status-urgent)',
  borderRadius: 'var(--radius-xs)',
};

const alertSuccessStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: '0.75rem',
  backgroundColor: 'rgba(78, 201, 176, 0.12)',
  border: '1px solid var(--secondary)',
  color: 'var(--secondary)',
  borderRadius: 'var(--radius-xs)',
};

export const WorkspaceInviteModal: React.FC<WorkspaceInviteModalProps> = ({ isOpen, onClose }) => {
  const { currentWorkspace, refetchWorkspaces } = useWorkspace();
  const { zIndex: dynamicZIndex } = useModalLayer(isOpen, { onClose });
  const overlayProps = useOverlayClickClose(onClose);

  const [activeTab, setActiveTab] = useState<'invite' | 'join'>('invite');

  // Tab 1: Invite State
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'GUEST'>('MEMBER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Tab 2: Join by Token State
  const [joinToken, setJoinToken] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !currentWorkspace) {
      setError('초대할 사용자의 이메일을 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMsg(null);
      setGeneratedInviteLink(null);

      const res = await createWorkspaceInvitation(currentWorkspace.id, {
        email: email.trim(),
        role,
      });

      if (res.directJoined) {
        setSuccessMsg(res.message);
        setEmail('');
        setTimeout(() => onClose(), 1800);
      } else if (res.inviteToken) {
        const fullLink = `${window.location.origin}/#/invite?token=${res.inviteToken}`;
        setGeneratedInviteLink(fullLink);
        setSuccessMsg('신규 사용자를 위한 초대 링크가 생성되었습니다.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '초대장 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedInviteLink) return;
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinToken.trim()) {
      setJoinError('초대 토큰 또는 링크를 입력해 주세요.');
      return;
    }

    let cleanToken = joinToken.trim();
    if (cleanToken.includes('token=')) {
      const match = cleanToken.match(/token=([a-zA-Z0-9]+)/);
      if (match) cleanToken = match[1];
    }

    try {
      setIsJoining(true);
      setJoinError(null);
      setJoinSuccess(null);

      const res = await joinWorkspaceByToken(cleanToken);
      setJoinSuccess(res.message || '워크스페이스에 성공적으로 참가했습니다!');
      refetchWorkspaces();
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setJoinError(err.response?.data?.error || err.message || '워크스페이스 참가에 실패했습니다.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: dynamicZIndex,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(2px)',
          padding: '16px',
        }}
        {...overlayProps}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '440px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
          }}
        >
          {/* Modal Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-header)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                워크스페이스 초대 & 참가
              </span>
            </div>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '2px' }}>
              <X size={16} />
            </button>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-dark)' }}>
            {(['invite', 'join'] as const).map((tabKey) => {
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setActiveTab(tabKey)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? 'var(--bg-card)' : 'transparent',
                    color: isActive ? 'var(--text-bright)' : 'var(--text-sub)',
                    border: 'none',
                    borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  {tabKey === 'invite' ? '동료 초대 (이메일/링크)' : '초대 코드로 참가'}
                </button>
              );
            })}
          </div>

          {activeTab === 'invite' ? (
            <form onSubmit={handleInviteSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {error && <div style={alertErrorStyle}>{error}</div>}
              {successMsg && <div style={alertSuccessStyle}>{successMsg}</div>}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
                  대상 워크스페이스
                </label>
                <div style={{ padding: '7px 10px', background: 'var(--bg-dark)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{currentWorkspace?.icon || '🏢'}</span>
                  <span>{currentWorkspace?.name}</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
                  초대할 사용자 이메일 <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
                  부여할 권한
                </label>
                <select value={role} onChange={(e) => setRole(e.target.value as any)} style={inputStyle}>
                  <option value="MEMBER">MEMBER (일반 구성원 - 프로젝트/일감 관리 가능)</option>
                  <option value="ADMIN">ADMIN (관리자 - 멤버 초대 및 설정 관리 가능)</option>
                  <option value="GUEST">GUEST (게스트 - 읽기 전용)</option>
                </select>
              </div>

              {generatedInviteLink && (
                <div style={{ marginTop: '4px', padding: '10px', background: 'var(--bg-dark)', border: '1px dashed var(--primary)', borderRadius: 'var(--radius-xs)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                    🔗 초대 링크가 생성되었습니다. 상대방에게 전달하세요:
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteLink}
                      style={{ flex: 1, padding: '4px 8px', background: 'var(--bg-input)', border: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '0.72rem', fontFamily: 'monospace', borderRadius: 'var(--radius-xs)' }}
                    />
                    <button type="button" onClick={handleCopyLink} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copied ? '복사됨' : '복사'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '5px 12px' }}>
                  닫기
                </button>
                <button type="submit" disabled={isSubmitting || !email.trim()} className="btn btn-primary" style={{ padding: '5px 14px' }}>
                  <Send size={12} />
                  <span>{isSubmitting ? '초대 중...' : '초대 발송 / 링크 생성'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoinSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {joinError && <div style={alertErrorStyle}>{joinError}</div>}
              {joinSuccess && <div style={alertSuccessStyle}>{joinSuccess}</div>}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
                  초대 토큰 또는 링크 붙여넣기 <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 4f8a9e... 또는 초대 전체 URL"
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value)}
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  전달받은 초대 코드나 링크를 입력하면 현재 서버 워크스페이스에 즉시 멤버로 참가합니다.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '5px 12px' }}>
                  취소
                </button>
                <button type="submit" disabled={isJoining || !joinToken.trim()} className="btn btn-primary" style={{ padding: '5px 14px' }}>
                  <KeyRound size={12} />
                  <span>{isJoining ? '참가 중...' : '워크스페이스 참가하기'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Portal>
  );
};
