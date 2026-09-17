import type { ChatbotSkill } from './types.js';

export const sprintSkill: ChatbotSkill = {
  name: 'sprint',
  displayName: '스프린트 관리',
  description: '스프린트 목록 조회, 생성, 상태/기간 변경',
  keywords: ['스프린트', 'sprint', '이터레이션', '마일스톤', '스프린트생성', '스프린트조회', '스프린트완료'],
  signatures: [
    `search_sprints({ projectId?:number, projectName?, status?:'active'|'planned'|'completed' })`,
    `create_sprint({ name:string, projectName?, startDate?:'YYYY-MM-DD', endDate?:'YYYY-MM-DD', goal? })`,
    `update_sprint({ sprintId:number, status?:'active'|'planned'|'completed', name?, startDate?, endDate? })`,
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'search_sprints',
        description: '스프린트 목록을 검색하거나 상태별로 조회합니다.',
        parameters: {
          type: 'object',
          properties: {
            projectId: { type: 'number', description: '특정 프로젝트 ID' },
            projectName: { type: 'string', description: '프로젝트 이름' },
            status: { type: 'string', enum: ['active', 'planned', 'completed'], description: '스프린트 상태 (active:진행중, planned:계획됨, completed:완료됨)' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_sprint',
        description: '새로운 스프린트를 생성합니다. 프로젝트 이름(projectName)이 주어지면 별도 프로젝트 조회 없이 즉시 create_sprint를 호출하세요.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '스프린트 이름 (필수)' },
            projectName: { type: 'string', description: '연결할 프로젝트 이름' },
            startDate: { type: 'string', description: '시작일 (YYYY-MM-DD)' },
            endDate: { type: 'string', description: '종료일 (YYYY-MM-DD)' },
            goal: { type: 'string', description: '스프린트 목표' },
          },
          required: ['name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_sprint',
        description: '스프린트의 상태(시작/완료 등), 이름, 일정을 수정합니다.',
        parameters: {
          type: 'object',
          properties: {
            sprintId: { type: 'number', description: '대상 스프린트 ID (필수)' },
            status: { type: 'string', enum: ['active', 'planned', 'completed'], description: '스프린트 상태 변경' },
            name: { type: 'string', description: '새 스프린트 이름' },
            startDate: { type: 'string', description: '시작일 (YYYY-MM-DD)' },
            endDate: { type: 'string', description: '종료일 (YYYY-MM-DD)' },
          },
          required: ['sprintId'],
        },
      },
    },
  ],
  parseAction: (name: string, args: Record<string, any>) => {
    const actionId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    if (name === 'search_sprints') {
      const filters: string[] = [];
      if (args.projectName) filters.push(`프로젝트: ${args.projectName}`);
      if (args.status) {
        const sKo = { active: '진행 중', planned: '계획됨', completed: '완료됨' }[args.status] || args.status;
        filters.push(`상태: ${sKo}`);
      }
      const suffix = filters.length > 0 ? ` (${filters.join(', ')})` : '';

      return {
        id: actionId,
        type: 'search_sprints',
        title: `스프린트 목록 조회${suffix}`,
        payload: args,
        status: 'pending',
      };
    }

    if (name === 'create_sprint') {
      const details: string[] = [];
      if (args.startDate && args.endDate) details.push(`${args.startDate} ~ ${args.endDate}`);
      if (args.projectName) details.push(`프로젝트: ${args.projectName}`);
      const detailStr = details.length > 0 ? ` (${details.join(', ')})` : '';

      return {
        id: actionId,
        type: 'create_sprint',
        title: `스프린트 생성: "${args.name}"${detailStr}`,
        payload: args,
        status: 'pending',
      };
    }

    if (name === 'update_sprint') {
      const details: string[] = [];
      if (args.status) {
        const sKo = { active: '진행 중', planned: '계획됨', completed: '완료됨' }[args.status] || args.status;
        details.push(`상태: ${sKo}`);
      }
      if (args.name) details.push(`이름: ${args.name}`);
      const detailStr = details.length > 0 ? ` (${details.join(', ')})` : '';

      return {
        id: actionId,
        type: 'update_sprint',
        title: `스프린트 #${args.sprintId} 수정${detailStr}`,
        payload: args,
        status: 'pending',
      };
    }

    return null;
  },
};
