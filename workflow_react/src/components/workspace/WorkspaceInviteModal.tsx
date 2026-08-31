// -*- coding: utf-8 -*-
import React, { useState } from 'react';
import { UserPlus, X, Send, Copy, Check, KeyRound } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { createWorkspaceInvitation, joinWorkspaceByToken } from '@/api/workspaces';

interface WorkspaceInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceInviteModal: React.FC<WorkspaceInviteModalProps> = ({ isOpen, onClose }) => {
  const { currentWorkspace, switchWorkspace, refetchWorkspaces } = useWorkspace();

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

  // 1. 초대 생성 핸들러
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
        setTimeout(() => {
          onClose();
        }, 1800);
      } else if (res.inviteToken) {
        const fullLink = `${window.location.origin}/#/invite?token=${res.inviteToken}`;
        setGeneratedInviteLink(fullLink);
        setSuccessMsg(`신규 사용자를 위한 초대 링크가 생성되었습니다.`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '초대장 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. 링크 복사
  const handleCopyLink = () => {
    if (!generatedInviteLink) return;
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 3. 초대 코드로 참가
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinToken.trim()) {
      setJoinError('초대 토큰 또는 링크를 입력해 주세요.');
      return;
    }

    // URL에서 토큰 파싱 지원
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
      setTimeout(() => {
        switchWorkspace(res.workspace.id);
        onClose();
      }, 1500);
    } catch (err: any) {
      setJoinError(err.response?.data?.error || err.message || '워크스페이스 참가에 실패했습니다.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(2px)',
        padding: '16px',
      }}
    >
      <div
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--bg-header)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              워크스페이스 초대 & 참가
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: '2px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--bg-dark)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('invite')}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.78rem',
              fontWeight: activeTab === 'invite' ? 600 : 400,
              background: activeTab === 'invite' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'invite' ? 'var(--text-bright)' : 'var(--text-sub)',
              border: 'none',
              borderBottom: activeTab === 'invite' ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            동료 초대 (이메일/링크)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.78rem',
              fontWeight: activeTab === 'join' ? 600 : 400,
              background: activeTab === 'join' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'join' ? 'var(--text-bright)' : 'var(--text-sub)',
              border: 'none',
              borderBottom: activeTab === 'join' ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            초대 코드로 참가
          </button>
        </div>

        {/* Tab 1: Invite Form */}
        {activeTab === 'invite' ? (
          <form onSubmit={handleInviteSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {error && (
              <div
                style={{
                  padding: '8px 10px',
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(241, 76, 76, 0.12)',
                  border: '1px solid var(--accent-rose)',
                  color: '#ff8080',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                {error}
              </div>
            )}
            {successMsg && (
              <div
                style={{
                  padding: '8px 10px',
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(78, 201, 176, 0.12)',
                  border: '1px solid var(--secondary)',
                  color: 'var(--secondary)',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                {successMsg}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
                대상 워크스페이스
              </label>
              <div
                style={{
                  padding: '7px 10px',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
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
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-bright)',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
                부여할 권한
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-bright)',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              >
                <option value="MEMBER">MEMBER (일반 구성원 - 프로젝트/일감 관리 가능)</option>
                <option value="ADMIN">ADMIN (관리자 - 멤버 초대 및 설정 관리 가능)</option>
                <option value="GUEST">GUEST (게스트 - 읽기 전용)</option>
              </select>
            </div>

            {/* Generated Link Box */}
            {generatedInviteLink && (
              <div
                style={{
                  marginTop: '4px',
                  padding: '10px',
                  background: 'var(--bg-dark)',
                  border: '1px dashed var(--primary)',
                  borderRadius: 'var(--radius-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                  🔗 초대 링크가 생성되었습니다. 상대방에게 전달하세요:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteLink}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-main)',
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      borderRadius: 'var(--radius-xs)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? '복사됨' : '복사'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: '5px 12px' }}
              >
                닫기
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="btn btn-primary"
                style={{ padding: '5px 14px' }}
              >
                <Send size={12} />
                <span>{isSubmitting ? '초대 중...' : '초대 발송 / 링크 생성'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Tab 2: Join by Token Form */
          <form onSubmit={handleJoinSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {joinError && (
              <div
                style={{
                  padding: '8px 10px',
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(241, 76, 76, 0.12)',
                  border: '1px solid var(--accent-rose)',
                  color: '#ff8080',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                {joinError}
              </div>
            )}
            {joinSuccess && (
              <div
                style={{
                  padding: '8px 10px',
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(78, 201, 176, 0.12)',
                  border: '1px solid var(--secondary)',
                  color: 'var(--secondary)',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                {joinSuccess}
              </div>
            )}

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
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-bright)',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                전달받은 초대 코드나 링크를 입력하면 해당 워크스페이스에 즉시 멤버로 참가합니다.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: '5px 12px' }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isJoining || !joinToken.trim()}
                className="btn btn-primary"
                style={{ padding: '5px 14px' }}
              >
                <KeyRound size={12} />
                <span>{isJoining ? '참가 중...' : '워크스페이스 참가하기'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
