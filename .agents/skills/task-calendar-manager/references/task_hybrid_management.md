# 📅 하이브리드 태스크 및 구글 캘린더 동기화 시스템 운영 지침 (SOP)

이 지침서는 로컬 SQLite 데이터베이스, 클라우드 협업 도구(Notion), 그리고 구글 캘린더(Google Calendar)를 연동하여 태스크(업무), 프로젝트(Project), 마일스톤(Milestone)을 통합 관리하는 워크플로우의 구성, 운영 방식 및 장애 조치 절차를 정의합니다.

---

## 1. 시스템 아키텍처 개요

본 시스템은 에이전트 자동화의 안정성을 보장하기 위해 3계층 아키텍처(Layer 1: Directive, Layer 2: Orchestration, Layer 3: Execution)를 기반으로 작동하며, 세 가지 저장소(저장소 2개 + 캘린더 1개)를 조율합니다.

1. **시간 관리 계층 (Google Calendar)**: 실제 업무 집중 시간(Timeblock) 확보 및 마감 알림.
2. **클라우드 시각화 계층 (Notion Database)**: 웹 및 모바일에서의 진척도(칸반 보드) 확인 및 수동 관리.
3. **로컬 무장애 계층 (SQLite Database)**: 네트워크 오프라인 대처용 고속 캐시 및 유니크 ID 매핑 테이블 보관.

---

## 1.5. 업무(Task)와 일정(Event)의 구분 및 연동 규칙

> [!IMPORTANT]
> 본 시스템은 시간 관리(Calendar)와 일감 관리(Task Database)를 효율적으로 병행하기 위해 구글 캘린더 연동 시 다음 규칙을 적용합니다.
> 1. **캘린더 지정 및 자동 매핑**:
>    - 구글 캘린더 연동 시 기본(`primary`) 캘린더가 아닌, 사용자의 **"직장" 캘린더**에 일정을 기한 기준으로 등록 및 관리합니다.
>    - 구글 계정에 "직장" 캘린더가 없는 경우, 시스템이 자동으로 생성하여 사용합니다.
> 2. **시간 차단(Calendar 등록) 조건**:
>    - 업무의 제목(Title) 또는 설명(Description)에 **"보고", "전달", "미팅"** 단어가 포함된 경우에만 구글 캘린더의 "직장" 캘린더에 일정을 등록합니다.
>    - 그 외 일반 업무는 데이터베이스에만 태스크로 생성합니다.
> 3. **설명(Description) 상세 포맷**:
>    - 캘린더 일정 본문에 업무의 프로젝트명, 마일스톤, 우선순위, 진척 상태 및 세부 설명 내용을 구조화된 템플릿 형태로 기록하여 시간 블록 안에서 상세 내용을 바로 파악할 수 있도록 돕습니다.
> 4. **업무 완료 시 제목 변경 연동**:
>    - 업무의 상태가 **`DONE` (완료)**으로 변경되면, 연동된 캘린더 일정 제목 앞에 **`[완료]`** 접두사를 자동으로 추가합니다.
>    - 완료 상태에서 다시 진행 상태로 돌아오면 `[완료]` 접두사는 제거됩니다.

---

## 2. 사전 준비 및 환경 설정

`.env` 파일의 `TASK_STORAGE_MODE` 설정값에 따라 저장소 작동 모드를 전환합니다.
* **`sqlite`**: 로컬 SQLite 전용 모드로 노션 API 연동 없이 고속 동작합니다.
* **`hybrid`**: SQLite 로컬 캐시와 Notion 데이터베이스 양방향 동기화 모드입니다.

```env
# 1. 저장소 작동 모드 (sqlite: 로컬 전용 / hybrid: SQLite + Notion 양방향 동기화)
TASK_STORAGE_MODE=sqlite
# 2. SQLite 로컬 DB 경로 (절대 경로 지정)
SQLITE_DB_PATH=c:/Users/admin/antigravity-workflow/.tmp/task_board.db

# (hybrid 모드 사용 시 필수 설정)
NOTION_API_KEY=ntn_xxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=yyyyyyyyyyyyyyyyyyyy
NOTION_PROJECT_DB_ID=zzzzzzzzzzzzzzzzzzzz
NOTION_MILESTONE_DB_ID=wwwwwwwwwwwwwwwwwwww
```

