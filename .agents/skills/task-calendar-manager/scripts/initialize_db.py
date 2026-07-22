# -*- coding: utf-8-sig -*-
"""
SQLite 데이터베이스 초기화 및 기본 데이터 세팅 스크립트
(Layer 3: Execution - DB Initialization)
- UTF-8 with BOM 인코딩을 적용합니다.
"""

import os
import sys
import sqlite3

def load_custom_env(env_path):
    """.env 파일을 수동으로 파싱하여 os.environ에 적재합니다."""
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        parts = line.split("=", 1)
                        key = parts[0].strip()
                        val = parts[1].strip()
                        # 큰따옴표나 작은따옴표 제거
                        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                            val = val[1:-1]
                        os.environ[key] = val
        except Exception as e:
            print(f"[경고] .env 로드 중 오류 발생: {e}", file=sys.stderr)

# 루트 경로의 .env 파일 로드
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_custom_env(os.path.join(project_root, ".env"))

# DB 파일 경로 결정
db_path = os.getenv("SQLITE_DB_PATH")
if not db_path:
    db_path = os.path.join(project_root, ".tmp", "task_board.db")

# DB 디렉토리 생성
db_dir = os.path.dirname(db_path)
if db_dir and not os.path.exists(db_dir):
    os.makedirs(db_dir, exist_ok=True)

