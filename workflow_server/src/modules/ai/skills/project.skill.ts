import type { ChatbotSkill } from './types.js';

export const projectSkill: ChatbotSkill = {
  name: 'project',
  displayName: '프로젝트 관리',
  description: '프로젝트 목록 조회, 생성, 삭제',
  keywords: ['프로젝트', 'project', '프로젝트목록', '프로젝트생성', '프로젝트삭제'],
  signatures: [
    `search_projects({ search? })`,
    `create_project({ name:string, description? })`,
    `delete_project({ projectId?:number, name? })`,
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'search_projects',
        description: '워크스페이스 내 프로젝트 목록을 검색하거나 조회합니다.',
        parameters: {
          type: 'object',
          properties: {
            search: { type: 'string', description: '프로젝트 이름 또는 설명 검색어' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_project',
        description: '새로운 프로젝트를 생성합니다.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '프로젝트 이름 (필수)' },
            description: { type: 'string', description: '프로젝트 상세 설명' },
          },
          required: ['name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'delete_project',
        description: '기존 프로젝트를 삭제합니다.',
        parameters: {
          type: 'object',
          properties: {
            projectId: { type: 'number', description: '삭제할 프로젝트 ID' },
            name: { type: 'string', description: '삭제할 프로젝트 이름 (ID를 모를 경우)' },
          },
        },
      },
    },
  ],
  parseAction: (name: string, args: Record<string, any>) => {
    const actionId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    if (name === 'search_projects') {
      const suffix = args.search ? ` ("${args.search}" 검색)` : '';
      return {
        id: actionId,
        type: 'search_projects',
        title: `프로젝트 목록 조회${suffix}`,
        payload: args,
        status: 'pending',
      };
    }

    if (name === 'create_project') {
      return {
        id: actionId,
        type: 'create_project',
        title: `프로젝트 생성: "${args.name}"`,
        payload: args,
        status: 'pending',
      };
    }

    if (name === 'delete_project') {
      return {
        id: actionId,
        type: 'delete_project',
        title: args.projectId ? `프로젝트 #${args.projectId} 삭제` : `프로젝트 "${args.name}" 삭제`,
        payload: args,
        status: 'pending',
      };
    }

    return null;
  },
};
