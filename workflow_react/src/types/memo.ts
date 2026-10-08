export interface MemoAttachmentDto {
  id: number;
  memoId: number;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  fileType?: string | null;
  createdAt: string;
}

export interface MemoAuthorDto {
  id: number;
  name: string | null;
  email: string;
  avatar?: string | null;
}

export interface MemoDto {
  id: number;
  workspaceId: number;
  authorId: number;
  title: string;
  content: string;
  isPublic: boolean;
  author?: MemoAuthorDto;
  attachments: MemoAttachmentDto[];
  createdAt: string;
  updatedAt: string;
}

export type MemoFilterType = 'all' | 'public' | 'my';

export interface CreateMemoPayload {
  title: string;
  content?: string;
  isPublic?: boolean;
  workspaceId?: number;
}

export interface UpdateMemoPayload {
  title?: string;
  content?: string;
  isPublic?: boolean;
  workspaceId?: number;
}

export interface UploadMemoAttachmentPayload {
  fileName: string;
  fileSize: number;
  fileUrl: string;
  fileType?: string;
  workspaceId?: number;
}

export const MOCK_MEMO_ITEMS: MemoDto[] = [
  {
    id: 1,
    workspaceId: 1,
    authorId: 1,
    title: '스프린트 기획 회의록',
    content: '# 스프린트 4차 회의\n- 메모 기능 백엔드 이관 완료\n- `@멘션` 기능 검증 예정\n- 첨부파일 5MB 제한 테스트',
    isPublic: true,
    author: { id: 1, name: '관리자', email: 'admin@example.com' },
    attachments: [
      {
        id: 1,
        memoId: 1,
        fileName: 'sprint_plan.pdf',
        fileSize: 204800,
        fileUrl: 'https://example.com/sprint_plan.pdf',
        fileType: 'application/pdf',
        createdAt: '2026-10-06T10:00:00.000Z',
      },
    ],
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z',
  },
  {
    id: 2,
    workspaceId: 1,
    authorId: 1,
    title: '개인 보안 키 보관 메모',
    content: '## 비공개 키 목록\n- 테스트용 토큰 저장 (외부 노출 금지)',
    isPublic: false,
    author: { id: 1, name: '관리자', email: 'admin@example.com' },
    attachments: [],
    createdAt: '2026-10-06T11:00:00.000Z',
    updatedAt: '2026-10-06T11:00:00.000Z',
  },
];

// --- 하위 호환성 레거시 타입 (Issue Memo & LocalStorage 호환용) ---
export type MemoColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';

export interface UserMemoItem {
  id: string;
  userId: number;
  issueId: number | null;
  content: string;
  color: MemoColor;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MemoLegacyFilterType = 'ALL' | 'ISSUE_ONLY' | 'STANDALONE';

export interface MemoFilterState {
  search: string;
  issueFilter: MemoLegacyFilterType;
  color: MemoColor | 'ALL';
}

export interface CreateMemoInput {
  issueId?: number | null;
  content?: string;
  color?: MemoColor;
  isPinned?: boolean;
}

export interface UpdateMemoInput {
  content?: string;
  color?: MemoColor;
  isPinned?: boolean;
  issueId?: number | null;
}
