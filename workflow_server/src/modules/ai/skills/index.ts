import type { ChatbotSkill, ChatbotToolDefinition } from './types.js';
import { issueSkill } from './issue.skill.js';
import { projectSkill } from './project.skill.js';
import { sprintSkill } from './sprint.skill.js';

export * from './types.js';
export * from './issue.skill.js';
export * from './project.skill.js';
export * from './sprint.skill.js';

export const CHATBOT_SKILLS: ChatbotSkill[] = [
  issueSkill,
  projectSkill,
  sprintSkill,
];

export class SkillRegistry {
  private static skills: ChatbotSkill[] = CHATBOT_SKILLS;

  public static getAllSkills(): ChatbotSkill[] {
    return this.skills;
  }

  public static getSkill(name: string): ChatbotSkill | undefined {
    return this.skills.find((s) => s.name === name);
  }

  /**
   * 사용자 프롬프트 키워드를 분석하여 관련된 스킬만 선별 (Dynamic Tool Routing)
   */
  public static matchSkills(prompt: string): ChatbotSkill[] {
    const lower = prompt.toLowerCase();
    const matched = this.skills.filter((skill) =>
      skill.keywords.some((k) => lower.includes(k.toLowerCase()))
    );

    if (matched.length > 0) return matched;

    // 작업 지시 동사가 있는 경우 전체 스킬 주입
    const hasGenericAction = [
      '생성', '등록', '만들', '삭제', '지워', '수정', '변경', '조회',
      '검색', '찾아', '목록', '시작', '완료', '하위', '확인', '상세',
      '조사', '점검', '분석', '요약', '정리'
    ].some((v) => lower.includes(v));

    if (hasGenericAction) {
      return this.skills;
    }

    // 일상 대화, 인사, 일반 질문은 도구/스킬을 일체 주입하지 않음 (0개 ➔ 토큰 절감)
    return [];
  }

  /**
   * 매칭된 스킬들로부터 OpenAI 표준 도구(Tool Definition) 배열 추출
   */
  public static getTools(skills: ChatbotSkill[]): ChatbotToolDefinition[] {
    return skills.flatMap((s) => s.tools || []);
  }

  /**
   * OpenAI Responses/Chat Completions 응답의 tool_calls 배열을 ChatActionDto[]로 일괄 변환 (Parallel Tool Calling 지원)
   */
  public static parseToolCalls(toolCalls: Array<{ id?: string; function?: { name: string; arguments: string } }>): any[] {
    const actions: any[] = [];
    if (!Array.isArray(toolCalls)) return actions;

    for (const call of toolCalls) {
      const fnName = call.function?.name;
      const fnArgsStr = call.function?.arguments || '{}';
      if (!fnName) continue;

      try {
        const args = JSON.parse(fnArgsStr);
        for (const skill of this.skills) {
          const act = skill.parseAction(fnName, args);
          if (act) {
            if (call.id) act.id = `act-${call.id}`;
            actions.push(act);
            break;
          }
        }
      } catch (e) {
        console.warn(`[SkillRegistry] Failed to parse tool_call arguments for ${fnName}:`, e);
      }
    }

    return actions;
  }

  /**
   * 단일 tool_call을 ChatActionDto로 변환
   */
  public static parseSingleToolCall(toolCall: { id?: string; function?: { name: string; arguments: string } }): any | null {
    const fnName = toolCall.function?.name;
    const fnArgsStr = toolCall.function?.arguments || '{}';
    if (!fnName) return null;

    try {
      const args = JSON.parse(fnArgsStr);
      for (const skill of this.skills) {
        const act = skill.parseAction(fnName, args);
        if (act) {
          if (toolCall.id) act.id = `act-${toolCall.id}`;
          return act;
        }
      }
    } catch (e) {
      console.warn(`[SkillRegistry] Failed to parse tool_call arguments for ${fnName}:`, e);
    }
    return null;
  }

