import type { ChatRequestDto, ChatResponseDto, ChatActionDto, ChatTokenUsageDto, ChatAgentStepDto } from '../dto/chat.dto.js';
import { SkillRegistry } from '../skills/index.js';
import { ToolExecutor } from './toolExecutor.service.js';

export async function processChatCompletion(dto: ChatRequestDto, userId?: number): Promise<ChatResponseDto> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = dto.model || process.env.OPENAI_MODEL || '5.6-terra';

  // 1. OpenAI API 키가 없는 경우 친절한 안내 및 로컬 스마트 폴백
  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    return generateFallbackResponse(dto.prompt, model);
  }

  // 2. 챗봇 스킬 매칭 및 선별된 스킬의 OpenAI 도구 추출 (Dynamic Tool Routing)
  const matchedSkills = SkillRegistry.matchSkills(dto.prompt);
  const tools = SkillRegistry.getTools(matchedSkills);
  const systemPrompt = SkillRegistry.buildSystemPrompt(matchedSkills);

  // 3. 히스토리 슬라이딩 윈도우 (최근 20개 메시지 유지)
  const recentHistory = (dto.history || []).slice(-20);

  // 4. 초기 메시지 배열 구성
  const currentMessages: any[] = [
    { role: 'system', content: systemPrompt },
    ...recentHistory.map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: 'user', content: dto.prompt },
  ];

  // 도구가 없는 일상 대화(0개 도구)인 경우: 단 1회 호출로 초경량 처리
  if (tools.length === 0) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: currentMessages,
          temperature: 0.1,
        }),
      });

      if (!res.ok) {
        return generateFallbackResponse(dto.prompt, model, `OpenAI API 오류 (${res.status})`);
      }

      const data: any = await res.json();
      const choice = data.choices?.[0]?.message;
      let usageDto: ChatTokenUsageDto | undefined;
      if (data.usage) {
        const pTokens = data.usage.prompt_tokens || 0;
        const cTokens = data.usage.completion_tokens || 0;
        const total = data.usage.total_tokens || (pTokens + cTokens);
        const costKrw = (pTokens * 0.00000015 + cTokens * 0.0000006) * 1350;
        usageDto = {
          promptTokens: pTokens,
          completionTokens: cTokens,
          totalTokens: total,
          estimatedCostKrw: Math.round(costKrw * 100) / 100,
        };
      }
      return {
        text: choice?.content || '안녕하세요! 무엇을 도와드릴까요?',
        usage: usageDto,
      };
    } catch (err: any) {
      return generateFallbackResponse(dto.prompt, model, err.message);
    }
  }

  // 5. 자율적 다단계 에이전트 루프 (Multi-turn ReAct Tool Execution Loop)
  const MAX_TURNS = 5;
  let turn = 0;
  const collectedActions: ChatActionDto[] = [];
  const executedSteps: ChatAgentStepDto[] = [];
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let lastResponseText = '';

  try {
    while (turn < MAX_TURNS) {
      turn++;

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: currentMessages,
          tools,
          parallel_tool_calls: true,
          temperature: 0.1,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[OpenAI ReAct Loop Error turn=${turn}] status=${res.status}: ${errText}`);
        if (turn === 1) {
          return generateFallbackResponse(dto.prompt, model, `OpenAI API 오류 (${res.status})`);
        }
        break;
      }

      const data: any = await res.json();
      if (data.usage) {
        totalPromptTokens += data.usage.prompt_tokens || 0;
        totalCompletionTokens += data.usage.completion_tokens || 0;
      }

      const choice = data.choices?.[0]?.message;
      if (!choice) break;

      // Assistant 메시지를 대화 흐름에 추가
      currentMessages.push(choice);
      if (choice.content) {
        lastResponseText = choice.content;
      }

      const toolCalls = choice.tool_calls;
      // 더 이상 호출할 도구가 없으면 자율 루프 완료!
      if (!toolCalls || !Array.isArray(toolCalls) || toolCalls.length === 0) {
        break;
      }

      // Tool Call 처리
      for (const call of toolCalls) {
        const fnName = call.function?.name;
        let args: Record<string, any> = {};
        try {
          args = JSON.parse(call.function?.arguments || '{}');
        } catch {
          args = {};
        }

        // [A] 서버 사이드 실시간 실행 도구 (Read Tools) ➔ 즉시 DB 조회 후 모델에 결과 피드백!
        if (ToolExecutor.isReadTool(fnName)) {
          const execRes = await ToolExecutor.execute(fnName, args, userId);
          currentMessages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(execRes.data ?? { summary: execRes.summary }),
          });

          executedSteps.push({
            tool: fnName,
            title: formatToolTitle(fnName, args),
            resultSummary: execRes.summary,
          });
        }
        // [B] 변경/액션 도구 (Write Tools) ➔ 실행 카드 생성 및 모델에게 준비 완료 통보
        else {
          const action = SkillRegistry.parseSingleToolCall(call);
          if (action && !collectedActions.some((a) => a.id === action.id)) {
            collectedActions.push(action);
          }

          currentMessages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify({
              status: 'queued',
              actionId: action?.id,
              title: action?.title,
              message: '사용자의 확인 및 실행을 위해 액션 카드가 준비되었습니다.',
            }),
          });

          executedSteps.push({
            tool: fnName,
            title: action?.title || fnName,
            resultSummary: '실행 카드 등록 완료',
          });
        }
      }
    }

    // 텍스트 내 혹시 포함된 CALL: 폴백 파싱
    if (lastResponseText.includes('CALL:')) {
      const { cleanText, action } = SkillRegistry.parseActionFromText(lastResponseText);
      lastResponseText = cleanText;
      if (action && !collectedActions.some((a) => a.type === action.type && JSON.stringify(a.payload) === JSON.stringify(action.payload))) {
        collectedActions.push(action);
      }
    }

    // 명시적 작업 의도가 있었으나 모델이 도구를 호출하지 않은 경우 스마트 폴백으로 보완
    if (collectedActions.length === 0 && executedSteps.length === 0) {
      const fallback = generateFallbackResponse(dto.prompt, model);
      if (fallback.actions && fallback.actions.length > 0) {
        collectedActions.push(...fallback.actions);
      }
    }

    // 실시간 토큰 사용량 및 예상 비용 집계
    const totalTokens = totalPromptTokens + totalCompletionTokens;
    const costKrw = (totalPromptTokens * 0.00000015 + totalCompletionTokens * 0.0000006) * 1350;
    const usageDto: ChatTokenUsageDto = {
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      totalTokens,
      estimatedCostKrw: Math.round(costKrw * 100) / 100,
    };

    let finalText = lastResponseText.trim();
    if (!finalText && collectedActions.length > 0) {
      finalText = collectedActions.length === 1
        ? '요청하신 작업을 아래와 같이 준비했습니다. 확인 후 실행해 주세요.'
        : `요청하신 **${collectedActions.length}개의 작업**을 모두 준비했습니다. 아래 카드에서 개별 실행하거나 일괄 실행해 주세요.`;
    }

    return {
      text: finalText,
      actions: collectedActions.length > 0 ? collectedActions : undefined,
      steps: executedSteps.length > 0 ? executedSteps : undefined,
      usage: totalTokens > 0 ? usageDto : undefined,
    };
  } catch (err: any) {
    console.error('[OpenAI Agent Loop Error]:', err);
    return generateFallbackResponse(dto.prompt, model, err.message);
  }
}

/**
 * 도구 호출 제목 포맷팅 헬퍼
 */
function formatToolTitle(fnName: string, args: Record<string, any>): string {
  switch (fnName) {
    case 'search_projects':
      return args.search ? `프로젝트 검색 ("${args.search}")` : '전체 프로젝트 목록 조회';
    case 'search_issues': {
      const parts: string[] = [];
      if (args.projectName) parts.push(`프로젝트: ${args.projectName}`);
      if (args.status) parts.push(`상태: ${args.status}`);
      if (args.dueDateFilter) parts.push(`기한: ${args.dueDateFilter}`);
      if (args.search) parts.push(`검색: "${args.search}"`);
      return parts.length > 0 ? `이슈 현황 조회 (${parts.join(', ')})` : '이슈 목록 조회';
    }
    case 'get_issue_detail':
      return `이슈 #${args.issueId} 상세 내역 및 관계 분석`;
    case 'search_sprints':
      return args.projectName ? `스프린트 조회 (프로젝트: ${args.projectName})` : '스프린트 목록 조회';
    default:
      return fnName;
  }
}