> [!IMPORTANT]
> **Notion 데이터베이스 컬럼 구성 요건**:
> 
> **1. Issues(Task) 데이터베이스**:
> * `summary` (Title 타입): 태스크 제목
> * `status` (Select 타입): 진행 상태 (TODO, INPROGRESS, REVIEW, DONE)
> * `priority` (Select 타입): 우선순위 (LOWEST, LOW, MEDIUM, HIGH, HIGHEST)
> * `description` (Rich Text 타입): 설명
> * `dueDate` (Date 타입): 기한
> * `googleEventId` (Rich Text 타입): 구글 캘린더 이벤트 ID
> * `project` (Relation 타입): Projects 데이터베이스 연동
> * `milestone` (Relation 타입): Milestones 데이터베이스 연동
> * `labels` (Multi-select 타입): 다중 선택 라벨 태그
> 
> **2. Projects 데이터베이스**:
> * `name` (Title 타입): 프로젝트명
> * `key` (Rich Text 타입): 프로젝트 키 (예: DFT)
> * `description` (Rich Text 타입): 설명
> * `status` (Select 타입): 진행 상태
> * `priority` (Select 타입): 우선순위
> * `dueDate` (Date 타입): 기한
> 
> **3. Milestones 데이터베이스**:
> * `title` (Title 타입): 마일스톤명
> * `description` (Rich Text 타입): 설명
> * `status` (Select 타입): 진행 상태
> * `priority` (Select 타입): 우선순위
> * `project` (Relation 타입): Projects 데이터베이스 연동
> * `dueDate` (Date 타입): 기한
> 
> **4. SQLite 전용 캘린더 연동 테이블 (IssueCalendarLink)**:
> * `id` (INTEGER, PK): 기본 키 (AUTOINCREMENT)
> * `issueId` (INTEGER, FK): 연동된 Issue.id (ON DELETE CASCADE)
> * `calendarId` (TEXT): 구글 캘린더 고유 ID
> * `googleEventId` (TEXT, UNIQUE): 구글 캘린더 이벤트 고유 ID
> * `syncStatus` (TEXT): 동기화 상태 (SYNCED, PENDING_SYNC, ERROR)
> * `lastSyncedAt` (DATETIME): 최종 동기화 일시
> 
> **5. SQLite 전용 댓글 테이블 (Comment)**:
> * `id` (INTEGER, PK): 기본 키 (AUTOINCREMENT)
> * `content` (TEXT): 댓글 내용
> * `authorId` (INTEGER, FK): 작성자 User.id (FOREIGN KEY)
> * `issueId` (INTEGER, FK): 연동된 Issue.id (ON DELETE CASCADE)
> * `parentId` (INTEGER, FK): 대댓글 작성을 위한 자기참조 parent Comment.id (NULL 허용, ON DELETE SET NULL)
> * `createdAt` (DATETIME): 생성 일시
> * `updatedAt` (DATETIME): 수정 일시
> 
> * **댓글 조회 시 유효성 마스킹 규칙**:
>   - `parentId`가 `None`이거나 `0`인 경우: 최상위 댓글이므로 본문(`content`)을 그대로 반환합니다.
>   - `parentId`가 `0`이 아닌 특정 ID 값인 경우: DB의 `Comment` 테이블에서 해당 ID를 가진 부모 댓글이 존재하는지 조회합니다.
>     - 만약 부모 댓글이 존재하지 않으면(삭제된 경우): 조회용 본문을 강제로 **"삭제된 댓글의 댓글입니다."** 로 마스킹 처리하여 반환합니다.
>     - 만약 부모 댓글이 존재하면: 원래의 본문(`content`)을 반환합니다.
> 
> ---

## 3. 주요 명령어 및 실행 가이드

### A. 데이터베이스 초기화 및 기본값 세팅
처음 시스템을 운영하거나 데이터베이스를 재구축할 때 실행합니다.
```powershell
python execution/initialize_db.py
```
* 로컬의 `.tmp/task_board.db` 파일이 생성되고, `schema.prisma` 규격에 맞는 테이블(Project, Milestone, Issue 및 _IssueToLabel 등) 및 기본 데이터가 세팅(Migration & Seeding)됩니다.

### B. 신규 업무(태스크) 등록 및 일정 블록화
명령줄 클라이언트를 사용하여 새로운 태스크를 생성합니다.

#### 기본 생성 예시
```powershell
python execution/task_cli.py --title "SW개발 주간 검토" --desc "주간 아키텍처 및 진척 상황 검토회의" --due "2026-06-19T14:00:00" --project "DFT"
```

#### 프로젝트, 마일스톤 및 라벨 지정 생성 예시 (NEW)
```powershell
python execution/task_cli.py --title "Arxml 완료보고서 검증" --due "2026-06-25T18:00:00" --project "DFT" --milestone "Milestone 1" --labels "ARXML,보고서" --yes
```
* **마일스톤 자동 생성 편의 기능**:
  - 지정한 `--milestone` 이름(예: `Milestone 1`)이 해당 프로젝트 내에 존재하지 않는 경우, 비즈니스 워크플로우가 자동으로 새 마일스톤 레코드를 데이터베이스에 생성하여 태스크와 바인딩해 줍니다.
