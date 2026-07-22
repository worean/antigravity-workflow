# -*- coding: utf-8-sig -*-
"""
하이브리드 태스크 관리 CLI 클라이언트
(Layer 3: Execution - CLI Client)
- UTF-8 with BOM 인코딩을 적용합니다.
"""

import os
import sys
import argparse
import datetime
import sqlite3

# 공통 모듈 임포트
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from calendar_common import parse_input_time
from task_repository import SQLiteRepository, NotionRepository, HybridRepository
from task_service import TaskService

def load_custom_env(env_path):
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        parts = line.split("=", 1)
                        key = parts[0].strip()
                        val = parts[1].strip()
                        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                            val = val[1:-1]
                        os.environ[key] = val
        except Exception:
            pass

# .env 로드
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_custom_env(os.path.join(project_root, ".env"))

def resolve_project_id(project_key: str, db_path: str) -> int:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM Project WHERE key = ? COLLATE NOCASE", (project_key,))
        row = cursor.fetchone()
        if row:
            return row[0]
        return 1  # 기본값
    finally:
        conn.close()

def resolve_milestone_id(milestone_title: str, project_id: int, repo, service) -> int:
    if not milestone_title:
        return None
        
    db_path = repo.sqlite_repo.db_path if hasattr(repo, 'sqlite_repo') else repo.db_path
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM Milestone WHERE title = ? AND projectId = ?", (milestone_title, project_id))
        row = cursor.fetchone()
        if row:
            return row[0]
            
        # 존재하지 않을 경우 자동 생성
        print(f"[정보] 마일스톤 '{milestone_title}'이(가) 존재하지 않아 신규 생성합니다.")
        milestone_payload = {
            "title": milestone_title,
            "description": f"자동 생성된 {milestone_title} 마일스톤",
            "projectId": project_id,
            "status": "TODO",
            "priority": "MEDIUM"
        }
        
        if hasattr(service, 'create_milestone_workflow'):
            created = service.create_milestone_workflow(milestone_payload)
            return created.get("id")
        else:
            created = repo.save_milestone(milestone_payload)
            return created.get("id")
    finally:
        conn.close()

