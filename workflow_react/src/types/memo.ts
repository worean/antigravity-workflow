export type MemoColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';

export interface UserMemoItem {
  id: string;              // 클라이언트 생성 고유 식별자 (UUID v4)
  userId: number;          // 로그인 사용자 ID
  issueId: number | null;  // 연계된 이슈 ID (독립 메모인 경우 null)
  content: string;         // Markdown 텍스트 내용
  color: MemoColor;        // 포스트잇 색상
  isPinned: boolean;       // 즐겨찾기/상단 고정 여부
  createdAt: string;       // ISO 8601 일시
  updatedAt: string;       // ISO 8601 일시
}

export type MemoFilterType = 'ALL' | 'ISSUE_ONLY' | 'STANDALONE';

export interface MemoFilterState {
  search: string;
  issueFilter: MemoFilterType;
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
