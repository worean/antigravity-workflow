import React from 'react';
import {
  StateComparisonCard,
  PrefControllerCard,
  PrefSubscriberCardA,
  PrefSubscriberCardB,
  StorageInspectorCard,
} from '@/components/demo';
import { Sparkles, BookOpen } from 'lucide-react';

export const StateDemoPage: React.FC = () => {
  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* 상단 안내 헤더 */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Sparkles size={20} color="#38bdf8" />
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            Zustand vs useState 상태 관리 & 영속화(Persist) 실습 워크스페이스
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
          이 화면은 <strong>React Context의 불필요한 전체 리렌더링 문제를 해결</strong>하고,{' '}
          <strong>LocalStorage 영속화(Persist)</strong>와 <strong>Selector 기반의 세밀한 렌더링 최적화</strong>를
          직접 확인하고 학습할 수 있도록 구성된 라이브 데모 페이지입니다.
        </p>
      </div>

      {/* 1. useState vs Zustand 핵심 비교 카드 */}
      <StateComparisonCard />

      {/* 2. 환경설정 조작 컨트롤러 */}
      <PrefControllerCard />

      {/* 3. 선택적 구독(Selector) 증명 위젯 2개 (A & B) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <PrefSubscriberCardA />
        <PrefSubscriberCardB />
      </div>

      {/* 4. 실제 LocalStorage 데이터 실시간 검사기 */}
      <StorageInspectorCard />

      {/* 하단 학습 가이드 요약 */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <BookOpen size={18} color="#a855f7" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-bright)' }}>💡 실습 포인트 가이드:</strong>
          <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
            <li>
              <strong>렌더 횟수 배지 확인:</strong> 컨트롤러에서 <em>'테마 모드'</em>를 바꾸면 <strong>컴포넌트 B</strong>만 카운터가 오르고 <strong>컴포넌트 A</strong>는 리렌더링되지 않습니다!
            </li>
            <li>
              <strong>영속화 검증:</strong> 설정값을 자유롭게 바꾼 뒤 브라우저를 새로고침(F5)해도 모든 설정과 LocalStorage 데이터가 그대로 유지됩니다.
            </li>
            <li>
              <strong>API 동기화:</strong> <em>'백엔드 API 설정 일괄 동기화'</em> 버튼을 누르면 서버에서 설정을 받아와 일괄 적용하면서도 관련 컴포넌트만 정확히 업데이트합니다.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