  /**
   * 자율적 다단계 에이전트(Autonomous Agent)를 위한 시스템 프롬프트
   */
  public static buildSystemPrompt(skills: ChatbotSkill[]): string {
    const today = new Date().toISOString().substring(0, 10);

    // [1] 일상 대화 (스킬 0개 주입) ➔ 토큰 약 25개로 극한 압축
    if (skills.length === 0) {
      return `AntiGravity AI 업무 어시스턴트(오늘: ${today}). 친절하고 명확하게 한국어 마크다운으로 2~3줄로 답하세요.`.trim();
    }

    // [2] 작업 지시 (도구가 주입된 경우)
    return `당신은 AntiGravity 프로젝트 관리 시스템의 자율 AI 어시스턴트입니다. (오늘 날짜: ${today})
사용자의 요구를 완벽히 해결하기 위해 제공된 도구(tools)를 적극적으로 조합하여 연쇄 실행(Multi-step ReAct Loop)하세요.

[자율 API 조합 및 실행 원칙]
1. 주도적 정보 조사 & 연쇄 판단 (Agentic Chaining):
   - 조건에 부합하는 대상을 찾거나 현황을 파악해야 할 때는 먼저 검색/조회 도구(search_projects, search_issues, get_issue_detail, search_sprints)를 호출하여 실제 데이터를 확인하세요.
   - 서버로부터 전달받은 도구 실행 결과(tool message)를 정밀 분석한 후, 후속 작업(update_issue, create_issue 등)을 스스로 판단하여 연쇄 호출하세요.
2. 다중 작업 동시 수행 (Parallel Tool Calling):
   - 한 번에 여러 작업(예: 복수 이슈 상태 변경, 하위 이슈 생성 등)을 처리할 때는 여러 도구를 동시에 호출하세요.
3. 하위 이슈(Sub-issue):
   - create_issue 호출 시 parentId에 사용자가 언급한 상위 이슈의 ID를 정확히 지정하세요. (예: "이슈 #3의 하위 이슈" -> parentId: 3). 다른 이슈 번호로 변경하지 마세요.
4. 최종 답변:
   - 어떤 조사를 거쳐 어떤 현황을 확인했고, 사용자를 위해 어떤 작업을 준비했는지 명확하고 신뢰감 있게 한국어 마크다운으로 요약 보고하세요.`.trim();
  }

  /**
   * AI 응답 텍스트에서 CALL: 명령을 추출하고 액션 객체로 변환 (폴백용)
   */
  public static parseActionFromText(rawText: string): { cleanText: string; action: any | null } {
    let cleanText = rawText;
    let action: any | null = null;

    const callIdx = rawText.indexOf('CALL:');
    if (callIdx !== -1) {
      const braceStart = rawText.indexOf('{', callIdx);
      if (braceStart !== -1) {
        let depth = 0;
        let inString = false;
        let escape = false;
        let jsonEnd = -1;

        for (let i = braceStart; i < rawText.length; i++) {
          const char = rawText[i];
          if (escape) {
            escape = false;
            continue;
          }
          if (char === '\\') {
            escape = true;
            continue;
          }
          if (char === '"') {
            inString = !inString;
            continue;
          }
          if (!inString) {
            if (char === '{') depth++;
            else if (char === '}') {
              depth--;
              if (depth === 0) {
                jsonEnd = i;
                break;
              }
            }
          }
        }

        if (jsonEnd !== -1) {
          const jsonStr = rawText.substring(braceStart, jsonEnd + 1);
          try {
            const parsed = JSON.parse(jsonStr);
            const name = parsed.name || parsed.action;
            const args = parsed.args || parsed.payload || parsed;
            cleanText = (rawText.substring(0, callIdx) + rawText.substring(jsonEnd + 1))
              .replace(/```\s*```/g, '')
              .trim();

            for (const skill of this.skills) {
              const act = skill.parseAction(name, args);
              if (act) {
                action = act;
                break;
              }
            }
          } catch (e) {
            console.warn('[Skill Action JSON Parse Error]:', e);
          }
        }
      }
    }

    if (!action) {
      const funcMatch = rawText.match(/CALL:\s*([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)/);
      if (funcMatch) {
        try {
          const name = funcMatch[1];
          const args = JSON.parse(funcMatch[2].trim() || '{}');
          cleanText = rawText.replace(funcMatch[0], '').replace(/```\s*```/g, '').trim();

          for (const skill of this.skills) {
            const act = skill.parseAction(name, args);
            if (act) {
              action = act;
              break;
            }
          }
        } catch (e) {
          console.warn('[Skill Action Func Parse Error]:', e);
        }
      }
    }

    return { cleanText, action };
  }
}
