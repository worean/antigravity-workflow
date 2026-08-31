// -*- coding: utf-8 -*-
import React from 'react';
import type { HealthStatus } from '@/types';
import {
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  Zap,
  Save,
  RotateCcw,
  Check,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { Button, Spinner } from '@/components/common';
import { getApiBaseUrl } from '@/services/api';

interface SettingsSystemTabProps {
  backendUrlInput: string;
  setBackendUrlInput: (url: string) => void;
  testingConnection: boolean;
  handleTestBackendConnection: (targetUrl?: string) => Promise<void>;
  handleSaveBackendUrl: () => Promise<void>;
  handleResetBackendUrl: () => Promise<void>;
  backendSaveFeedback: string | null;
  testResult: {
    success: boolean;
    status?: string;
    latencyMs: number;
    error?: string;
    timestamp?: string;
  } | null;
  health: HealthStatus | null;
  healthLoading: boolean;
}

export const SettingsSystemTab: React.FC<SettingsSystemTabProps> = ({
  backendUrlInput,
  setBackendUrlInput,
  testingConnection,
  handleTestBackendConnection,
  handleSaveBackendUrl,
  handleResetBackendUrl,
  backendSaveFeedback,
  testResult,
  health,
  healthLoading,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px' }}>
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)' }}>
          시스템 상태 & 백엔드 서버 연결 설정
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          데스크톱 앱이 통신할 백엔드 API 서버 호스트 주소를 변경하고 시스템 런타임 상태를 진단합니다.
        </p>
      </div>

      {/* 1. 백엔드 API 서버 주소 구성 카드 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '14px',
          background: '#252526',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={15} color="var(--primary)" />
            백엔드 API 서버 호스트 (Server Host URL)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}>
            {health?.status === 'OK' ? (
              <span style={{ color: '#4ec9b0', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <Wifi size={13} /> 서버 정상 연결됨
              </span>
            ) : (
              <span style={{ color: '#f14c4c', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <WifiOff size={13} /> 서버 연결 확인 필요
              </span>
            )}
          </div>
        </div>

        <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
          사내 로컬 네트워크(LAN), 원격 개발 서버, 또는 클라우드 배포 서버(`https://api.example.com` 또는 `https://192.168.0.x:4000`)의 주소를 지정할 수 있습니다.
        </p>

        <div className="form-group" style={{ margin: 0 }}>
          <input
            type="text"
            className="input-field"
            value={backendUrlInput}
            onChange={(e) => setBackendUrlInput(e.target.value)}
            placeholder="예: https://192.168.0.10:4000 또는 https://api.myworkflow.com"
            style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
          />
        </div>

        {/* 빠른 입력 프리셋 */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>빠른 프리셋:</span>
          <button
            type="button"
            onClick={() => setBackendUrlInput('https://localhost:4000')}
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              background: '#333333',
              border: '1px solid #444444',
              borderRadius: '4px',
              color: 'var(--text-main)',
              cursor: 'pointer',
            }}
          >
            🔒 로컬 HTTPS (4000)
          </button>
          <button
            type="button"
            onClick={() => setBackendUrlInput('http://localhost:4000')}
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              background: '#333333',
              border: '1px solid #444444',
              borderRadius: '4px',
              color: 'var(--text-main)',
              cursor: 'pointer',
            }}
          >
            🌐 로컬 HTTP (4000)
          </button>
          <button
            type="button"
            onClick={() => setBackendUrlInput('https://127.0.0.1:4000')}
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              background: '#333333',
              border: '1px solid #444444',
              borderRadius: '4px',
              color: 'var(--text-main)',
              cursor: 'pointer',
            }}
          >
            🏠 127.0.0.1 (4000)
          </button>
        </div>

        {/* 액션 버튼 그룹 */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleTestBackendConnection()}
            disabled={testingConnection}
          >
            {testingConnection ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> 연결 진단 중...
              </>
            ) : (
              <>
                <Zap size={12} /> 연결 테스트 (Health Check)
              </>
            )}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveBackendUrl}
          >
            <Save size={12} /> 저장 및 즉시 적용
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetBackendUrl}
            title="기본 로컬호스트 주소로 초기화"
          >
            <RotateCcw size={12} /> 기본값 복원
          </Button>
        </div>

        {/* 저장 피드백 메시지 */}
        {backendSaveFeedback && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(78, 201, 176, 0.12)',
              border: '1px solid #4ec9b0',
              borderRadius: 'var(--radius-xs)',
              color: '#4ec9b0',
              fontSize: '0.76rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={14} /> {backendSaveFeedback}
          </div>
        )}

        {/* 실시간 연결 테스트 결과 카드 */}
        {testResult && (
          <div
            style={{
              padding: '10px 12px',
              background: testResult.success ? 'rgba(78, 201, 176, 0.08)' : 'rgba(241, 76, 76, 0.08)',
              border: `1px solid ${testResult.success ? 'rgba(78, 201, 176, 0.4)' : 'rgba(241, 76, 76, 0.4)'}`,
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: testResult.success ? '#4ec9b0' : '#f14c4c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {testResult.success ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {testResult.success ? '서버 응답 성공 (Healthy)' : '서버 연결 실패'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                응답 속도: {testResult.latencyMs}ms
              </span>
            </div>

            {testResult.success ? (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                상태: <strong>{testResult.status}</strong> | 타임스탬프: {testResult.timestamp}
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#f14c4c' }}>
                원인: {testResult.error}
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          💡 <strong>Tip</strong>: Electron 데스크톱 앱에서는 자체 서명 SSL 인증서(`https://`) 및 사설 IP 네트워크 주소를 자동으로 안전하게 신뢰하도록 구성되어 있습니다.
        </div>
      </div>

      {/* 2. 시스템 및 런타임 진단 정보 카드 */}
      {healthLoading ? (
        <Spinner centered label="서버 상태 진단 중..." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '10px 12px', background: '#2d2d2d', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>애플리케이션 런타임</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: window.electronAPI?.isElectron ? '#4ec9b0' : 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Monitor size={13} /> {window.electronAPI?.isElectron ? 'Electron Desktop Framework (Active)' : 'Web Browser Client (Active)'}
            </span>
          </div>

          <div style={{ padding: '10px 12px', background: '#2d2d2d', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>서버 헬스체크 상태</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: health?.status === 'OK' ? '#4ec9b0' : '#f14c4c', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={13} /> {health?.status || '연결 대기 중 (Offline)'}
            </span>
          </div>

          <div style={{ padding: '10px 12px', background: '#2d2d2d', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>데이터베이스 (Prisma SQLite)</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} /> 연결 정상 (Ready)
            </span>
          </div>

          <div style={{ padding: '10px 12px', background: '#2d2d2d', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>현재 활성 API Base URL</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
              {getApiBaseUrl()}
            </span>
          </div>

          <div style={{ padding: '10px 12px', background: '#2d2d2d', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>시스템 버전</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              AntiGravity Workflow v2.5.0 (Universal Edition)
            </span>
          </div>

          <div style={{ padding: '10px 12px', background: '#2d2d2d', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>인증 방식</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-sub)' }}>
              JWT Bearer Token Signature Only
            </span>
          </div>
        </div>
      )}
    </div>
  );
};