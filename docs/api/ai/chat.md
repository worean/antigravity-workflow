# 🤖 AI Chatbot Completion API Specification (`POST /api/ai/chat`)

OpenAI Chat Completions 호환 플랫폼을 연동하여 자연어 대화 및 워크플로우 제어(Function Calling / Tool Execution)를 지원하는 REST API 엔드포인트입니다.

---

## 📌 Endpoint Overview
- **Method**: `POST`
- **Path**: `/api/ai/chat`
- **Authentication**: `Bearer <JWT_ACCESS_TOKEN>` (선택/권장, 비로그인 시에도 일반 안내 가능)

---

## 📥 Request Specification

### Headers
```http
Content-Type: application/json
Authorization: Bearer <token>
```

### Request Body (JSON)
| 필드명 | 타입 | 필수 여부 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- | :--- |
| `prompt` | `string` | **필수** | - | 사용자 질의 또는 명령 프롬프트 |
| `model` | `string` | 선택 | `OPENAI_MODEL` env (기본: `5.6-terra` / `gpt-4o-mini`) | 사용할 LLM 모델 식별자 |
| `history` | `Array<{ role: string, content: string }>` | 선택 | `[]` | 이전 대화 히스토리 (컨텍스트 유지용) |

### Request Example
```json
{
  "prompt": "새로운 버그 이슈를 만들어줘. 제목은 '로그인 만료 처리 개선'이야.",
  "model": "5.6-terra",
  "history": [
    { "role": "user", "content": "안녕" },
    { "role": "assistant", "content": "안녕하세요! 무엇을 도와드릴까요?" }
  ]
}
```

---

## 📤 Response Specification

### Response Body (JSON)
| 필드명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `text` | `string` | AI 모델의 자연어 답변 텍스트 (Markdown 형식) |
| `actions` | `ChatbotAction[]` | AI가 사용자의 의도를 파악하여 제안한 시스템 기능 실행 카드 목록 |
| `usage` | `ChatTokenUsageDto` | 실시간 토큰 사용량(`promptTokens`, `completionTokens`, `totalTokens`) 및 예상 비용(`estimatedCostKrw`) |

### Supported Action Types & Skills Architecture
챗봇 백엔드는 **스킬 레지스트리(`SkillRegistry`)** 기반의 3대 독립 도메인 스킬(`issueSkill`, `projectSkill`, `sprintSkill`)로 모듈화되어 있으며, 사용자 질문에 맞춰 필요한 도구만 동적으로 선별 주입(Dynamic Tool Routing)합니다.

| 스킬 도메인 | 액션 타입 | 설명 | 주요 페이로드 |
| :--- | :--- | :--- | :--- |
| **Issue** | `search_issues` | 조건별 이슈 목록 및 건수 조회 | `{ projectName?: string, projectId?: number, status?: string, isMy?: boolean, dueDateFilter?: 'today'\|'overdue'\|'upcoming', search?: string }` |
| **Issue** | `create_issue` | 신규 일감/이슈 생성 | `{ title: string, description?: string, priorityId?: number, dueDate?: string, plannedStartDate?: string }` |
| **Issue** | `update_issue` | 기존 일감/이슈 수정 | `{ issueId: number, title?: string, description?: string, priorityId?: number, statusId?: number, dueDate?: string, plannedStartDate?: string }` |
| **Issue** | `delete_issue` | 기존 일감/이슈 삭제 | `{ issueId?: number, title?: string }` |
| **Project** | `search_projects`| 등록된 프로젝트 목록 조회 | `{ search?: string }` |
| **Project** | `create_project` | 신규 프로젝트 기획 및 생성 | `{ name: string, description?: string }` |
| **Project** | `delete_project` | 기존 프로젝트 삭제 | `{ projectId?: number, name?: string }` |
| **Sprint** | `search_sprints` | 스프린트 목록 조회 | `{ projectId?: number, projectName?: string, status?: 'active'\|'planned'\|'completed' }` |
| **Sprint** | `create_sprint`  | 신규 스프린트 생성 | `{ name: string, projectName?: string, projectId?: number, startDate?: string, endDate?: string, goal?: string }` |
| **Sprint** | `update_sprint`  | 스프린트 상태 및 기간 수정 | `{ sprintId: number, name?: string, status?: string, startDate?: string, endDate?: string, goal?: string }` |
| **Common** | `navigate`       | 특정 탭/화면으로 이동 | `{ tab: string, sprintId?: number }` |

### Response Example
```json
{
  "text": "네, 요청하신 내용을 바탕으로 버그 이슈 생성을 준비했습니다. 아래 카드의 실행 버튼을 누르시면 즉시 등록됩니다.",
  "actions": [
    {
      "id": "act-1726456000000",
      "type": "create_issue",
      "title": "이슈 생성: \"로그인 만료 처리 개선\"",
      "payload": {
        "title": "로그인 만료 처리 개선",
        "description": "AI Chatbot을 통해 제안된 버그 수정 일감입니다.",
        "priorityId": 2
      },
      "status": "pending"
    }
  ]
}
```
