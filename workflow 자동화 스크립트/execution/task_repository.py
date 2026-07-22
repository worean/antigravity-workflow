# -*- coding: utf-8-sig -*-
"""
하이브리드 태스크 저장소 모듈
(Layer 3: Execution - Repository Pattern)
- UTF-8 with BOM 인코딩을 적용합니다.
"""

import os
import sys
import sqlite3
import json
import urllib.request
import urllib.error
from abc import ABC, abstractmethod

class TaskRepository(ABC):
    @abstractmethod
    def save_task(self, task_data: dict) -> dict:
        """태스크 정보를 신규 저장하거나 기존 정보를 갱신합니다.
        성공 시 저장 완료된 태스크 딕셔너리를 반환합니다.
        """
        pass

    @abstractmethod
    def get_task(self, task_id: int) -> dict:
        """로컬 ID를 기준으로 태스크 정보를 조회합니다."""
        pass

    @abstractmethod
    def update_status(self, task_id: int, status_name: str) -> bool:
        """태스크의 상태를 업데이트합니다."""
        pass

    @abstractmethod
    def save_project(self, project_data: dict) -> dict:
        """프로젝트 정보를 저장하거나 갱신합니다."""
        pass

    @abstractmethod
    def save_milestone(self, milestone_data: dict) -> dict:
        """마일스톤 정보를 저장하거나 갱신합니다."""
        pass

    @abstractmethod
    def save_comment(self, comment_data: dict) -> dict:
        """댓글(대댓글 포함) 정보를 저장하거나 갱신합니다.
        성공 시 저장 완료된 댓글 딕셔너리를 반환합니다.
        """
        pass

    @abstractmethod
    def get_comments_by_issue(self, issue_id: int) -> list:
        """이슈 ID에 속한 모든 댓글을 조회합니다.
        부모 댓글 ID(parentId)가 유효하지 않을 경우 (0이 아니고, 가리키는 부모 댓글이 DB에 존재하지 않는 경우)
        해당 댓글의 content를 "삭제된 댓글의 댓글입니다."로 치환하여 반환합니다.
        """
        pass


