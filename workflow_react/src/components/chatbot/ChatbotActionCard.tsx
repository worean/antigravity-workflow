import React from 'react';
import { Play, Check, AlertCircle, Loader2, ArrowRight, Trash2, Edit3, Zap, Calendar, Search } from 'lucide-react';
import type { ChatbotAction } from '@/types/chatbot';
import { useChatbotStore } from '@/stores/useChatbotStore';

interface ChatbotActionCardProps {
  action: ChatbotAction;
}

export const ChatbotActionCard: React.FC<ChatbotActionCardProps> = ({ action }) => {
  const executeAction = useChatbotStore((s) => s.executeAction);

  const isPending = action.status === 'pending';
  const isExecuting = action.status === 'executing';
  const isCompleted = action.status === 'completed';
  const isFailed = action.status === 'failed';

  const isDelete = action.type === 'delete_issue' || action.type === 'delete_project';
  const isUpdate = action.type === 'update_issue' || action.type === 'update_sprint';
  const isSearch = action.type === 'search_issues' || action.type === 'search_projects' || action.type === 'search_sprints';
  const isSprint = action.type.includes('sprint');

  // 카드 테마 색상 동적 계산
  const cardBg = isDelete
    ? 'rgba(248, 81, 73, 0.08)'
    : isUpdate
    ? 'rgba(210, 153, 34, 0.08)'
    : isSearch
    ? 'rgba(163, 113, 247, 0.08)'
    : isSprint
    ? 'rgba(46, 160, 67, 0.08)'
    : 'rgba(0, 122, 204, 0.08)';

  const cardBorder = isDelete
    ? '1px solid rgba(248, 81, 73, 0.35)'
    : isUpdate
    ? '1px solid rgba(210, 153, 34, 0.35)'
    : isSearch
    ? '1px solid rgba(163, 113, 247, 0.35)'
    : isSprint
    ? '1px solid rgba(46, 160, 67, 0.35)'
    : '1px solid rgba(0, 122, 204, 0.25)';

  const buttonBg = isDelete
    ? '#da3633'
    : isUpdate
    ? '#b08800'
    : isSearch
    ? '#8957e5'
    : isSprint
    ? '#238636'
    : 'var(--accent-color, #007acc)';

  return (
    <div
      style={{
        marginTop: '8px',
        padding: '10px 12px',
        borderRadius: '8px',
        background: cardBg,
        border: cardBorder,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isDelete ? (
            <Trash2 size={13} color="#f85149" />
          ) : isUpdate ? (
            <Edit3 size={13} color="#d29922" />
          ) : isSearch ? (
            <Search size={13} color="#a371f7" />
          ) : (
            <span style={{ fontSize: '0.75rem' }}>⚡</span>
          )}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isDelete ? '#ff7b72' : isUpdate ? '#e3b341' : isSearch ? '#d2a8ff' : 'var(--text-main, #fff)',
            }}
          >
            {action.title}
          </span>
        </div>

        {/* 상태 배지 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem' }}>
          {action.autoExecuted && (
            <span
              style={{
                color: '#facc15',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                background: 'rgba(234, 179, 8, 0.15)',
                padding: '1px 5px',
                borderRadius: '4px',
              }}
              title="Auto Mode로 자동 실행되었습니다."
            >
              <Zap size={10} fill="#facc15" /> Auto
            </span>
          )}
          {isCompleted && (
            <span style={{ color: '#4ec9b0', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Check size={12} /> 완료됨
            </span>
          )}
          {isFailed && (
            <span style={{ color: '#f14c4c', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <AlertCircle size={12} /> 실패
            </span>
          )}
          {isExecuting && (
            <span style={{ color: '#388bfd', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Loader2 size={12} className="spin" /> 실행 중...
            </span>
          )}
        </div>
      </div>

      {/* 액션 세부 파라미터 미리보기 */}
      {action.payload && Object.keys(action.payload).length > 0 && (
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-sub, #aaa)',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '5px 8px',
            borderRadius: '4px',
            maxHeight: '65px',
            overflowY: 'auto',
          }}
        >
          {action.payload.issueId && <div><strong>대상 이슈:</strong> #{action.payload.issueId}</div>}
          {action.payload.parentId && <div><strong>상위 이슈:</strong> #{action.payload.parentId} (하위 이슈로 연결)</div>}
          {action.payload.projectId && <div><strong>대상 프로젝트 ID:</strong> #{action.payload.projectId}</div>}
          {action.payload.title && <div><strong>제목:</strong> {action.payload.title}</div>}
          {action.payload.name && <div><strong>이름:</strong> {action.payload.name}</div>}
          {action.payload.priorityId && (
            <div><strong>우선순위:</strong> {['낮음', '보통', '높음', '긴급'][action.payload.priorityId - 1] || action.payload.priorityId}</div>
          )}
          {action.payload.statusId && (
            <div><strong>상태:</strong> {['대기/백로그', '진행 중', '검토 중', '완료'][action.payload.statusId - 1] || action.payload.statusId}</div>
          )}
          {action.payload.dueDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#7ee787' }}>
              <Calendar size={11} /> <strong>마감 기한:</strong> {action.payload.dueDate}
            </div>
          )}
          {action.payload.plannedStartDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Calendar size={11} /> <strong>계획 시작일:</strong> {action.payload.plannedStartDate}
            </div>
          )}
          {action.payload.projectName && <div><strong>프로젝트:</strong> {action.payload.projectName}</div>}
          {action.payload.status && <div><strong>상태 조건:</strong> {action.payload.status}</div>}
          {action.payload.isMy && <div style={{ color: '#79c0ff' }}><strong>담당:</strong> 내게 배정된 이슈만</div>}
          {action.payload.dueDateFilter && (
            <div>
              <strong>기한 조건:</strong> {action.payload.dueDateFilter === 'today' ? '오늘 마감' : action.payload.dueDateFilter === 'overdue' ? '기한 지남/초과' : action.payload.dueDateFilter}
            </div>
          )}
          {action.payload.search && <div><strong>검색어:</strong> "{action.payload.search}"</div>}
          {action.payload.sprintId && <div><strong>스프린트 ID:</strong> #{action.payload.sprintId}</div>}
          {action.payload.startDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Calendar size={11} /> <strong>시작일:</strong> {action.payload.startDate}
            </div>
          )}
          {action.payload.endDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Calendar size={11} /> <strong>종료일:</strong> {action.payload.endDate}
            </div>
          )}
          {action.payload.goal && <div><strong>목표:</strong> {action.payload.goal}</div>}
          {action.payload.tab && <div><strong>이동:</strong> {action.payload.tab}</div>}
        </div>
      )}

      {/* 실행 트리거 버튼 */}
      {isPending && (
        <button
          onClick={() => executeAction(action.id)}
          style={{
            marginTop: '4px',
            background: buttonBg,
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            padding: '6px 10px',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            transition: 'opacity 0.2s, background-color 0.2s',
          }}
        >
          {isDelete ? (
            <>
              <Trash2 size={12} /> 이 삭제 작업 지금 실행하기
            </>
          ) : isUpdate ? (
            <>
              <Edit3 size={12} /> 이 변경사항 지금 반영하기
            </>
          ) : isSearch ? (
            <>
              <Search size={12} /> 조건에 맞는 이슈 목록 조회하기
            </>
          ) : (
            <>
              <Play size={12} fill="#fff" /> 이 기능 지금 실행하기
            </>
          )}
        </button>
      )}

      {isCompleted && action.type === 'navigate' && (
        <button
          onClick={() => executeAction(action.id)}
          style={{
            background: 'none',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: 'var(--text-main, #fff)',
            padding: '4px 8px',
            fontSize: '0.7rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            alignSelf: 'flex-start',
          }}
        >
          해당 화면으로 다시 이동 <ArrowRight size={11} />
        </button>
      )}
    </div>
  );
};