* **라벨 Multi-select 연동**:
  - `--labels`로 전달된 쉼표 구분 목록은 SQLite의 Label 관계(`_IssueToLabel`) 테이블로 동기화되어 태그 분류를 지원합니다.

* **동작 흐름**:
  1. 구글 캘린더에 1시간짜리 시간 차단 일정(`[업무] Arxml 완료보고서 검증`) 등록. (제목/설명에 '보고/전달/미팅'이 포함되어 자동 연동됨)
  2. 로컬 SQLite DB의 `Issue` 테이블에 해당 태스크를 저장하고, `IssueCalendarLink` 테이블에 구글 캘린더 고유 ID를 매핑 연동하여 레코드를 저장합니다.

---

## 4. 중복 및 유사 업무 감지 프로토콜

태스크 추가 시, 제안한 날짜의 **전후 7일 범위** 내에 비슷한 업무명이 SQLite에 이미 존재하는 경우 대화형 알림 경고가 나타납니다.

```
[알림] 데이터베이스에 이미 비슷한 이름의 업무가 존재합니다 (±7일 범위):
  [1] 제목: 주택담보대출 업무 (기한: 2026-06-19T10:00:00, 상태: TODO)

 이 기존 업무를 어떻게 처리하시겠습니까?
  [A] 기존 업무 정보를 새 시간/설명으로 업데이트 (Update)
  [B] 기존 업무를 그대로 두고 새 업무를 추가 등록 (Ignore & Create)
  [C] 태스크 등록 작업 취소 (Abort)
 선택 (A/B/C): 
```

* **[A] Update 선택 시**: 
  - 기존 구글 캘린더 일정이 새 기한으로 PATCH 수정됩니다.
  - 노션 데이터베이스의 기존 페이지 카드 정보가 업데이트됩니다.
  - SQLite 내 기존 업무 정보의 `updatedAt`이 갱신됩니다.
* **[B] Create 선택 시**: 
  - 기존 데이터를 무시하고 캘린더, 노션, 로컬 DB에 완전히 새로운 태스크를 생성합니다.
* **[C] Abort 선택 시**: 
  - 프로세스를 예외 없이 안전하게 중단합니다.

---

## 5. 문제 해결 및 장애 조치 (Self-annealing)

### 노션 통신 에러 발생 시 (`syncStatus` = 'ERROR' / 'PENDING_SYNC')
인터넷 단절이나 API 속성 설정 누락(예: 노션에 `labels` 컬럼이 없는 경우 등)으로 노션 전송에 실패할 경우, CLI는 SQLite에 로컬 데이터를 안전하게 커밋하고 `syncStatus` 컬럼을 `ERROR` 상태로 남겨둡니다.

**조치 사항**:
1. `.env` 파일의 `NOTION_API_KEY`, `NOTION_DATABASE_ID`, `NOTION_PROJECT_DB_ID`, `NOTION_MILESTONE_DB_ID` 설정을 검증합니다.
2. 노션 Issues 데이터베이스에 `labels` (Multi-select), `project` (Relation), `milestone` (Relation) 속성이 규격대로 생성되었는지 점검합니다.
3. 추후 주기적 동기화 배치 데몬을 통해 `syncStatus = 'ERROR'`인 레코드를 재전송하여 데이터 합치성을 복원합니다.

---

## 6. 향후 PostgreSQL 데이터베이스 연동 전환 지침

로컬 SQLite 환경에서 운영 중인 데이터를 PostgreSQL 통합 데이터베이스 서버로 이전하거나 연동 모드를 전환하는 절차는 다음과 같습니다.

### A. Prisma Schema 수정
1. `schema.prisma` 파일의 `datasource db` 설정을 다음과 같이 수정합니다.
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. `.env` 파일에 연동할 PostgreSQL 접속 정보 문자열을 `DATABASE_URL` 변수로 추가합니다.
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/db_name?schema=public"
   ```

### B. 데이터 마이그레이션 실행
1. 데이터베이스 구조 생성 및 마이그레이션:
   ```powershell
   npx prisma migrate dev --name init
   ```
2. SQLite에 적재되어 있던 데이터를 PostgreSQL 서버로 내보내기/가져오기 도구(예: `pgloader` 또는 SQLite to PostgreSQL 스크립트)를 사용해 마이그레이션합니다.

### C. 파이썬 리포지토리 코드 업데이트
1. `execution/task_repository.py` 내의 `TaskRepository` 인터페이스를 구현하는 `PostgreSQLRepository` 클래스를 생성합니다.
2. PostgreSQL 쿼리 문법(SQLite의 `AUTOINCREMENT` -> `SERIAL`, `COLLATE NOCASE` -> `ILIKE` 또는 `LOWER()`)에 유의하여 쿼리를 매핑하거나, Prisma Python Client를 적용해 데이터 조작 로직을 일치시킵니다.