/**
 * API Key 미설정 또는 네트워크 단절 시 다중 작업 및 안전한 폴백 응답 생성기
 */
function generateFallbackResponse(prompt: string, model: string, errMsg?: string): ChatResponseDto {
  const lower = prompt.toLowerCase();
  const actions: ChatActionDto[] = [];
  const steps: ChatAgentStepDto[] = [];

  // [다중 작업 1] 이슈 완료/상태변경 감지
  const updateMatch = prompt.match(/이슈\s*#?(\d+)[을를]?\s*(완료|진행|대기|검토)/);
  if (updateMatch) {
    const issueId = parseInt(updateMatch[1], 10);
    const statusWord = updateMatch[2];
    const statusId = statusWord === '완료' ? 4 : statusWord === '진행' ? 2 : statusWord === '검토' ? 3 : 1;
    actions.push({
      id: `act-update-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'update_issue',
      title: `이슈 #${issueId} 상태 변경 (${statusWord})`,
      payload: { issueId, statusId },
      status: 'pending',
    });
    steps.push({
      tool: 'update_issue',
      title: `이슈 #${issueId} 상태 변경 파싱`,
      resultSummary: `상태: ${statusWord} (ID: ${statusId})`,
    });
  } else if (lower.includes('마감기한') || lower.includes('기한')) {
    const idMatch = prompt.match(/이슈\s*#?(\d+)/);
    const dateMatch = prompt.match(/(\d{4}-\d{2}-\d{2})/);
    if (idMatch && dateMatch) {
      const issueId = parseInt(idMatch[1], 10);
      actions.push({
        id: `act-update-date-${Date.now()}`,
        type: 'update_issue',
        title: `이슈 #${issueId} 기한 변경 (${dateMatch[1]})`,
        payload: { issueId, dueDate: dateMatch[1] },
        status: 'pending',
      });
      steps.push({
        tool: 'update_issue',
        title: `이슈 #${issueId} 기한 파싱`,
        resultSummary: `새 기한: ${dateMatch[1]}`,
      });
    }
  }

  // [다중 작업 2] 하위 이슈 생성 감지
  const subIssueMatch = prompt.match(/하위\s*이슈(?:로|에)?\s*["']?([^"',\n]+)["']?\s*(?:생성|추가|등록|만들)/);
  if (subIssueMatch) {
    const parentIdMatch = prompt.match(/이슈\s*#?(\d+)/);
    const parentId = parentIdMatch ? parseInt(parentIdMatch[1], 10) : undefined;
    const title = subIssueMatch[1].trim();
    actions.push({
      id: `act-create-sub-${Date.now()}`,
      type: 'create_issue',
      title: `하위 이슈 생성: "${title}" (상위: #${parentId || '?'})`,
      payload: { title, parentId, priorityId: 2 },
      status: 'pending',
    });
    steps.push({
      tool: 'create_issue',
      title: `하위 이슈 생성 파싱: "${title}"`,
      resultSummary: `상위 이슈 연결: #${parentId || '미지정'}`,
    });
  } else if (lower.includes('이슈') && (lower.includes('생성') || lower.includes('등록') || lower.includes('만들'))) {
    const match = prompt.match(/["'](.*?)["']/) || prompt.match(/제목[은는]?\s*([^\n,]+)/);
    const title = match ? match[1].trim() : 'AI 제안: 작업 이슈';
    const parentMatch = prompt.match(/상위\s*이슈\s*#?(\d+)/) || prompt.match(/#(\d+)의?\s*하위/);
    const parentId = parentMatch ? parseInt(parentMatch[1], 10) : undefined;

    actions.push({
      id: `act-create-${Date.now()}`,
      type: 'create_issue',
      title: parentId ? `하위 이슈 생성: "${title}" (상위: #${parentId})` : `이슈 생성: "${title}"`,
      payload: { title, parentId, description: prompt, priorityId: 2 },
      status: 'pending',
    });
    steps.push({
      tool: 'create_issue',
      title: `이슈 생성 파싱: "${title}"`,
      resultSummary: parentId ? `상위 이슈 #${parentId}의 하위 태스크` : '독립 이슈',
    });
  }

  // [다중 작업 3] 이슈 삭제 감지
  if (lower.includes('이슈') && (lower.includes('삭제') || lower.includes('지워') || lower.includes('제거'))) {
    const idMatch = prompt.match(/이슈\s*#?(\d+)\s*(?:삭제|지워|제거)/) || prompt.match(/#?(\d+)/);
    const targetId = idMatch ? parseInt(idMatch[1], 10) : undefined;
    actions.push({
      id: `act-del-${Date.now()}`,
      type: 'delete_issue',
      title: targetId ? `이슈 #${targetId} 삭제` : '이슈 삭제',
      payload: { issueId: targetId },
      status: 'pending',
    });
  }

  // [다중 작업 4] 스프린트 생성 감지
  if (lower.includes('스프린트') && (lower.includes('생성') || lower.includes('등록') || lower.includes('만들'))) {
    const nameMatch = prompt.match(/["'](.*?)["']/) || prompt.match(/스프린트\s*([a-zA-Z0-9_\-\s]+)/);
    const name = nameMatch ? nameMatch[1].trim() : 'Sprint 1';
    actions.push({
      id: `act-sprint-${Date.now()}`,
      type: 'create_sprint',
      title: `스프린트 생성: "${name}"`,
      payload: { name },
      status: 'pending',
    });
  }

  // [다중 작업 5] 이슈 목록 조회 감지
  if (lower.includes('이슈') && (lower.includes('목록') || lower.includes('확인') || lower.includes('조회') || lower.includes('검색'))) {
    const projMatch = prompt.match(/([a-zA-Z0-9가-힣_-]+)\s*프로젝트/);
    actions.push({
      id: `act-search-${Date.now()}`,
      type: 'search_issues',
      title: projMatch ? `이슈 목록 조회 (프로젝트: ${projMatch[1]})` : '이슈 목록 조회',
      payload: { projectName: projMatch ? projMatch[1] : undefined },
      status: 'pending',
    });
  }

  // [다중 작업 6] 스프린트 목록 조회 감지
  if (lower.includes('스프린트') && (lower.includes('목록') || lower.includes('확인') || lower.includes('조회'))) {
    actions.push({
      id: `act-search-sprint-${Date.now()}`,
      type: 'search_sprints',
      title: '스프린트 목록 조회',
      payload: {},
      status: 'pending',
    });
  }

  if (actions.length > 0) {
    const textPrefix = actions.length === 1
      ? '요청하신 작업을 준비했습니다.'
      : `요청하신 **${actions.length}개의 작업**을 동시에 처리할 수 있도록 준비했습니다.`;
    return {
      text: `${textPrefix}\n*(현재 모델: ${model} / 서버 .env에 OPENAI_API_KEY 등록 시 실시간 LLM Multi-step ReAct 연쇄 추론 동작)*`,
      actions,
      steps: steps.length > 0 ? steps : undefined,
    };
  }

  return {
    text: `안녕하세요! **AntiGravity AI 워크플로우 어시스턴트**입니다. (지정 모델: \`${model}\`)\n\n서버 환경변수(\`workflow_server/.env\`)에 **\`OPENAI_API_KEY\`**를 등록하시면 OpenAI 공식 네이티브 Tool Calling 기반의 실시간 다단계 자율 API 체이닝(ReAct Loop)이 동작합니다.\n\n${errMsg ? `*(참고: 연결 시도 중 에러 - ${errMsg})*` : ''}`,
  };
}