class SQLiteRepository(TaskRepository):
    """SQLite 로컬 태스크 저장소 구현체.
    
    [PostgreSQL 전환 가이드]
    향후 PostgreSQL 데이터베이스 서버와 연동할 때 다음 사항을 고려하여 구현을 전환합니다:
    1. schema.prisma 파일의 datasource provider를 "postgresql"로 변경하고 DATABASE_URL을 연동할 서버 정보로 수정합니다.
    2. Prisma Client(python-prisma 등) 또는 SQLAlchemy ORM 등을 활용해 데이터 액세스 레이어를 대체하거나,
       SQL 직접 실행 방식을 유지할 경우 SQLite 전용 구문(예: AUTOINCREMENT -> SERIAL, COLLATE NOCASE -> ILIKE 또는 LOWER() 적용)을
       PostgreSQL 표준 SQL로 마이그레이션한 PostgreSQLRepository를 신설합니다.
    3. SQLite의 텍스트 기반 날짜 처리(ISO8601 문자열)와 PostgreSQL의 TIMESTAMPTZ 타입 매핑 시의 시간대(Timezone) 처리가 다르므로,
       datetime 바인딩 방식을 적절히 가다듬어야 합니다.
    """
    def __init__(self, db_path: str):
        self.db_path = db_path

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _resolve_meta_id(self, table: str, name: str) -> int:
        """기본 메타 데이터(상태, 우선순위, 유형)의 문자열 이름을 받아 ID로 조회합니다."""
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(f"SELECT id FROM {table} WHERE name = ? COLLATE NOCASE", (name,))
            row = cursor.fetchone()
            if row:
                return row['id']
            # 없을 경우 1번 기본값 리턴
            return 1
        finally:
            conn.close()

    def save_project(self, project_data: dict) -> dict:
        conn = self._get_connection()
        cursor = conn.cursor()
        
        status_id = self._resolve_meta_id("ProjectStatus", project_data.get("status", "TODO"))
        priority_id = self._resolve_meta_id("ProjectPriority", project_data.get("priority", "MEDIUM"))
        owner_id = project_data.get("ownerId", 1)
        project_id = project_data.get("id")
        
        try:
            if project_id:
                cursor.execute("""
                    UPDATE Project
                    SET name=?, description=?, key=?, ownerId=?, statusId=?, priorityId=?,
                        plannedStartDate=?, dueDate=?, actualStartDate=?, actualEndDate=?,
                        syncStatus=?, updatedAt=CURRENT_TIMESTAMP
                    WHERE id=?
                """, (
                    project_data.get("name"),
                    project_data.get("description"),
                    project_data.get("key"),
                    owner_id,
                    status_id,
                    priority_id,
                    project_data.get("plannedStartDate"),
                    project_data.get("dueDate"),
                    project_data.get("actualStartDate"),
                    project_data.get("actualEndDate"),
                    project_data.get("syncStatus", "SYNCED"),
                    project_id
                ))
            else:
                cursor.execute("""
                    INSERT INTO Project (
                        name, description, key, ownerId, statusId, priorityId,
                        plannedStartDate, dueDate, syncStatus
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    project_data.get("name"),
                    project_data.get("description"),
                    project_data.get("key"),
                    owner_id,
                    status_id,
                    priority_id,
                    project_data.get("plannedStartDate"),
                    project_data.get("dueDate"),
                    project_data.get("syncStatus", "SYNCED")
                ))
                project_id = cursor.lastrowid
            conn.commit()
            return self.get_project(project_id)
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    def get_project(self, project_id: int) -> dict:
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                SELECT p.*, s.name as status, pr.name as priority
                FROM Project p
                LEFT JOIN ProjectStatus s ON p.statusId = s.id
                LEFT JOIN ProjectPriority pr ON p.priorityId = pr.id
                WHERE p.id = ?
            """, (project_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return {}
        finally:
            conn.close()

    def save_milestone(self, milestone_data: dict) -> dict:
        conn = self._get_connection()
        cursor = conn.cursor()
        
        status_id = self._resolve_meta_id("MilestoneStatus", milestone_data.get("status", "TODO"))
        priority_id = self._resolve_meta_id("MilestonePriority", milestone_data.get("priority", "MEDIUM"))
        project_id = milestone_data.get("projectId", 1)
        milestone_id = milestone_data.get("id")
        
        try:
            if milestone_id:
                cursor.execute("""
                    UPDATE Milestone
                    SET title=?, description=?, projectId=?, statusId=?, priorityId=?,
                        plannedStartDate=?, dueDate=?, actualStartDate=?, actualEndDate=?,
                        syncStatus=?, updatedAt=CURRENT_TIMESTAMP
                    WHERE id=?
                """, (
                    milestone_data.get("title"),
                    milestone_data.get("description"),
                    project_id,
                    status_id,
                    priority_id,
                    milestone_data.get("plannedStartDate"),
                    milestone_data.get("dueDate"),
                    milestone_data.get("actualStartDate"),
                    milestone_data.get("actualEndDate"),
                    milestone_data.get("syncStatus", "SYNCED"),
                    milestone_id
                ))
            else:
                cursor.execute("""
                    INSERT INTO Milestone (
                        title, description, projectId, statusId, priorityId,
                        plannedStartDate, dueDate, syncStatus
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    milestone_data.get("title"),
                    milestone_data.get("description"),
                    project_id,
                    status_id,
                    priority_id,
                    milestone_data.get("plannedStartDate"),
                    milestone_data.get("dueDate"),
                    milestone_data.get("syncStatus", "SYNCED")
                ))
                milestone_id = cursor.lastrowid
            conn.commit()
            return self.get_milestone(milestone_id)
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    def get_milestone(self, milestone_id: int) -> dict:
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                SELECT m.*, s.name as status, p.name as priority
                FROM Milestone m
                LEFT JOIN MilestoneStatus s ON m.statusId = s.id
                LEFT JOIN MilestonePriority p ON m.priorityId = p.id
                WHERE m.id = ?
            """, (milestone_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return {}
        finally:
            conn.close()

    def save_task(self, task_data: dict) -> dict:
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # 메타 ID 치환
        status_id = self._resolve_meta_id("IssueStatus", task_data.get("status", "TODO"))
        priority_id = self._resolve_meta_id("IssuePriority", task_data.get("priority", "MEDIUM"))
        type_id = self._resolve_meta_id("IssueType", task_data.get("type", "TASK"))
        
        # 필수 기본값 바인딩
        project_id = task_data.get("projectId", 1)
        milestone_id = task_data.get("milestoneId")
        author_id = task_data.get("authorId", 1)
        
        task_id = task_data.get("id")
        
        try:
            if task_id:
                # 기존 태스크 갱신
                cursor.execute("""
                    UPDATE Issue 
                    SET title=?, description=?, typeId=?, priorityId=?, statusId=?, 
                        plannedStartDate=?, dueDate=?, actualStartDate=?, actualEndDate=?,
                        syncStatus=?, parentId=?, milestoneId=?, updatedAt=CURRENT_TIMESTAMP
                    WHERE id=?
                """, (
                    task_data.get("title"),
                    task_data.get("description"),
                    type_id,
                    priority_id,
                    status_id,
                    task_data.get("plannedStartDate"),
                    task_data.get("dueDate"),
                    task_data.get("actualStartDate"),
                    task_data.get("actualEndDate"),
                    task_data.get("syncStatus", "SYNCED"),
                    task_data.get("parentId"),
                    milestone_id,
                    task_id
                ))
            else:
                # 신규 태스크 생성
                cursor.execute("""
                    INSERT INTO Issue (
                        title, description, typeId, priorityId, statusId, 
                        plannedStartDate, dueDate, 
                        syncStatus, parentId, projectId, milestoneId, authorId
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    task_data.get("title"),
                    task_data.get("description"),
                    type_id,
                    priority_id,
                    status_id,
                    task_data.get("plannedStartDate"),
                    task_data.get("dueDate"),
                    task_data.get("syncStatus", "SYNCED"),
                    task_data.get("parentId"),
                    project_id,
                    milestone_id,
                    author_id
                ))
                task_id = cursor.lastrowid

            # 캘린더 연동 테이블 (IssueCalendarLink) 관리
            google_event_id = task_data.get("googleEventId")
            calendar_id = task_data.get("calendarId") or "primary"
            
            if google_event_id:
                cursor.execute("""
                    INSERT OR REPLACE INTO IssueCalendarLink (issueId, calendarId, googleEventId, syncStatus)
                    VALUES (?, ?, ?, ?)
                """, (task_id, calendar_id, google_event_id, task_data.get("syncStatus", "SYNCED")))
            elif "calendarLinks" in task_data:
                for link in task_data["calendarLinks"]:
                    cursor.execute("""
                        INSERT OR REPLACE INTO IssueCalendarLink (issueId, calendarId, googleEventId, syncStatus)
                        VALUES (?, ?, ?, ?)
                    """, (task_id, link.get("calendarId", "primary"), link.get("googleEventId"), link.get("syncStatus", "SYNCED")))
                
            # 라벨 N:M 동기화 처리
            labels = task_data.get("labels", [])
            cursor.execute("DELETE FROM _IssueToLabel WHERE A = ?", (task_id,))
            for label_name in labels:
                label_name = label_name.strip()
                if not label_name:
                    continue
                cursor.execute("SELECT id FROM Label WHERE name = ?", (label_name,))
                label_row = cursor.fetchone()
                if label_row:
                    label_id = label_row[0]
                else:
                    cursor.execute("INSERT INTO Label (name) VALUES (?)", (label_name,))
                    label_id = cursor.lastrowid
                cursor.execute("INSERT OR IGNORE INTO _IssueToLabel (A, B) VALUES (?, ?)", (task_id, label_id))
                
            conn.commit()
            return self.get_task(task_id)
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    def get_task(self, task_id: int) -> dict:
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                SELECT i.*, 
                       s.name as status, 
                       p.name as priority, 
                       t.name as type
                FROM Issue i
                LEFT JOIN IssueStatus s ON i.statusId = s.id
                LEFT JOIN IssuePriority p ON i.priorityId = p.id
                LEFT JOIN IssueType t ON i.typeId = t.id
                WHERE i.id = ?
            """, (task_id,))
            row = cursor.fetchone()
            if row:
                task_dict = dict(row)
                # 라벨 조회 추가
                cursor.execute("""
                    SELECT l.name 
                    FROM Label l
                    INNER JOIN _IssueToLabel il ON il.B = l.id
                    WHERE il.A = ?
                """, (task_id,))
                task_dict["labels"] = [r[0] for r in cursor.fetchall()]
                
                # 캘린더 연동 정보 조회
                cursor.execute("""
                    SELECT calendarId, googleEventId, syncStatus, lastSyncedAt
                    FROM IssueCalendarLink
                    WHERE issueId = ?
                """, (task_id,))
                links = [dict(r) for r in cursor.fetchall()]
                task_dict["calendarLinks"] = links
                
                # 단일 googleEventId/calendarId 필드 하위 호환 복원
                if links:
                    task_dict["googleEventId"] = links[0]["googleEventId"]
                    task_dict["calendarId"] = links[0]["calendarId"]
                else:
                    task_dict["googleEventId"] = None
                    task_dict["calendarId"] = None
                    
                return task_dict
            return {}
        finally:
            conn.close()

    def update_status(self, task_id: int, status_name: str) -> bool:
        conn = self._get_connection()
        cursor = conn.cursor()
        status_id = self._resolve_meta_id("IssueStatus", status_name)
        try:
            cursor.execute("UPDATE Issue SET statusId = ?, updatedAt=CURRENT_TIMESTAMP WHERE id = ?", (status_id, task_id))
            conn.commit()
            return cursor.rowcount > 0
        except Exception:
            conn.rollback()
            return False
        finally:
            conn.close()

    def save_comment(self, comment_data: dict) -> dict:
        conn = self._get_connection()
        cursor = conn.cursor()
        
        comment_id = comment_data.get("id")
        content = comment_data.get("content")
        author_id = comment_data.get("authorId")
        issue_id = comment_data.get("issueId")
        parent_id = comment_data.get("parentId")
        
        # parentId가 0이거나 None이면 DB에는 NULL(None)로 저장
        if parent_id == 0 or parent_id is None:
            parent_id = None
            
        try:
            if comment_id:
                cursor.execute("""
                    UPDATE Comment
                    SET content=?, authorId=?, issueId=?, parentId=?, updatedAt=CURRENT_TIMESTAMP
                    WHERE id=?
                """, (content, author_id, issue_id, parent_id, comment_id))
            else:
                cursor.execute("""
                    INSERT INTO Comment (content, authorId, issueId, parentId)
                    VALUES (?, ?, ?, ?)
                """, (content, author_id, issue_id, parent_id))
                comment_id = cursor.lastrowid
            conn.commit()
            return self.get_comment(comment_id)
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    def get_comment(self, comment_id: int) -> dict:
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT * FROM Comment WHERE id = ?", (comment_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return {}
        finally:
            conn.close()

    def get_comments_by_issue(self, issue_id: int) -> list:
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT * FROM Comment WHERE issueId = ? ORDER BY createdAt ASC", (issue_id,))
            rows = cursor.fetchall()
            comments = [dict(row) for row in rows]
            
            parent_ids = {c["parentId"] for c in comments if c["parentId"] is not None and c["parentId"] != 0}
            
            existing_parent_ids = set()
            if parent_ids:
                placeholders = ",".join("?" for _ in parent_ids)
                cursor.execute(f"SELECT id FROM Comment WHERE id IN ({placeholders})", tuple(parent_ids))
                existing_parent_ids = {r[0] for r in cursor.fetchall()}
                
            for c in comments:
                pid = c["parentId"]
                if pid is not None and pid != 0:
                    if pid not in existing_parent_ids:
                        c["content"] = "삭제된 댓글의 댓글입니다."
                        
            return comments
        finally:
            conn.close()


class NotionRepository(TaskRepository):
    def __init__(self, api_key: str, database_id: str, project_database_id: str = None, milestone_database_id: str = None):
        self.api_key = api_key
        self.database_id = database_id.replace("-", "").strip()
        self.project_database_id = project_database_id.replace("-", "").strip() if project_database_id else None
        self.milestone_database_id = milestone_database_id.replace("-", "").strip() if milestone_database_id else None
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Notion-Version": "2025-09-03",
            "Content-Type": "application/json"
        }

    def _send_request(self, url: str, data: dict, method: str = "POST") -> dict:
        json_data = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(url, data=json_data, headers=self.headers, method=method)
        try:
            with urllib.request.urlopen(req) as res:
                return json.loads(res.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            raise Exception(f"Notion API Error ({e.code}): {error_body}")
        except Exception as e:
            raise Exception(f"Connection to Notion failed: {e}")

    def save_project(self, project_data: dict) -> dict:
        if not self.project_database_id:
            print("[알림] Projects Database ID가 설정되지 않아 노션 연동을 건너뜁니다.")
            return project_data
            
        notion_page_id = project_data.get("notionPageId")
        
        properties = {
            "name": {
                "title": [{"text": {"content": project_data.get("name", "")}}]
            },
            "key": {
                "rich_text": [{"text": {"content": project_data.get("key", "")}}]
            },
            "status": {
                "select": {"name": project_data.get("status", "TODO")}
            },
            "priority": {
                "select": {"name": project_data.get("priority", "MEDIUM")}
            }
        }
        
        if project_data.get("description"):
            properties["description"] = {
                "rich_text": [{"text": {"content": project_data.get("description")}}]
            }
            
        if project_data.get("dueDate"):
            properties["dueDate"] = {
                "date": {"start": project_data.get("dueDate")}
            }
            
        if notion_page_id:
            url = f"https://api.notion.com/v1/pages/{notion_page_id}"
            payload = {"properties": properties}
            result = self._send_request(url, payload, method="PATCH")
        else:
            url = "https://api.notion.com/v1/pages"
            payload = {
                "parent": {"database_id": self.project_database_id},
                "properties": properties
            }
            result = self._send_request(url, payload, method="POST")
            
        project_data["notionPageId"] = result.get("id")
        return project_data

    def save_milestone(self, milestone_data: dict) -> dict:
        if not self.milestone_database_id:
            print("[알림] Milestones Database ID가 설정되지 않아 노션 연동을 건너뜁니다.")
            return milestone_data
            
        notion_page_id = milestone_data.get("notionPageId")
        
        properties = {
            "title": {
                "title": [{"text": {"content": milestone_data.get("title", "")}}]
            },
            "status": {
                "select": {"name": milestone_data.get("status", "TODO")}
            },
            "priority": {
                "select": {"name": milestone_data.get("priority", "MEDIUM")}
            }
        }
        
        if milestone_data.get("description"):
            properties["description"] = {
                "rich_text": [{"text": {"content": milestone_data.get("description")}}]
            }
            
        if milestone_data.get("dueDate"):
            properties["dueDate"] = {
                "date": {"start": milestone_data.get("dueDate")}
            }
            
        # Project 관계형 바인딩
        proj_notion_id = milestone_data.get("projectNotionPageId")
        if proj_notion_id:
            properties["project"] = {
                "relation": [{"id": proj_notion_id}]
            }
            
        if notion_page_id:
            url = f"https://api.notion.com/v1/pages/{notion_page_id}"
            payload = {"properties": properties}
            result = self._send_request(url, payload, method="PATCH")
        else:
            url = "https://api.notion.com/v1/pages"
            payload = {
                "parent": {"database_id": self.milestone_database_id},
                "properties": properties
            }
            result = self._send_request(url, payload, method="POST")
            
        milestone_data["notionPageId"] = result.get("id")
        return milestone_data

    def save_task(self, task_data: dict) -> dict:
        notion_page_id = task_data.get("notionPageId")
        
        # 노션 DB 속성에 맞게 Payload 구조화
        properties = {
            "summary": {
                "title": [{"text": {"content": task_data.get("title", "")}}]
            },
            "status": {
                "select": {"name": task_data.get("status", "TODO")}
            },
            "priority": {
                "select": {"name": task_data.get("priority", "MEDIUM")}
            }
        }
        
        if task_data.get("description"):
            properties["description"] = {
                "rich_text": [{"text": {"content": task_data.get("description")}}]
            }
            
        if task_data.get("dueDate"):
            properties["dueDate"] = {
                "date": {"start": task_data.get("dueDate")}
            }
            
        if task_data.get("googleEventId"):
            properties["googleEventId"] = {
                "rich_text": [{"text": {"content": task_data.get("googleEventId")}}]
            }
            
        # Project 관계형 바인딩
        proj_notion_id = task_data.get("projectNotionPageId")
        if proj_notion_id:
            properties["project"] = {
                "relation": [{"id": proj_notion_id}]
            }
            
        # Milestone 관계형 바인딩
        milestone_notion_id = task_data.get("milestoneNotionPageId")
        if milestone_notion_id:
            properties["milestone"] = {
                "relation": [{"id": milestone_notion_id}]
            }
            
        # 라벨 Multi-select 연동
        labels = task_data.get("labels", [])
        if labels:
            properties["labels"] = {
                "multi_select": [{"name": label_name} for label_name in labels]
            }
            
        if notion_page_id:
            url = f"https://api.notion.com/v1/pages/{notion_page_id}"
            payload = {"properties": properties}
            result = self._send_request(url, payload, method="PATCH")
        else:
            url = "https://api.notion.com/v1/pages"
            payload = {
                "parent": {"database_id": self.database_id},
                "properties": properties
            }
            result = self._send_request(url, payload, method="POST")
            
        task_data["notionPageId"] = result.get("id")
        return task_data

    def get_task(self, task_id: int) -> dict:
        raise NotImplementedError("Notion 단건 조사는 Page ID 기반 조회를 권장합니다.")

    def update_status(self, task_id: int, status_name: str) -> bool:
        raise NotImplementedError("Notion 상태 업데이트는 Page ID를 통해 save_task 또는 직접 PATCH 해야 합니다.")

    def save_comment(self, comment_data: dict) -> dict:
        raise NotImplementedError("Notion 댓글 저장은 지원되지 않습니다.")

    def get_comments_by_issue(self, issue_id: int) -> list:
        raise NotImplementedError("Notion 댓글 조회는 지원되지 않습니다.")


class HybridRepository(TaskRepository):
    def __init__(self, sqlite_repo: SQLiteRepository, notion_repo: NotionRepository):
        self.sqlite_repo = sqlite_repo
        self.notion_repo = notion_repo

    def save_project(self, project_data: dict) -> dict:
        project_data["syncStatus"] = "PENDING_SYNC"
        local_result = self.sqlite_repo.save_project(project_data)
        
        try:
            notion_result = self.notion_repo.save_project(local_result)
            local_result["notionPageId"] = notion_result.get("notionPageId")
            local_result["syncStatus"] = "SYNCED"
            return self.sqlite_repo.save_project(local_result)
        except Exception as e:
            print(f"[경고] Notion 프로젝트 전송 중 오류 발생: {e}", file=sys.stderr)
            local_result["syncStatus"] = "ERROR"
            return self.sqlite_repo.save_project(local_result)

    def save_milestone(self, milestone_data: dict) -> dict:
        milestone_data["syncStatus"] = "PENDING_SYNC"
        
        # 부모 프로젝트의 Notion ID 조회
        proj_id = milestone_data.get("projectId")
        if proj_id:
            proj_info = self.sqlite_repo.get_project(proj_id)
            if proj_info and proj_info.get("notionPageId"):
                milestone_data["projectNotionPageId"] = proj_info.get("notionPageId")
                
        local_result = self.sqlite_repo.save_milestone(milestone_data)
        
        try:
            notion_result = self.notion_repo.save_milestone(local_result)
            local_result["notionPageId"] = notion_result.get("notionPageId")
            local_result["syncStatus"] = "SYNCED"
            return self.sqlite_repo.save_milestone(local_result)
        except Exception as e:
            print(f"[경고] Notion 마일스톤 전송 중 오류 발생: {e}", file=sys.stderr)
            local_result["syncStatus"] = "ERROR"
            return self.sqlite_repo.save_milestone(local_result)

    def save_task(self, task_data: dict) -> dict:
        # 프로젝트 및 마일스톤 노션 ID 주입
        proj_id = task_data.get("projectId")
        if proj_id:
            proj_info = self.sqlite_repo.get_project(proj_id)
            if proj_info and proj_info.get("notionPageId"):
                task_data["projectNotionPageId"] = proj_info.get("notionPageId")
                
        milestone_id = task_data.get("milestoneId")
        if milestone_id:
            milestone_info = self.sqlite_repo.get_milestone(milestone_id)
            if milestone_info and milestone_info.get("notionPageId"):
                task_data["milestoneNotionPageId"] = milestone_info.get("notionPageId")

        task_data["syncStatus"] = "PENDING_SYNC"
        local_result = self.sqlite_repo.save_task(task_data)
        
        try:
            notion_result = self.notion_repo.save_task(local_result)
            local_result["notionPageId"] = notion_result.get("notionPageId")
            local_result["syncStatus"] = "SYNCED"
            return self.sqlite_repo.save_task(local_result)
        except Exception as e:
            print(f"[경고] Notion API 전송 중 오류 발생: {e}", file=sys.stderr)
            local_result["syncStatus"] = "ERROR"
            return self.sqlite_repo.save_task(local_result)

    def get_task(self, task_id: int) -> dict:
        return self.sqlite_repo.get_task(task_id)

    def update_status(self, task_id: int, status_name: str) -> bool:
        task = self.sqlite_repo.get_task(task_id)
        if not task:
            return False
            
        task["status"] = status_name
        try:
            self.save_task(task)
            return True
        except Exception:
            return False

    def save_comment(self, comment_data: dict) -> dict:
        return self.sqlite_repo.save_comment(comment_data)

    def get_comments_by_issue(self, issue_id: int) -> list:
        return self.sqlite_repo.get_comments_by_issue(issue_id)
