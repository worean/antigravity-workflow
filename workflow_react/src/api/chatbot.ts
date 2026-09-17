import { apiClient } from '@/lib/apiClient';
import type { 
  ChatbotModelOption, 
  ChatbotMessage, 
  ChatbotAction,
  ChatbotSuggestedPrompt,
  ChatTokenUsage,
} from '@/types/chatbot';
export { executeChatbotAction } from './chatbotActionHandlers';

export const AVAILABLE_MODELS: ChatbotModelOption[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (Default)',
    provider: 'OpenAI',
    description: '초경량 초고속 최신 모델 (가장 저렴하고 빠름)',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: '복잡한 추론 및 정밀 분석 모델',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    description: '초고속 실시간 응답 및 빠른 업무 지원',
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: '정교한 코딩 분석 및 텍스트 요약 지원',
  },
];

export const SUGGESTED_PROMPTS: ChatbotSuggestedPrompt[] = [
  {
    id: 'prompt-1',
    label: '📋 내 배정 일감 요약',
    prompt: '현재 나에게 배정된 미완료 이슈 목록을 조회하고 요약해줘.',
  },
  {
    id: 'prompt-2',
    label: '⚡ 새 버그 이슈 생성',
    prompt: '새로운 버그 이슈를 등록하고 싶어. 제목은 "로그인 세션 만료 알림 개선"으로 해줘.',
  },
  {
    id: 'prompt-3',
    label: '🏃 스프린트 현황 점검',
    prompt: '현재 진행 중인 활성 스프린트의 진행률과 남은 태스크를 분석해줘.',
  },
  {
    id: 'prompt-4',
    label: '📂 신규 프로젝트 생성',
    prompt: '신규 프로젝트 생성을 제안해줘.',
  },
];

/**
 * AI 어시스턴트 메시지 발송 및 의도 분석 (Intent & Action Resolution)
 * 백엔드 AI 라우트 연동 및 스마트 폴백 에이전트 엔진
 */
export const requestChatbotResponse = async (
  prompt: string,
  model: string,
  history: ChatbotMessage[]
): Promise<{ text: string; actions?: ChatbotAction[]; usage?: ChatTokenUsage; steps?: any[] }> => {
  // 1. 서버에 AI 엔드포인트가 존재하는 경우 우선 호출 시도 (최근 20개 대화 전달하여 풍부한 문맥 유지)
  try {
    const recentHistory = history.slice(-20);
    const res = await apiClient.post('/ai/chat', { prompt, model, history: recentHistory });
    if (res.data && res.data.text) {
      return res.data;
    }
  } catch {
    // 백엔드 미구현 또는 에러 시 프론트엔드 내장 지능형 에이전트 엔진으로 자연스럽게 폴백(Fallback)
  }

  // 2. 내장 지능형 워크플로우 분석기 (클라이언트 폴백 파서)
  const lower = prompt.toLowerCase();

  // 이슈 삭제 의도
  if (lower.includes('이슈') && (lower.includes('삭제') || lower.includes('지워') || lower.includes('제거'))) {
    const idMatch = prompt.match(/#?(\d+)/);
    const targetId = idMatch ? parseInt(idMatch[1], 10) : undefined;
    const match = prompt.match(/["'](.*?)["']/);
    const targetTitle = match ? match[1].trim() : undefined;
    return {
      text: `네, 요청하신 이슈 삭제를 준비했습니다. 아래 카드를 확인해 주세요.`,
      actions: [{
        id: `act-${Date.now()}`,
        type: 'delete_issue',
        title: targetId ? `이슈 #${targetId} 삭제` : '이슈 삭제',
        payload: { issueId: targetId, title: targetTitle },
        status: 'pending',
      }],
    };
  }

  // 이슈 생성 의도
  if (lower.includes('이슈') && (lower.includes('생성') || lower.includes('등록') || lower.includes('만들'))) {
    const match = prompt.match(/["'](.*?)["']/) || prompt.match(/제목[은는]?\s*([^\n,]+)/);
    const issueTitle = match ? match[1].trim() : 'AI 제안: 시스템 개선 작업';
    return {
      text: `네, 새 이슈 생성을 준비했습니다. 아래 카드를 확인해 주세요.`,
      actions: [{
        id: `act-${Date.now()}`,
        type: 'create_issue',
        title: `이슈 생성: "${issueTitle}"`,
        payload: { title: issueTitle, description: prompt, priorityId: 2 },
        status: 'pending',
      }],
    };
  }

  // 이슈 목록 조회 의도
  if (lower.includes('이슈') || lower.includes('일감')) {
    return {
      text: `조건에 맞는 이슈 목록을 조회합니다.`,
      actions: [{
        id: `act-${Date.now()}`,
        type: 'search_issues',
        title: '이슈 목록 조회',
        payload: { search: prompt },
        status: 'pending',
      }],
    };
  }

  // 기본 안내
  return {
    text: `안녕하세요! **AntiGravity AI 어시스턴트**입니다. (${model})\n\n프로젝트 및 이슈 생성, 수정, 삭제, 조건별 목록 조회 등을 자유롭게 지시해 보세요!`,
  };
};


