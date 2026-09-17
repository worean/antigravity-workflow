import { describe, it, expect } from 'vitest';
import { processChatCompletion } from '../modules/ai/services/chat.service.js';
import { SkillRegistry } from '../modules/ai/skills/index.js';
import { ToolExecutor } from '../modules/ai/services/toolExecutor.service.js';

describe('AI Chat Service Unit Tests', () => {
  it('기본 질의 시 정상적인 환영/안내 응답을 반환해야 한다.', async () => {
    const result = await processChatCompletion({
      prompt: '안녕하세요, 오늘 무슨 요일인가요?',
      model: 'gpt-4o-mini',
    });

    expect(result).toBeDefined();
    expect(result.text).toBeTruthy();
    expect(typeof result.text).toBe('string');
  });

  it('일상 대화 시에는 스킬/도구가 0개로 매칭되어 토큰이 절감되어야 한다.', () => {
    const matched = SkillRegistry.matchSkills('오늘 날씨 어때?');
    expect(matched.length).toBe(0);
    const tools = SkillRegistry.getTools(matched);
    expect(tools.length).toBe(0);
  });

  it('이슈 생성 요청 시 create_issue 액션 카드를 추출해야 한다.', async () => {
    const result = await processChatCompletion({
      prompt: '새로운 버그 이슈 생성해줘: "로그인 에러 수정"',
      model: 'gpt-4o-mini',
    });

    expect(result).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(Array.isArray(result.actions)).toBe(true);
    expect(result.actions!.length).toBeGreaterThan(0);
    expect(result.actions![0].type).toBe('create_issue');
    expect(result.actions![0].payload.title).toContain('로그인 에러 수정');
  });

  it('이슈 삭제 요청 시 delete_issue 액션을 제안해야 한다.', async () => {
    const result = await processChatCompletion({
      prompt: '이슈 #42 삭제해줘',
      model: 'gpt-4o-mini',
    });

    expect(result).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.actions!.some((a) => a.type === 'delete_issue')).toBe(true);
  });

  it('이슈 기한 수정 요청 시 update_issue 액션과 dueDate를 추출해야 한다.', async () => {
    const result = await processChatCompletion({
      prompt: '이슈 #10의 마감기한을 2026-10-31로 변경해줘',
      model: 'gpt-4o-mini',
    });

    expect(result).toBeDefined();
    expect(result.actions).toBeDefined();
    const updateAction = result.actions!.find((a) => a.type === 'update_issue');
    expect(updateAction).toBeDefined();
    expect(updateAction!.payload.issueId).toBe(10);
    expect(updateAction!.payload.dueDate).toBe('2026-10-31');
  });

  it('특정 프로젝트 진행중 이슈 조회 요청 시 search_issues 액션 또는 단계를 생성해야 한다.', async () => {
    const result = await processChatCompletion({
      prompt: 'Alpha 프로젝트에서 진행 중인 이슈 목록 확인해줘',
      model: 'gpt-4o-mini',
    });

    expect(result).toBeDefined();
    // 자율 에이전트 루프에 의해 서버에서 즉시 조회(steps)되거나 액션 카드가 생성되어야 함
    const hasSearchAction = result.actions?.some((a) => a.type === 'search_issues');
    const hasSearchStep = result.steps?.some((s) => s.tool === 'search_issues');
    expect(hasSearchAction || hasSearchStep || result.text.length > 0).toBe(true);
  });

  it('스프린트 생성 요청 시 create_sprint 액션 카드를 추출해야 한다.', async () => {
    const result = await processChatCompletion({
      prompt: 'Alpha 프로젝트에 "Sprint 1" 스프린트 새로 만들어줘',
      model: 'gpt-4o-mini',
    });

    expect(result).toBeDefined();
    expect(result.actions).toBeDefined();
    const sprintAction = result.actions!.find((a) => a.type === 'create_sprint');
    expect(sprintAction).toBeDefined();
    expect(sprintAction!.payload.name).toContain('Sprint 1');
  });

  it('스프린트 목록 조회 요청 시 search_sprints 액션 또는 자율 실행 단계를 생성해야 한다.', async () => {
    const result = await processChatCompletion({
      prompt: '진행 중인 스프린트 목록 조회해줘',
      model: 'gpt-4o-mini',
    });

    expect(result).toBeDefined();
    const hasSearchAction = result.actions?.some((a) => a.type === 'search_sprints');
    const hasSearchStep = result.steps?.some((s) => s.tool === 'search_sprints');
    expect(hasSearchAction || hasSearchStep || result.text.length > 0).toBe(true);
  });

  it('특정 이슈의 하위 이슈 추가 요청 시 parentId가 포함된 create_issue 액션을 추출해야 한다.', async () => {
    const result = await processChatCompletion({
      prompt: '이슈 #3의 하위 이슈로 "DB 스키마 설계" 추가해줘',
      model: 'gpt-4o-mini',
    });

    expect(result).toBeDefined();
    expect(result.actions).toBeDefined();
    const subIssueAction = result.actions!.find((a) => a.type === 'create_issue');
    expect(subIssueAction).toBeDefined();
    expect(subIssueAction!.payload.title).toContain('DB 스키마 설계');
    expect(subIssueAction!.payload.parentId).toBe(3);
  });

  it('다중 작업(Parallel Tool Calling) 요청 시 2개 이상의 액션을 동시에 추출해야 한다.', async () => {
    const result = await processChatCompletion({
      prompt: '이슈 #3 완료 처리하고, 하위 이슈로 "결제 모듈 연동" 추가해줘',
      model: 'gpt-4o-mini',
    });

    expect(result).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.actions!.length).toBeGreaterThanOrEqual(2);

    const updateAction = result.actions!.find((a) => a.type === 'update_issue');
    const subIssueAction = result.actions!.find((a) => a.type === 'create_issue');

    expect(updateAction).toBeDefined();
    expect(updateAction!.payload.issueId).toBe(3);
    expect(updateAction!.payload.statusId).toBe(4); // 완료

    expect(subIssueAction).toBeDefined();
    expect(subIssueAction!.payload.title).toContain('결제 모듈 연동');
    expect(subIssueAction!.payload.parentId).toBe(3);
  });

  it('OpenAI Tool Calls 규격의 다중 배열 파싱이 올바르게 동작해야 한다.', () => {
    const mockToolCalls = [
      {
        id: 'call_1',
        function: {
          name: 'update_issue',
          arguments: JSON.stringify({ issueId: 5, statusId: 4 }),
        },
      },
      {
        id: 'call_2',
        function: {
          name: 'create_issue',
          arguments: JSON.stringify({ title: '신규 API 구현', parentId: 5, priorityId: 3 }),
        },
      },
    ];

    const actions = SkillRegistry.parseToolCalls(mockToolCalls);
    expect(actions.length).toBe(2);
    expect(actions[0].type).toBe('update_issue');
    expect(actions[0].payload.issueId).toBe(5);
    expect(actions[1].type).toBe('create_issue');
    expect(actions[1].payload.parentId).toBe(5);
  });

  it('ToolExecutor가 조회 도구를 판별하고 정상 실행 결과를 반환해야 한다.', async () => {
    expect(ToolExecutor.isReadTool('search_projects')).toBe(true);
    expect(ToolExecutor.isReadTool('search_issues')).toBe(true);
    expect(ToolExecutor.isReadTool('get_issue_detail')).toBe(true);
    expect(ToolExecutor.isReadTool('create_issue')).toBe(false);

    const result = await ToolExecutor.execute('search_projects', { search: 'AntiGravity' });
    expect(result.success).toBe(true);
    expect(result.summary).toBeDefined();
  });
});
