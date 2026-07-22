# -*- coding: utf-8-sig -*-
"""
Notion Projects 및 Milestones 데이터베이스 생성 및 기존 Issues DB 연동 스크립트
(Layer 3: Execution - Notion Setup Tool)
"""

import os
import sys
import json
import urllib.request
import urllib.error
import sqlite3

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
env_file_path = os.path.join(project_root, ".env")
load_custom_env(env_file_path)

api_key = os.getenv("NOTION_API_KEY")
issues_db_id = os.getenv("NOTION_DATABASE_ID")

if not api_key or not issues_db_id:
    print("[ERROR] .env 파일에서 NOTION_API_KEY와 NOTION_DATABASE_ID를 찾을 수 없습니다.", file=sys.stderr)
    sys.exit(1)

# API 요청용 공통 헤더 (2025-09-03 이상 버전에서 다중 소스 DB 조회 지원)
headers = {
    "Authorization": f"Bearer {api_key}",
    "Notion-Version": "2025-09-03",
    "Content-Type": "application/json"
}

def send_request(url: str, data: dict, method: str = "POST") -> dict:
    json_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=json_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        raise Exception(f"Notion API Error ({e.code}): {error_body}")
    except Exception as e:
        raise Exception(f"Connection to Notion failed: {e}")

def main():
    print("1. 기존 Issues 데이터베이스 및 부모 페이지 정보 조회 중...")
    parent = None
    try:
        issues_db_id_clean = issues_db_id.replace("-", "").strip()
        db_info_url = f"https://api.notion.com/v1/databases/{issues_db_id_clean}"
        db_info = send_request(db_info_url, None, method="GET")
        parent = db_info.get("parent")
        print(f" -> Issues DB 조회 성공 (부모 타입: {parent.get('type') if parent else None})")
    except Exception as e:
        print(f"[ERROR] 부모 노드 정보 획득 실패: {e}", file=sys.stderr)
        sys.exit(1)

    # 부모가 workspace인 경우, API로 직접 DB를 생성할 수 없음.
    # 해결책: 사용자의 노션 권한이 있는 '페이지'를 검색하여 그 하위에 DB를 생성하도록 우회.
    if parent and parent.get("type") == "workspace":
        print("\n[알림] 부모가 workspace(최상위)이므로 직접 DB 생성이 불가능합니다.")
        print(" -> Notion API Search를 통해 통합 권한이 공유된 일반 페이지(Page)를 탐색합니다...")
        
        try:
            search_payload = {
                "filter": {
                    "property": "object",
                    "value": "page"
                },
                "page_size": 5
            }
            search_result = send_request("https://api.notion.com/v1/search", search_payload, method="POST")
            results = search_result.get("results", [])
            
            valid_pages = [r for r in results if r.get("object") == "page"]
            if valid_pages:
                target_page = valid_pages[0]
                target_page_id = target_page.get("id")
                page_title = "제목 없음"
                # 페이지 타이틀 추출 시도
                properties = target_page.get("properties", {})
                for k, v in properties.items():
                    if v.get("type") == "title":
                        title_objs = v.get("title", [])
                        if title_objs:
                            page_title = title_objs[0].get("plain_text", "제목 없음")
                            break
                            
                print(f" -> 공유된 페이지 발견: '{page_title}' (ID: {target_page_id})")
                parent = {
                    "type": "page_id",
                    "page_id": target_page_id
                }
            else:
                print("[경고] API 권한이 허용된 노션 일반 페이지를 하나도 찾지 못했습니다.", file=sys.stderr)
                print("       노션 웹 UI에서 새로운 상위 페이지를 하나 생성하시고, 우측 상단 '...' -> 'Connections'를 통해", file=sys.stderr)
                print("       API 통합(Integration) 권한을 추가로 공유해 주셔야 자동 생성이 가능합니다.", file=sys.stderr)
                sys.exit(1)
        except Exception as e:
            print(f"[ERROR] 노션 페이지 검색 중 오류 발생: {e}", file=sys.stderr)
            sys.exit(1)

    # 2. Projects 데이터베이스 생성
    print("\n2. Notion에 'Projects' 데이터베이스 생성 중...")
    projects_payload = {
        "parent": parent,
        "title": [{"type": "text", "text": {"content": "Projects (Automated)"}}],
        "properties": {
            "name": {"title": {}},
            "key": {"rich_text": {}},
            "description": {"rich_text": {}},
            "status": {
                "select": {
                    "options": [
                        {"name": "TODO", "color": "gray"},
                        {"name": "INPROGRESS", "color": "blue"},
                        {"name": "DONE", "color": "green"}
                    ]
                }
            },
            "priority": {
                "select": {
                    "options": [
                        {"name": "LOWEST", "color": "light_gray"},
                        {"name": "LOW", "color": "gray"},
                        {"name": "MEDIUM", "color": "blue"},
                        {"name": "HIGH", "color": "orange"},
                        {"name": "HIGHEST", "color": "red"}
                    ]
                }
            },
            "dueDate": {"date": {}}
        }
    }
    
    try:
        projects_db = send_request("https://api.notion.com/v1/databases", projects_payload)
        projects_db_id = projects_db.get("id")
        print(f" -> Projects 데이터베이스 생성 성공 (ID: {projects_db_id})")
    except Exception as e:
        print(f"[ERROR] Projects 데이터베이스 생성 실패: {e}", file=sys.stderr)
        sys.exit(1)

    # 3. Milestones 데이터베이스 생성
    print("\n3. Notion에 'Milestones' 데이터베이스 생성 중...")
    milestones_payload = {
        "parent": parent,
        "title": [{"type": "text", "text": {"content": "Milestones (Automated)"}}],
        "properties": {
            "title": {"title": {}},
            "description": {"rich_text": {}},
            "status": {
                "select": {
                    "options": [
                        {"name": "TODO", "color": "gray"},
                        {"name": "INPROGRESS", "color": "blue"},
                        {"name": "DONE", "color": "green"}
                    ]
                }
            },
            "priority": {
                "select": {
                    "options": [
                        {"name": "LOWEST", "color": "light_gray"},
                        {"name": "LOW", "color": "gray"},
                        {"name": "MEDIUM", "color": "blue"},
                        {"name": "HIGH", "color": "orange"},
                        {"name": "HIGHEST", "color": "red"}
                    ]
                }
            },
            "project": {
                "relation": {
                    "database_id": projects_db_id,
                    "single_property": {}
                }
            },
            "dueDate": {"date": {}}
        }
    }
    
    try:
        milestones_db = send_request("https://api.notion.com/v1/databases", milestones_payload)
        milestones_db_id = milestones_db.get("id")
        print(f" -> Milestones 데이터베이스 생성 성공 (ID: {milestones_db_id})")
    except Exception as e:
        print(f"[ERROR] Milestones 데이터베이스 생성 실패: {e}", file=sys.stderr)
        sys.exit(1)

    # 4. 기존 Issues 데이터베이스 스키마 확장 (Relation 및 Multi-select 추가)
    print("\n4. 기존 Issues 데이터베이스 연동 및 컬럼 확장 중...")
    issues_patch_payload = {
        "properties": {
            "labels": {"multi_select": {}},
            "project": {
                "relation": {
                    "database_id": projects_db_id,
                    "single_property": {}
                }
            },
            "milestone": {
                "relation": {
                    "database_id": milestones_db_id,
                    "single_property": {}
                }
            }
        }
    }
    
    try:
        issues_patch_url = f"https://api.notion.com/v1/databases/{issues_db_id_clean}"
        send_request(issues_patch_url, issues_patch_payload, method="PATCH")
        print(" -> Issues 데이터베이스 스키마 확장 성공 ('labels', 'project', 'milestone' 속성 추가됨)")
    except Exception as e:
        print(f"[ERROR] Issues 데이터베이스 스키마 확장 실패: {e}", file=sys.stderr)
        sys.exit(1)

    # 5. .env 파일 업데이트
    print("\n5. .env 파일에 새로 생성된 데이터베이스 ID 정보 추가 중...")
    try:
        lines = []
        with open(env_file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
        new_lines = []
        project_db_exists = False
        milestone_db_exists = False
        
        for line in lines:
            if line.startswith("NOTION_PROJECT_DB_ID="):
                new_lines.append(f"NOTION_PROJECT_DB_ID={projects_db_id}\n")
                project_db_exists = True
            elif line.startswith("NOTION_MILESTONE_DB_ID="):
                new_lines.append(f"NOTION_MILESTONE_DB_ID={milestones_db_id}\n")
                milestone_db_exists = True
            else:
                new_lines.append(line)
                
        # 없는 설정은 맨 뒤에 추가
        if not project_db_exists:
            new_lines.append(f"NOTION_PROJECT_DB_ID={projects_db_id}\n")
        if not milestone_db_exists:
            new_lines.append(f"NOTION_MILESTONE_DB_ID={milestones_db_id}\n")
            
        with open(env_file_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
            
        print(" -> .env 파일 업데이트 완료.")
    except Exception as e:
        print(f"[경고] .env 파일 업데이트 실패: {e}", file=sys.stderr)

    # 6. 로컬 SQLite DB의 Project 1번에 notionPageId 임시 동기화
    print("\n6. 로컬 DB 동기화 처리 중...")
    try:
        db_path = os.getenv("SQLITE_DB_PATH") or os.path.join(project_root, ".tmp", "task_board.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Notion에 Project 업로드
        notion_proj_props = {
            "name": {"title": [{"text": {"content": "Default Project"}}]},
            "key": {"rich_text": [{"text": {"content": "DFT"}}]},
            "status": {"select": {"name": "TODO"}},
            "priority": {"select": {"name": "MEDIUM"}},
            "description": {"rich_text": [{"text": {"content": "기본 업무 관리 프로젝트"}}]}
        }
        
        url = "https://api.notion.com/v1/pages"
        payload = {
            "parent": {"database_id": projects_db_id},
            "properties": notion_proj_props
        }
        
        print(" -> Notion Projects DB에 Default Project 페이지 생성 중...")
        res = send_request(url, payload, method="POST")
        notion_proj_page_id = res.get("id")
        
        # SQLite 업데이트
        cursor.execute(
            "UPDATE Project SET notionPageId = ?, syncStatus = 'SYNCED' WHERE id = 1",
            (notion_proj_page_id,)
        )
        
        # Milestone 1번이 있다면 이것도 Notion에 생성하고 맵핑
        cursor.execute("SELECT id, title FROM Milestone WHERE id = 1")
        mile_row = cursor.fetchone()
        if mile_row:
            mile_id = mile_row[0]
            mile_title = mile_row[1]
            
            notion_mile_props = {
                "title": {"title": [{"text": {"content": mile_title}}]},
                "status": {"select": {"name": "TODO"}},
                "priority": {"select": {"name": "MEDIUM"}},
                "project": {"relation": [{"id": notion_proj_page_id}]}
            }
            payload_mile = {
                "parent": {"database_id": milestones_db_id},
                "properties": notion_mile_props
            }
            print(f" -> Notion Milestones DB에 {mile_title} 페이지 생성 중...")
            res_mile = send_request("https://api.notion.com/v1/pages", payload_mile, method="POST")
            notion_mile_page_id = res_mile.get("id")
            
            cursor.execute(
                "UPDATE Milestone SET notionPageId = ?, syncStatus = 'SYNCED' WHERE id = ?",
                (notion_mile_page_id, mile_id)
            )
            
        conn.commit()
        conn.close()
        print(" -> 로컬 SQLite 기본 데이터(Project/Milestone)의 Notion 맵핑 완료.")
    except Exception as e:
        print(f"[경고] 로컬 기본 데이터의 Notion 맵핑 실패: {e}", file=sys.stderr)

    # 7. 기존 오류난 태스크 재동기화 시도
    print("\n7. 기존에 동기화 보류(ERROR) 상태였던 태스크들 재동기화 시도 중...")
    try:
        sys.path.append(project_root)
        from execution.task_repository import SQLiteRepository, NotionRepository, HybridRepository
        
        sqlite_repo = SQLiteRepository(db_path)
        notion_repo = NotionRepository(
            api_key=api_key,
            database_id=issues_db_id,
            project_database_id=projects_db_id,
            milestone_database_id=milestones_db_id
        )
        # 중요: NotionRepository의 API 버전도 내부적으로 2025-09-03로 맵핑해서 전송하도록 헬퍼 설정 가능하나
        # 리포지토리도 이따 헤더 수정할 것이므로 일단 재동기화 시도
        notion_repo.headers["Notion-Version"] = "2025-09-03"
        hybrid_repo = HybridRepository(sqlite_repo, notion_repo)
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM Issue WHERE syncStatus = 'ERROR'")
        error_ids = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        if error_ids:
            print(f" -> 총 {len(error_ids)}개의 보류된 태스크 재전송을 시작합니다.")
            for task_id in error_ids:
                task_data = sqlite_repo.get_task(task_id)
                if task_data:
                    print(f"   * '{task_data.get('title')}' 동기화 전송 중...")
                    hybrid_repo.save_task(task_data)
            print(" -> 재동기화 프로세스 완료.")
        else:
            print(" -> 재동기화가 필요한 보류 태스크가 없습니다.")
            
    except Exception as e:
        print(f"[경고] 재동기화 시도 중 예외 발생: {e}", file=sys.stderr)

    print("\n" + "="*80)
    print(" 🎉 Notion 데이터베이스 생성 및 연동 작업이 성공적으로 완결되었습니다!")
    print(f"  * Projects DB ID  : {projects_db_id}")
    print(f"  * Milestones DB ID: {milestones_db_id}")
    print("="*80)

if __name__ == "__main__":
    main()
