import React, { useState, useEffect } from 'react';
import { X, Calendar, Globe, User, Key, AlertCircle, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCalDavStatus, useConnectCalDav, useDisconnectCalDav, calendarKeys } from '@/api/calendar';
import { useUIStore } from '@/stores/useUIStore';
import { useModalLayer } from '@/hooks/useModalLayer';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';
import { Portal } from '@/components/common/Portal';
import { CalDavAccountCard } from './CalDavAccountCard';

interface CalDavConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalDavConnectModal: React.FC<CalDavConnectModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const { zIndex: dynamicZIndex } = useModalLayer(isOpen, { onClose });
  const overlayProps = useOverlayClickClose(onClose);

  const { data: caldavStatus, isLoading: isStatusLoading, refetch: refetchStatus } = useCalDavStatus();
  const connectMutation = useConnectCalDav();
  const disconnectMutation = useDisconnectCalDav();

  const [domain, setDomain] = useState('');
  const [useSsl, setUseSsl] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [calendarName, setCalendarName] = useState('사내 CalDAV 달력');
  const [color, setColor] = useState('#8a2be2');
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConnectResult, setLastConnectResult] = useState<{ message: string; discoveredCalendars?: string[] } | null>(null);

  useEffect(() => {
    if (caldavStatus?.isConnected) {
      const pure = caldavStatus.domain || caldavStatus.serverUrl?.replace(/^https?:\/\//i, '').replace(/\/.*$/, '') || '';
      setDomain(pure);
      setUsername(caldavStatus.username || '');
      setCalendarName(caldavStatus.calendarName || '사내 CalDAV 달력');
      setColor(caldavStatus.color || '#8a2be2');
      setUseSsl(caldavStatus.useSsl !== false);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [caldavStatus]);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLastConnectResult(null);

    const cleanDomain = domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    if (!cleanDomain || !username.trim() || !password.trim()) {
      setErrorMessage('서버 도메인(호스트), 사용자 계정, 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      const res = await connectMutation.mutateAsync({
        domain: cleanDomain,
        useSsl,
        username: username.trim(),
        password: password.trim(),
        calendarName: calendarName.trim(),
        color,
      });

      if (res.success) {
        showToast(res.message || 'CalDAV 캘린더 계정이 성공적으로 등록되었습니다!', 'success');
        setLastConnectResult({
          message: res.message,
          discoveredCalendars: res.discoveredCalendars,
        });
        setPassword('');
        setIsEditing(false);
        refetchStatus();
        queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      } else {
        setErrorMessage(res.message || 'CalDAV 서버 연결에 실패했습니다.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'CalDAV 연결 중 오류가 발생했습니다.';
      setErrorMessage(msg);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('등록된 CalDAV 캘린더 계정을 연동 해제하시겠습니까?')) return;

    try {
      await disconnectMutation.mutateAsync();
      showToast('CalDAV 계정 연동이 해제되었습니다.', 'success');
      setDomain('');
      setUsername('');
      setPassword('');
      setLastConnectResult(null);
      setIsEditing(true);
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      onClose();
    } catch (err: any) {
      showToast('연동 해제 실패: ' + (err.message || '오류가 발생했습니다.'), 'error');
    }
  };

  const activeCalendars =
    lastConnectResult?.discoveredCalendars ||
    caldavStatus?.discoveredCalendars ||
    [];

  const isConnected = Boolean(caldavStatus?.isConnected);

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: dynamicZIndex,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
        {...overlayProps}
      >
        <div
          className="animate-scale-in"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '540px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-light)',
              background: 'var(--bg-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'var(--primary-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-purple)',
                }}
              >
                <Calendar size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-bright)', margin: 0 }}>
                  CalDAV 캘린더 계정 추가 및 관리
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                  다우오피스(DaouOffice), Nextcloud 등의 외부 사내 캘린더를 계정 단위로 연결합니다.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-icon btn-sm"
              style={{ width: '26px', height: '26px', padding: 0 }}
            >
              <X size={15} />
            </button>
          </div>

          {/* 바디 */}
          <div style={{ padding: '18px', maxHeight: '78vh', overflowY: 'auto' }}>
            {isConnected && !isEditing && (
              <CalDavAccountCard
                status={caldavStatus}
                domain={domain}
                activeCalendars={activeCalendars}
                lastConnectMessage={lastConnectResult?.message}
                isDisconnectPending={disconnectMutation.isPending}
                onEdit={() => setIsEditing(true)}
                onDisconnect={handleDisconnect}
              />
            )}

            {errorMessage && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(234, 76, 76, 0.12)',
                  border: '1px solid rgba(234, 76, 76, 0.35)',
                  color: 'var(--status-urgent)',
                  fontSize: '0.76rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {(!isConnected || isEditing) && (
              <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '4px' }}>
                    <Globe size={13} />
                    서버 도메인 (Host) <span style={{ color: 'var(--status-urgent)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: hanilprotech.daouoffice.com (https/http 제외)"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', height: '32px', fontSize: '0.78rem' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={useSsl}
                        onChange={(e) => setUseSsl(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <ShieldCheck size={13} style={{ color: useSsl ? 'var(--accent-teal)' : 'var(--text-muted)' }} />
                      <span>SSL/TLS 보안 연결 사용 (권장, 포트 443)</span>
                    </label>
                  </div>
                  <span style={{ fontSize: '0.69rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    * 도메인만 입력하시면 RFC 6764 표준에 따라 사내 모든 캘린더가 자동 탐색됩니다.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '4px' }}>
                      <User size={13} />
                      사용자 계정 (ID / 이메일) <span style={{ color: 'var(--status-urgent)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: user@company.com"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', height: '32px', fontSize: '0.78rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '4px' }}>
                      <Key size={13} />
                      비밀번호 <span style={{ color: 'var(--status-urgent)' }}>*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="로그인 비밀번호"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', height: '32px', fontSize: '0.78rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                      캘린더 계정 이름
                    </label>
                    <input
                      type="text"
                      placeholder="예: 사내 CalDAV 달력"
                      value={calendarName}
                      onChange={(e) => setCalendarName(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', height: '32px', fontSize: '0.78rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                      표시 색상
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '32px' }}>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        style={{
                          width: '32px',
                          height: '32px',
                          padding: 0,
                          border: 'none',
                          borderRadius: 'var(--radius-xs)',
                          cursor: 'pointer',
                          background: 'transparent',
                        }}
                      />
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{color}</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    marginTop: '10px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-light)',
                  }}
                >
                  {isConnected && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn btn-secondary btn-sm"
                      style={{ height: '30px' }}
                    >
                      수정 취소
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-secondary btn-sm"
                    style={{ height: '30px' }}
                  >
                    닫기
                  </button>
                  <button
                    type="submit"
                    disabled={connectMutation.isPending || isStatusLoading}
                    className="btn btn-primary btn-sm"
                    style={{ height: '30px', gap: '5px' }}
                  >
                    {connectMutation.isPending ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>CalDAV 계정 통신 및 탐색 중...</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink size={13} />
                        <span>{isConnected ? '계정 정보 업데이트 및 동기화' : 'CalDAV 계정 추가 및 일정 가져오기'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};