def find_similar_tasks(title: str, due_date_iso: str, db_path: str) -> list:
    """데이터베이스에서 입력된 날짜 기준 ±7일 범위 내의 유사 이슈들을 검색합니다."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    target_dt = datetime.datetime.fromisoformat(due_date_iso)
    time_min = (target_dt - datetime.timedelta(days=7)).isoformat()
    time_max = (target_dt + datetime.timedelta(days=7)).isoformat()
    
    try:
        cursor.execute("""
            SELECT i.id, i.title, i.dueDate, i.notionPageId, i.googleEventId,
                   s.name as status, p.name as priority, t.name as type
            FROM Issue i
            LEFT JOIN IssueStatus s ON i.statusId = s.id
            LEFT JOIN IssuePriority p ON i.priorityId = p.id
            LEFT JOIN IssueType t ON i.typeId = t.id
            WHERE i.dueDate BETWEEN ? AND ?
        """, (time_min, time_max))
        existing_issues = [dict(row) for row in cursor.fetchall()]
    except Exception:
        existing_issues = []
    finally:
        conn.close()
        
    def is_similar(s1, s2):
        if not s1 or not s2:
            return False
        s1, s2 = s1.strip().lower(), s2.strip().lower()
        if s1 in s2 or s2 in s1:
            return True
        s1_clean = s1.replace(" ", "")
        s2_clean = s2.replace(" ", "")
        if s1_clean in s2_clean or s2_clean in s1_clean:
            return True
        words1 = [w for w in s1.split() if len(w) >= 2]
        words2 = [w for w in s2.split() if len(w) >= 2]
        for w in words1:
            if w in s2:
                return True
        for w in words2:
            if w in s1:
                return True
        return False
        
    return [issue for issue in existing_issues if is_similar(title, issue.get('title', ''))]

def main():
    parser = argparse.ArgumentParser(description="하이브리드 태스크 관리 및 일정 동기화 CLI")
    parser.add_argument("--title", type=str, required=True, help="태스크 제목")
    parser.add_argument("--desc", type=str, help="상세 설명")
    parser.add_argument("--due", type=str, help="완료 기한 및 일정 시작 시간 (예: '2026-06-19T10:00:00')")
    parser.add_argument("--start", type=str, help="업무 시작 일시 (예: '2026-06-17T09:00:00')")
    parser.add_argument("--skip-calendar", action="store_true", help="구글 캘린더 연동 및 일정 생성을 생략합니다.")
    parser.add_argument("--project", type=str, default="DFT", help="대상 프로젝트 키 (기본값: DFT)")
    parser.add_argument("--status", type=str, default="TODO", choices=["TODO", "INPROGRESS", "REVIEW", "DONE"], help="진척 상태")
    parser.add_argument("--priority", type=str, default="MEDIUM", choices=["LOWEST", "LOW", "MEDIUM", "HIGH", "HIGHEST"], help="우선순위")
    parser.add_argument("--type", type=str, default="TASK", choices=["TASK", "BUG", "STORY"], help="이슈 유형")
    parser.add_argument("--parent", type=int, help="상위 태스크(부모 이슈) ID")
    parser.add_argument("--milestone", type=str, help="마일스톤 타이틀 (존재하지 않으면 자동 생성)")
    parser.add_argument("--labels", type=str, help="쉼표로 구분된 라벨 목록 (예: 'ARXML,보고서')")
    parser.add_argument("--yes", action="store_true", help="사용자 동의 절차 생략")
    parser.add_argument("--duplicate-mode", type=str, default="create", choices=["create", "update", "abort"],
                        help="비슷한 이슈 감지 시 처리 모드")
    
    args = parser.parse_args()
    
    db_path = os.getenv("SQLITE_DB_PATH") or os.path.join(project_root, ".tmp", "task_board.db")
    api_key = os.getenv("NOTION_API_KEY")
    database_id = os.getenv("NOTION_DATABASE_ID")
    project_db_id = os.getenv("NOTION_PROJECT_DB_ID")
    milestone_db_id = os.getenv("NOTION_MILESTONE_DB_ID")
    
    storage_mode = os.getenv("TASK_STORAGE_MODE", "sqlite").lower()
    
    # 1. 컴포넌트 빌드
    sqlite_repo = SQLiteRepository(db_path)
    
    # storage_mode가 hybrid이고 노션 API 변수가 존재하면 NotionRepository/HybridRepository 활성화
    if storage_mode == "hybrid" and api_key and database_id:
        notion_repo = NotionRepository(
            api_key=api_key,
            database_id=database_id,
            project_database_id=project_db_id,
            milestone_database_id=milestone_db_id
        )
        repo = HybridRepository(sqlite_repo, notion_repo)
    else:
        if storage_mode == "hybrid":
            print("[경고] TASK_STORAGE_MODE가 hybrid이지만 노션 환경변수가 누락되어 로컬 SQLite 전용 모드로 구동합니다.")
        else:
            print("[알림] 설정(TASK_STORAGE_MODE)에 따라 로컬 SQLite 전용 모드로 구동합니다.")
        repo = sqlite_repo
        
    service = TaskService(repo)
    
    # 2. 날짜 파싱 및 프로젝트 ID 조회
    due_iso = parse_input_time(args.due) if args.due else datetime.datetime.now().astimezone().isoformat()
    project_id = resolve_project_id(args.project, db_path)
    
    # 마일스톤 ID 조회 및 자동 생성 처리
    milestone_id = None
    if args.milestone:
        milestone_id = resolve_milestone_id(args.milestone, project_id, repo, service)
        
    # 라벨 파싱
    label_list = []
    if args.labels:
        label_list = [l.strip() for l in args.labels.split(",") if l.strip()]
        
    # 3. 중복 및 유사 이슈 체크 (최근 ±7일 범위)
    similar_tasks = find_similar_tasks(args.title, due_iso, db_path)
    
    duplicate_action = "create"
    target_task = None
    
    if similar_tasks:
        target_task = similar_tasks[0]
        print(f"\n[알림] 데이터베이스에 이미 비슷한 이름의 업무가 존재합니다 (±7일 범위):")
        for idx, task in enumerate(similar_tasks, 1):
            print(f"  [{idx}] 제목: {task.get('title')} (기한: {task.get('dueDate')}, 상태: {task.get('status')})")
        print()
        
        if args.yes:
            duplicate_action = args.duplicate_mode
            print(f" -> 비대화형 실행 옵션에 따라 중복 태스크 처리 방식을 '{duplicate_action}'로 진행합니다.")
        else:
            try:
                print(" 이 기존 업무를 어떻게 처리하시겠습니까?")
                print("  [A] 기존 업무 정보를 새 시간/설명으로 업데이트 (Update)")
                print("  [B] 기존 업무를 그대로 두고 새 업무를 추가 등록 (Ignore & Create)")
                print("  [C] 태스크 등록 작업 취소 (Abort)")
                choice = input(" 선택 (A/B/C): ").strip().upper()
                
                if choice == "A":
                    duplicate_action = "update"
                elif choice == "B":
                    duplicate_action = "create"
                else:
                    duplicate_action = "abort"
            except EOFError:
                print("[ERROR] 비대화형 입력 오류로 작업을 중단합니다.", file=sys.stderr)
                sys.exit(1)
                
    if duplicate_action == "abort":
        print(" -> 태스크 등록 작업이 취소되었습니다.")
        sys.exit(0)
        
    task_payload = {
        "title": args.title,
        "description": args.desc or "",
        "status": args.status,
        "priority": args.priority,
        "type": args.type,
        "parentId": args.parent,
        "plannedStartDate": args.start,
        "dueDate": due_iso,
        "projectId": project_id,
        "milestoneId": milestone_id,
        "labels": label_list,
        "skipCalendar": args.skip_calendar,
        "authorId": 1  # 기본 admin 유저 ID
    }
    
    if duplicate_action == "update" and target_task:
        print(f" -> 기존 업무 '{target_task.get('title')}' (ID: {target_task.get('id')}) 정보를 수정 및 재배치합니다...")
        task_payload["id"] = target_task.get("id")
        task_payload["notionPageId"] = target_task.get("notionPageId")
        task_payload["googleEventId"] = target_task.get("googleEventId")
        
        # 서비스의 업데이트 워크플로우를 호출하여 DB 및 구글 캘린더 동기화 처리를 단일 위임합니다.
        service.update_task_workflow(task_payload)
        
        print("[SUCCESS] 업무 업데이트가 완료되었습니다.")
        sys.exit(0)

    # 신규 등록
    print("\n" + "="*50)
    print(f" 📅 등록할 {'하이브리드 ' if isinstance(repo, HybridRepository) else ''}태스크 정보 요약")
    print("-"*50)
    print(f"  - 제목: {args.title}")
    if args.desc:
        print(f"  - 설명: {args.desc}")
    print(f"  - 완료 기한: {due_iso}")
    print(f"  - 상태: {args.status} | 우선순위: {args.priority}")
    if args.milestone:
        print(f"  - 마일스톤: {args.milestone}")
    if label_list:
        print(f"  - 라벨: {', '.join(label_list)}")
    print(f"  - 연동 모드: {'SQLite + Notion (하이브리드)' if isinstance(repo, HybridRepository) else 'SQLite 전용'}")
    print("="*50 + "\n")
    
    if not args.yes:
        try:
            confirm = input(" 이 태스크를 등록하고 구글 캘린더에 연동하시겠습니까? (y/N): ").strip().lower()
            if confirm not in ['y', 'yes']:
                print(" -> 등록 작업이 사용자에 의해 취소되었습니다.")
                sys.exit(0)
        except EOFError:
            print("[ERROR] 비대화형 환경 실행. --yes 플래그 누락으로 취소합니다.", file=sys.stderr)
            sys.exit(1)
            
    # 서비스 실행
    service.create_task_workflow(task_payload)

if __name__ == '__main__':
    main()
