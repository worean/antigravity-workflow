import type { ChatbotSkill } from './types.js';

export const issueSkill: ChatbotSkill = {
  name: 'issue',
  displayName: '이슈 및 태스크 관리',
  description: '이슈 조회, 상세 확인, 생성, 수정, 삭제 및 하위 이슈 연결',
  keywords: ['이슈', '일감', '태스크', 'task', '버그', '진행', '마감', '지연', '오늘마감', '오늘할일', '담당', 'issue', '수정', '완료', '하위', '상세', '확인'],
  signatures: [
    `search_issues({ projectName?, status?:'대기'|'진행'|'검토'|'완료', isMy?:bool, dueDateFilter?:'today'|'overdue'|'upcoming', search? })`,
    `get_issue_detail({ issueId:number })`,
    `create_issue({ title:string, parentId?:number, dueDate?:'YYYY-MM-DD', priorityId?:1~4, description? })`,
    `update_issue({ issueId:number, parentId?:number, statusId?:1~4, dueDate?:'YYYY-MM-DD', priorityId?:1~4, title? })`,
    `delete_issue({ issueId?:number, title? })`,
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'search_issues',
        description: '이슈 및 태스크 목록을 검색하거나 필터링하여 조회합니다.',
        parameters: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: '프로젝트 이름' },
            status: { type: 'string', enum: ['대기', '진행', '검토', '완료'], description: '이슈 상태 이름' },
            statusId: { type: 'number', enum: [1, 2, 3, 4], description: '1:대기, 2:진행, 3:검토, 4:완료' },
            isMy: { type: 'boolean', description: '현재 로그인 사용자가 담당자인 이슈만 필터링할지 여부' },
            dueDateFilter: { type: 'string', enum: ['today', 'overdue', 'upcoming'], description: 'today:오늘마감, overdue:기한초과, upcoming:다가오는마감' },
            search: { type: 'string', description: '제목 및 내용 검색 키워드' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_issue_detail',
        description: '특정 이슈의 상세 정보(설명, 담당자, 상위/하위 이슈 관계, 마감일 등)를 조회합니다.',
        parameters: {
          type: 'object',
          properties: {
            issueId: { type: 'number', description: '상세 조회할 대상 이슈 ID (필수)' },
          },
          required: ['issueId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_issue',
        description: '새로운 이슈를 생성합니다. 상위 이슈에 속하는 하위 이슈인 경우 parentId에 상위 이슈 ID를 지정합니다.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '이슈 제목 (필수)' },
            parentId: { type: 'number', description: '상위 이슈의 ID (하위 이슈로 생성할 때 지정)' },
            dueDate: { type: 'string', description: '마감일 (YYYY-MM-DD 형식)' },
            priorityId: { type: 'number', enum: [1, 2, 3, 4], description: '1:낮음, 2:보통, 3:높음, 4:긴급' },
            description: { type: 'string', description: '이슈 상세 설명' },
          },
          required: ['title'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_issue',
        description: '기존 이슈의 상태, 마감일, 우선순위, 상위 이슈(하위 이슈 연결), 제목 등을 변경합니다.',
        parameters: {
          type: 'object',
          properties: {
            issueId: { type: 'number', description: '변경할 대상 이슈의 ID (필수)' },
            parentId: { type: 'number', description: '상위 이슈의 ID (하위 이슈로 편입하거나 변경할 때 지정)' },
            statusId: { type: 'number', enum: [1, 2, 3, 4], description: '1:대기/백로그, 2:진행 중, 3:검토 중, 4:완료' },
            dueDate: { type: 'string', description: '새 마감일 (YYYY-MM-DD 형식)' },
            priorityId: { type: 'number', enum: [1, 2, 3, 4], description: '1:낮음, 2:보통, 3:높음, 4:긴급' },
            title: { type: 'string', description: '새 이슈 제목' },
          },
          required: ['issueId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'delete_issue',
        description: '지정한 이슈를 삭제합니다.',
        parameters: {
          type: 'object',
          properties: {
            issueId: { type: 'number', description: '삭제할 이슈의 고유 ID' },
            title: { type: 'string', description: '삭제할 이슈의 제목 (ID를 모를 경우)' },
          },
        },
      },
    },
  ],
  parseAction: (name: string, args: Record<string, any>) => {
    const actionId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    if (name === 'search_issues') {
      const filters: string[] = [];
      if (args.projectName) filters.push(`프로젝트: ${args.projectName}`);
      if (args.status || args.statusId) {
        const sName = args.status || ['', '대기', '진행', '검토', '완료'][args.statusId] || '';
        filters.push(`상태: ${sName}`);
      }
      if (args.isMy) filters.push('내 담당');
      if (args.dueDateFilter === 'today') filters.push('기한: 오늘까지');
      if (args.dueDateFilter === 'overdue') filters.push('기한: 초과/지연');
      if (args.search) filters.push(`검색: "${args.search}"`);
      const filterText = filters.length > 0 ? ` (${filters.join(', ')})` : '';

      return {
        id: actionId,
        type: 'search_issues',
        title: `이슈 목록 조회${filterText}`,
        payload: args,
        status: 'pending',
      };
    }

    if (name === 'get_issue_detail') {
      return {
        id: actionId,
        type: 'get_issue_detail',
        title: `이슈 #${args.issueId} 상세 정보 확인`,
        payload: args,
        status: 'pending',
      };
    }

    if (name === 'create_issue') {
      const suffixParts: string[] = [];
      if (args.parentId) suffixParts.push(`상위: #${args.parentId}`);
      if (args.dueDate) suffixParts.push(`마감: ${args.dueDate}`);
      const suffix = suffixParts.length > 0 ? ` (${suffixParts.join(', ')})` : '';
      return {
        id: actionId,
        type: 'create_issue',
        title: `이슈 생성: "${args.title}"${suffix}`,
        payload: args,
        status: 'pending',
      };
    }

    if (name === 'update_issue') {
      const details: string[] = [];
      if (args.parentId) details.push(`상위 이슈: #${args.parentId}`);
      if (args.dueDate) details.push(`기한: ${args.dueDate}`);
      if (args.priorityId) {
        const pNames = ['', '낮음', '보통', '높음', '긴급'];
        details.push(`우선순위: ${pNames[args.priorityId] || args.priorityId}`);
      }
      if (args.title) details.push(`제목 변경`);
      if (args.statusId) {
        const sNames = ['', '대기', '진행', '검토', '완료'];
        details.push(`상태: ${sNames[args.statusId] || args.statusId}`);
      }
      const detailStr = details.length > 0 ? ` (${details.join(', ')})` : '';

      return {
        id: actionId,
        type: 'update_issue',
        title: `이슈 #${args.issueId} 수정${detailStr}`,
        payload: args,
        status: 'pending',
      };
    }

    if (name === 'delete_issue') {
      return {
        id: actionId,
        type: 'delete_issue',
        title: args.issueId ? `이슈 #${args.issueId} 삭제` : `이슈 "${args.title}" 삭제`,
        payload: args,
        status: 'pending',
      };
    }

    return null;
  },
};