def initialize_database():
    print(f"-> SQLite 데이터베이스를 초기화합니다: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 외래키 활성화
        cursor.execute("PRAGMA foreign_keys = ON;")
        
        # 1. User 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS User (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            password TEXT,
            googleId TEXT UNIQUE,
            pushToken TEXT,
            googleAccessToken TEXT,
            googleRefreshToken TEXT,
            googleTokenExpiry DATETIME,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # 2. ProjectStatus 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS ProjectStatus (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL DEFAULT 'TODO',
            isSystem INTEGER NOT NULL DEFAULT 0
        );
        """)
        
        # 3. ProjectPriority 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS ProjectPriority (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            level INTEGER NOT NULL DEFAULT 0,
            color TEXT,
            isSystem INTEGER NOT NULL DEFAULT 0
        );
        """)
        
        # 4. Project 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS Project (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            key TEXT UNIQUE NOT NULL,
            ownerId INTEGER NOT NULL,
            statusId INTEGER NOT NULL DEFAULT 1,
            priorityId INTEGER NOT NULL DEFAULT 1,
            plannedStartDate DATETIME,
            dueDate DATETIME,
            actualStartDate DATETIME,
            actualEndDate DATETIME,
            syncStatus TEXT DEFAULT 'SYNCED',
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(ownerId) REFERENCES User(id),
            FOREIGN KEY(statusId) REFERENCES ProjectStatus(id) ON DELETE SET DEFAULT,
            FOREIGN KEY(priorityId) REFERENCES ProjectPriority(id) ON DELETE SET DEFAULT
        );
        """)
        
        # 5. MilestoneStatus 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MilestoneStatus (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL DEFAULT 'TODO',
            isSystem INTEGER NOT NULL DEFAULT 0
        );
        """)
        
        # 6. MilestonePriority 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MilestonePriority (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            level INTEGER NOT NULL DEFAULT 0,
            color TEXT,
            isSystem INTEGER NOT NULL DEFAULT 0
        );
        """)
        
        # 7. Milestone 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS Milestone (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            projectId INTEGER NOT NULL,
            statusId INTEGER NOT NULL DEFAULT 1,
            priorityId INTEGER NOT NULL DEFAULT 1,
            plannedStartDate DATETIME,
            dueDate DATETIME,
            actualStartDate DATETIME,
            actualEndDate DATETIME,
            syncStatus TEXT DEFAULT 'SYNCED',
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(projectId) REFERENCES Project(id) ON DELETE CASCADE,
            FOREIGN KEY(statusId) REFERENCES MilestoneStatus(id) ON DELETE SET DEFAULT,
            FOREIGN KEY(priorityId) REFERENCES MilestonePriority(id) ON DELETE SET DEFAULT
        );
        """)

        # 8. IssueType 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS IssueType (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            icon TEXT,
            isSystem INTEGER NOT NULL DEFAULT 0
        );
        """)
        
        # 9. IssuePriority 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS IssuePriority (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            level INTEGER NOT NULL DEFAULT 0,
            color TEXT,
            isSystem INTEGER NOT NULL DEFAULT 0
        );
        """)
        
        # 10. IssueStatus 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS IssueStatus (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL DEFAULT 'TODO',
            isSystem INTEGER NOT NULL DEFAULT 0
        );
        """)
        
        # 11. Issue 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS Issue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            typeId INTEGER NOT NULL DEFAULT 1,
            priorityId INTEGER NOT NULL DEFAULT 1,
            statusId INTEGER NOT NULL DEFAULT 1,
            plannedStartDate DATETIME,
            dueDate DATETIME,
            actualStartDate DATETIME,
            actualEndDate DATETIME,
            syncStatus TEXT DEFAULT 'SYNCED',
            parentId INTEGER,
            projectId INTEGER NOT NULL,
            milestoneId INTEGER,
            authorId INTEGER NOT NULL,
            assigneeId INTEGER,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(typeId) REFERENCES IssueType(id) ON DELETE SET DEFAULT,
            FOREIGN KEY(priorityId) REFERENCES IssuePriority(id) ON DELETE SET DEFAULT,
            FOREIGN KEY(statusId) REFERENCES IssueStatus(id) ON DELETE SET DEFAULT,
            FOREIGN KEY(parentId) REFERENCES Issue(id) ON DELETE SET NULL,
            FOREIGN KEY(projectId) REFERENCES Project(id) ON DELETE CASCADE,
            FOREIGN KEY(milestoneId) REFERENCES Milestone(id) ON DELETE SET NULL,
            FOREIGN KEY(authorId) REFERENCES User(id),
            FOREIGN KEY(assigneeId) REFERENCES User(id)
        );
        """)
        
        # 12. Comment 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS Comment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            authorId INTEGER NOT NULL,
            issueId INTEGER NOT NULL,
            parentId INTEGER,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(authorId) REFERENCES User(id),
            FOREIGN KEY(issueId) REFERENCES Issue(id) ON DELETE CASCADE,
            FOREIGN KEY(parentId) REFERENCES Comment(id) ON DELETE SET NULL
        );
        """)

        # 13. Label 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS Label (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            color TEXT NOT NULL DEFAULT '#000000'
        );
        """)

        # 13.5. _IssueToLabel 조인 테이블 (N:M 관계)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS _IssueToLabel (
            A INTEGER NOT NULL,
            B INTEGER NOT NULL,
            FOREIGN KEY(A) REFERENCES Issue(id) ON DELETE CASCADE,
            FOREIGN KEY(B) REFERENCES Label(id) ON DELETE CASCADE,
            PRIMARY KEY(A, B)
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_issue_to_label_b ON _IssueToLabel(B);")

        # 14. IssueLink 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS IssueLink (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sourceIssueId INTEGER NOT NULL,
            targetIssueId INTEGER NOT NULL,
            type TEXT NOT NULL,
            FOREIGN KEY(sourceIssueId) REFERENCES Issue(id) ON DELETE CASCADE,
            FOREIGN KEY(targetIssueId) REFERENCES Issue(id) ON DELETE CASCADE
        );
        """)

        # 15. Reminder 테이블
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS Reminder (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            issueId INTEGER NOT NULL,
            remindAt DATETIME NOT NULL,
            isSent INTEGER NOT NULL DEFAULT 0,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # 16. IssueCalendarLink 테이블 (구글 캘린더 연동 관리 테이블)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS IssueCalendarLink (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            issueId INTEGER NOT NULL,
            calendarId TEXT NOT NULL,
            googleEventId TEXT UNIQUE NOT NULL,
            syncStatus TEXT DEFAULT 'SYNCED',
            lastSyncedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(issueId) REFERENCES Issue(id) ON DELETE CASCADE
        );
        """)
        
        # 마이그레이션: 기존 테이블에 syncStatus 컬럼이 없을 경우 추가 (Project, Milestone)
        for table in ["Project", "Milestone"]:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [row[1] for row in cursor.fetchall()]
            if "syncStatus" not in columns:
                print(f"-> [Migration] {table} 테이블에 syncStatus 컬럼을 추가합니다.")
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN syncStatus TEXT DEFAULT 'SYNCED';")

        # 마이그레이션: 기존 Issue 테이블의 googleEventId를 IssueCalendarLink 테이블로 안전하게 이관
        cursor.execute("PRAGMA table_info(Issue)")
        issue_cols = [row[1] for row in cursor.fetchall()]
        if "googleEventId" in issue_cols:
            print("-> [Migration] 기존 Issue 테이블의 googleEventId를 IssueCalendarLink 테이블로 이관합니다.")
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO IssueCalendarLink (issueId, calendarId, googleEventId, syncStatus)
                    SELECT id, 'primary', googleEventId, 'SYNCED'
                    FROM Issue
                    WHERE googleEventId IS NOT NULL AND googleEventId != ''
                """)
                # SQLite 3.35.0 이상에서는 DROP COLUMN이 가능하므로 시도하되, 구버전 대비 예외 처리 수행
                try:
                    cursor.execute("ALTER TABLE Issue DROP COLUMN googleEventId;")
                    print("[INFO] Issue 테이블에서 googleEventId 컬럼이 성공적으로 삭제되었습니다.")
                except Exception as ex:
                    print(f"[알림] Issue.googleEventId 컬럼 삭제 스킵 (SQLite 버전 제한 등): {ex}")
            except Exception as e:
                print(f"[경고] 구글 캘린더 연동 데이터 이관 실패: {e}", file=sys.stderr)

        # 마이그레이션: 기존 테이블에서 notionPageId 컬럼 제거 (Project, Milestone, Issue)
        for table in ["Project", "Milestone", "Issue"]:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [row[1] for row in cursor.fetchall()]
            if "notionPageId" in columns:
                print(f"-> [Migration] {table} 테이블에서 notionPageId 컬럼을 삭제합니다.")
                try:
                    cursor.execute(f"ALTER TABLE {table} DROP COLUMN notionPageId;")
                    print(f"[INFO] {table} 테이블에서 notionPageId 컬럼이 삭제되었습니다.")
                except Exception as ex:
                    print(f"[알림] {table}.notionPageId 컬럼 삭제 스킵 (SQLite 버전 제한 등): {ex}")

        # 마이그레이션: 기존 Comment 테이블에 parentId 컬럼이 없을 경우 추가
        cursor.execute("PRAGMA table_info(Comment)")
        comment_cols = [row[1] for row in cursor.fetchall()]
        if "parentId" not in comment_cols:
            print("-> [Migration] Comment 테이블에 parentId 컬럼을 추가합니다.")
            try:
                cursor.execute("ALTER TABLE Comment ADD COLUMN parentId INTEGER;")
                print("[INFO] Comment 테이블에 parentId 컬럼이 성공적으로 추가되었습니다.")
            except Exception as e:
                print(f"[경고] Comment parentId 컬럼 추가 실패: {e}", file=sys.stderr)

        # 인덱스 정리 및 생성
        cursor.execute("DROP INDEX IF EXISTS idx_issue_notion;")
        cursor.execute("DROP INDEX IF EXISTS idx_issue_google;")
        cursor.execute("DROP INDEX IF EXISTS idx_project_notion;")
        cursor.execute("DROP INDEX IF EXISTS idx_milestone_notion;")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_link_event ON IssueCalendarLink(googleEventId);")
        
        print("[INFO] 테이블 생성이 완료되었습니다.")
        
        # --- 시드 데이터 입력 (Seed Data) ---
        print("-> 기본 시스템 데이터(Seed Data) 입력을 시작합니다...")
        
        # 기본 관리자 유저
        cursor.execute("""
        INSERT OR IGNORE INTO User (id, email, name, password) 
        VALUES (1, 'admin@example.com', 'admin', 'admin123');
        """)
        
        # 프로젝트 상태
        project_statuses = [
            (1, 'TODO', 'TODO', 1),
            (2, 'INPROGRESS', 'INPROGRESS', 1),
            (3, 'DONE', 'DONE', 1)
        ]
        cursor.executemany("INSERT OR IGNORE INTO ProjectStatus (id, name, category, isSystem) VALUES (?, ?, ?, ?);", project_statuses)
        
        # 프로젝트 우선순위
        project_priorities = [
            (1, 'LOWEST', 10, 'light_gray', 1),
            (2, 'LOW', 20, 'gray', 1),
            (3, 'MEDIUM', 30, 'blue', 1),
            (4, 'HIGH', 40, 'orange', 1),
            (5, 'HIGHEST', 50, 'red', 1)
        ]
        cursor.executemany("INSERT OR IGNORE INTO ProjectPriority (id, name, level, color, isSystem) VALUES (?, ?, ?, ?, ?);", project_priorities)
        
        # 기본 프로젝트
        cursor.execute("""
        INSERT OR IGNORE INTO Project (id, name, description, key, ownerId, statusId, priorityId)
        VALUES (1, 'Default Project', '기본 업무 관리 프로젝트', 'DFT', 1, 1, 3);
        """)
        
        # 마일스톤 상태
        cursor.executemany("INSERT OR IGNORE INTO MilestoneStatus (id, name, category, isSystem) VALUES (?, ?, ?, ?);", project_statuses)
        
        # 마일스톤 우선순위
        cursor.executemany("INSERT OR IGNORE INTO MilestonePriority (id, name, level, color, isSystem) VALUES (?, ?, ?, ?, ?);", project_priorities)
        
        # 이슈 유형
        issue_types = [
            (1, 'TASK', '일반 업무/작업', 'TASK', 1),
            (2, 'BUG', '수정 및 결함 대응', 'BUG', 1),
            (3, 'STORY', '요구사항 및 시나리오', 'STORY', 1)
        ]
        cursor.executemany("INSERT OR IGNORE INTO IssueType (id, name, description, icon, isSystem) VALUES (?, ?, ?, ?, ?);", issue_types)
        
        # 이슈 우선순위
        cursor.executemany("INSERT OR IGNORE INTO IssuePriority (id, name, level, color, isSystem) VALUES (?, ?, ?, ?, ?);", project_priorities)
        
        # 이슈 상태
        issue_statuses = [
            (1, 'TODO', 'TODO', 1),
            (2, 'INPROGRESS', 'INPROGRESS', 1),
            (3, 'REVIEW', 'REVIEW', 1),
            (4, 'DONE', 'DONE', 1)
        ]
        cursor.executemany("INSERT OR IGNORE INTO IssueStatus (id, name, category, isSystem) VALUES (?, ?, ?, ?);", issue_statuses)
        
        conn.commit()
        print("[INFO] 기본 시스템 데이터 입력 완료.")
        print("[SUCCESS] SQLite 데이터베이스 구축 및 초기화가 정상적으로 완료되었습니다.")
        
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] 오류 발생으로 데이터베이스 초기화 실패: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    initialize_database()
