# -*- coding: utf-8-sig -*-
"""
태스크 관리 비즈니스 서비스 모듈
(Layer 3: Execution - Business Logic Service)
- UTF-8 with BOM 인코딩을 적용합니다.
"""

import os
import sys
import datetime
from googleapiclient.errors import HttpError

# 공통 모듈 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from calendar_common import get_calendar_service, parse_input_time

class TaskService:
    def __init__(self, repository):
        self.repository = repository
        self._calendar_service = None

    def _get_calendar_service(self):
        if not self._calendar_service:
            self._calendar_service = get_calendar_service()
        return self._calendar_service

    def _get_work_calendar_id(self) -> str:
        """사용자의 구글 캘린더 목록 중 '직장' 캘린더 ID를 조회합니다.
        존재하지 않을 경우 새로 생성하여 ID를 반환합니다.
        """
        service = self._get_calendar_service()
        try:
            calendar_list = service.calendarList().list().execute()
            items = calendar_list.get('items', [])
            for item in items:
                if item.get('summary') == '직장':
                    return item.get('id')
            
            # 존재하지 않는 경우 새로 생성
            print("-> [Google Calendar] '직장' 캘린더를 찾을 수 없어 새로 생성합니다...")
            calendar_body = {
                'summary': '직장',
                'timeZone': 'Asia/Seoul'
            }
            created_calendar = service.calendars().insert(body=calendar_body).execute()
            return created_calendar.get('id')
        except Exception as e:
            print(f"[경고] '직장' 캘린더 탐색/생성 실패 (기본 primary 사용): {e}", file=sys.stderr)
            return "primary"

    def _build_event_description(self, task_data: dict) -> str:
        """태스크 정보를 바탕으로 구글 캘린더 설명란용 포맷팅 텍스트를 구성합니다."""
        desc = task_data.get("description", "") or ""
        
        # 프로젝트 정보 획득
        project_key = "N/A"
        proj_id = task_data.get("projectId")
        if proj_id:
            try:
                if hasattr(self.repository, "sqlite_repo"):
                    proj_info = self.repository.sqlite_repo.get_project(proj_id)
                else:
                    proj_info = self.repository.get_project(proj_id)
                if proj_info:
                    project_key = proj_info.get("key", "N/A")
            except Exception:
                pass
                
        # 마일스톤 정보 획득
        milestone_title = "N/A"
        milestone_id = task_data.get("milestoneId")
        if milestone_id:
            try:
                if hasattr(self.repository, "sqlite_repo"):
                    ms_info = self.repository.sqlite_repo.get_milestone(milestone_id)
                else:
                    ms_info = self.repository.get_milestone(milestone_id)
                if ms_info:
                    milestone_title = ms_info.get("title", "N/A")
            except Exception:
                pass
                
        lines = [
            "[업무 상세 정보]",
            f"- 프로젝트: {project_key}",
            f"- 마일스톤: {milestone_title}",
            f"- 우선순위: {task_data.get('priority', 'MEDIUM')}",
            f"- 진행상태: {task_data.get('status', 'TODO')}",
            "----------------------------------------",
            f"상세 설명: {desc}" if desc else "상세 설명이 없습니다."
        ]
        return "\n".join(lines)

    def _format_event_title(self, title: str, status: str) -> str:
        """업무 상태에 맞춰 구글 캘린더 일정 제목 포맷을 수정합니다.
        완료(DONE) 상태일 경우 제목 앞에 '[완료] '를 추가하고, 그 외에는 제거합니다.
        """
        prefix = "[완료] "
        clean_title = title
        if clean_title.startswith("[업무] "):
            clean_title = clean_title[5:]
        elif clean_title.startswith(prefix + "[업무] "):
            clean_title = clean_title[len(prefix) + 5:]
        elif clean_title.startswith(prefix):
            clean_title = clean_title[len(prefix):]
            
        if status.upper() == "DONE":
            return f"{prefix}[업무] {clean_title}"
        else:
            return f"[업무] {clean_title}"

    def create_task_workflow(self, task_data: dict) -> dict:
        """업무(태스크)를 등록하고 구글 캘린더 차단 및 Notion/SQLite 등록을 조율합니다."""
        
        # 1. 기한 및 시간 파싱
        due_str = task_data.get("dueDate")
        start_str = task_data.get("plannedStartDate")
        
        if due_str:
            due_iso = parse_input_time(due_str)
        else:
            now = datetime.datetime.now().astimezone()
            due_iso = now.isoformat()
            
        if start_str:
            start_iso = parse_input_time(start_str)
        else:
            start_iso = due_iso
            
        dt_obj = datetime.datetime.fromisoformat(due_iso)
        end_iso = (dt_obj + datetime.timedelta(hours=1)).isoformat()
            
        task_data["plannedStartDate"] = start_iso
        task_data["dueDate"] = due_iso

        # 2. 구글 캘린더 일정 등록 판단
        title = task_data.get("title", "")
        desc = task_data.get("description", "") or ""
        status = task_data.get("status", "TODO")
        skip_calendar = task_data.get("skipCalendar", False)
        
        should_register_calendar = False
        if not skip_calendar:
            calendar_keywords = ["보고", "전달", "미팅"]
            for kw in calendar_keywords:
                if kw in title or kw in desc:
                    should_register_calendar = True
                    break
                
        if should_register_calendar:
            task_data["type"] = "TASK"
            
            # "직장" 캘린더 ID 조회
            calendar_id = self._get_work_calendar_id()
            task_data["calendarId"] = calendar_id
            print(f"-> [Google Calendar] '보고/전달/미팅' 키워드가 감지되어 '직장' 캘린더({calendar_id})에 일정 생성을 시작합니다...")
            
            try:
                service = self._get_calendar_service()
                event_body = {
                    'summary': self._format_event_title(title, status),
                    'description': self._build_event_description(task_data),
                    'start': {
                        'dateTime': start_iso
                    },
                    'end': {
                        'dateTime': end_iso
                    }
                }
                
                created_event = service.events().insert(
                    calendarId=calendar_id, 
                    body=event_body
                ).execute()
                
                event_id = created_event.get('id')
                task_data["googleEventId"] = event_id
                print(f"[SUCCESS] 구글 캘린더에 일정을 성공적으로 등록했습니다 (ID: {event_id})")
            except HttpError as err:
                print(f"[경고] 구글 캘린더 등록 중 API 오류 발생 (동기화 중단 없이 계속 진행): {err}", file=sys.stderr)
            except Exception as e:
                print(f"[경고] 구글 캘린더 통신 실패 (동기화 중단 없이 계속 진행): {e}", file=sys.stderr)
        else:
            print("-> [Google Calendar] '보고/전달/미팅' 키워드가 없으므로 구글 캘린더 일정을 생성하지 않습니다.")
            task_data["googleEventId"] = None

        # 3. 데이터베이스 저장 호출
        print("-> [Storage] 데이터 저장소 적재를 진행합니다...")
        saved_task = self.repository.save_task(task_data)
        
        sync_status = saved_task.get("syncStatus")
        notion_id = saved_task.get("notionPageId")
        if notion_id:
            if sync_status == "SYNCED":
                print(f"[SUCCESS] 로컬 SQLite DB 적재 및 Notion 전송이 완료되었습니다 (Notion Page ID: {notion_id})")
            elif sync_status == "ERROR":
                print("[경고] 로컬 SQLite DB에는 임시 저장되었으나, Notion API 통신에 실패했습니다 (Pending Sync 상태)")
            else:
                print(f"[INFO] 태스크 적재 완료 (상태: {sync_status})")
        else:
            print(f"[SUCCESS] 로컬 SQLite DB에 태스크가 성공적으로 적재되었습니다 (상태: {sync_status})")
            
        return saved_task

    def update_task_workflow(self, task_data: dict) -> dict:
        """기존 업무(태스크) 정보를 수정하고 연동된 구글 캘린더 일정도 함께 업데이트합니다."""
        print("-> [Storage] 데이터 저장소 정보 수정을 진행합니다...")
        
        # 1. 기한 파싱 및 저장소 업데이트
        due_str = task_data.get("dueDate")
        if due_str:
            start_iso = parse_input_time(due_str)
            dt_obj = datetime.datetime.fromisoformat(start_iso)
            end_iso = (dt_obj + datetime.timedelta(hours=1)).isoformat()
            task_data["plannedStartDate"] = start_iso
            task_data["dueDate"] = start_iso
        else:
            start_iso = task_data.get("plannedStartDate")
            if start_iso:
                dt_obj = datetime.datetime.fromisoformat(start_iso)
                end_iso = (dt_obj + datetime.timedelta(hours=1)).isoformat()
            else:
                end_iso = None

        # 2. 로컬 / 하이브리드 DB 저장
        updated_task = self.repository.save_task(task_data)
        
        # get_task를 통해 최신 캘린더 연동 정보(calendarLinks)를 로드
        task_id = updated_task.get("id")
        if task_id:
            try:
                updated_task = self.repository.get_task(task_id)
            except Exception:
                pass
        
        # 3. 구글 캘린더 이벤트 동기화 처리
        calendar_links = updated_task.get("calendarLinks", [])
        title = updated_task.get("title", "")
        desc = updated_task.get("description", "") or ""
        status = updated_task.get("status", "TODO")
        
        # 일정 동기화가 필요한 조건인지 판별
        should_have_event = False
        skip_calendar = task_data.get("skipCalendar", False)
        
        if not skip_calendar:
            calendar_keywords = ["보고", "전달", "미팅"]
            for kw in calendar_keywords:
                if kw in title or kw in desc:
                    should_have_event = True
                    break

        if calendar_links:
            # 연동된 모든 캘린더 일정에 대해 갱신 또는 삭제 수행
            for link in calendar_links:
                google_event_id = link.get("googleEventId")
                calendar_id = link.get("calendarId")
                
                if should_have_event:
                    print(f"-> [Google Calendar] 일정을 업데이트합니다 (Calendar: {calendar_id}, Event ID: {google_event_id})...")
                    try:
                        service = self._get_calendar_service()
                        event_body = {
                            'summary': self._format_event_title(title, status),
                            'description': self._build_event_description(updated_task)
                        }
                        if start_iso and end_iso:
                            event_body['start'] = {'dateTime': start_iso, 'date': None}
                            event_body['end'] = {'dateTime': end_iso, 'date': None}
                            
                        service.events().patch(
                            calendarId=calendar_id,
                            eventId=google_event_id,
                            body=event_body
                        ).execute()
                        print(f"[SUCCESS] 구글 캘린더 일정이 정상적으로 동기화 수정되었습니다 ({google_event_id}).")
                    except Exception as e:
                        print(f"[경고] 구글 캘린더 일정 수정 실패 (Event: {google_event_id}): {e}", file=sys.stderr)
                else:
                    # 키워드가 누락되어 일정을 삭제해야 하는 경우
                    print(f"-> [Google Calendar] 키워드가 제외되어 기존 일정을 삭제합니다 (Calendar: {calendar_id}, Event ID: {google_event_id})...")
                    try:
                        service = self._get_calendar_service()
                        service.events().delete(calendarId=calendar_id, eventId=google_event_id).execute()
                        # 삭제된 링크는 DB에서 정리
                        conn = self.repository._get_connection()
                        cursor = conn.cursor()
                        cursor.execute("DELETE FROM IssueCalendarLink WHERE googleEventId = ?", (google_event_id,))
                        conn.commit()
                        conn.close()
                        print(f"[SUCCESS] 구글 캘린더 일정이 삭제되었습니다 ({google_event_id}).")
                    except Exception as e:
                        print(f"[경고] 구글 캘린더 일정 삭제 실패 (Event: {google_event_id}): {e}", file=sys.stderr)
                        
            # 연동 정보 갱신을 위해 최신 get_task 반환
            if task_id:
                try:
                    updated_task = self.repository.get_task(task_id)
                except Exception:
                    pass
        elif should_have_event:
            # 기존에 일정이 없었으나 업데이트 시점에 키워드가 감지된 경우 신규 생성
            calendar_id = self._get_work_calendar_id()
            print(f"-> [Google Calendar] 키워드가 감지되어 새로운 구글 캘린더 일정을 추가합니다 (Calendar: {calendar_id})...")
            try:
                service = self._get_calendar_service()
                if not start_iso or not end_iso:
                    now = datetime.datetime.now().astimezone()
                    start_iso = now.isoformat()
                    end_iso = (now + datetime.timedelta(hours=1)).isoformat()
                    updated_task["plannedStartDate"] = start_iso
                    updated_task["dueDate"] = start_iso
                
                event_body = {
                    'summary': self._format_event_title(title, status),
                    'description': self._build_event_description(updated_task),
                    'start': {'dateTime': start_iso},
                    'end': {'dateTime': end_iso}
                }
                created_event = service.events().insert(calendarId=calendar_id, body=event_body).execute()
                event_id = created_event.get('id')
                
                # DB에 연동 데이터 직접 등록
                conn = self.repository._get_connection()
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO IssueCalendarLink (issueId, calendarId, googleEventId, syncStatus)
                    VALUES (?, ?, ?, 'SYNCED')
                """, (task_id, calendar_id, event_id))
                conn.commit()
                conn.close()
                
                print(f"[SUCCESS] 구글 캘린더에 일정을 신규 등록했습니다 (ID: {event_id})")
                
                if task_id:
                    updated_task = self.repository.get_task(task_id)
            except Exception as e:
                print(f"[경고] 구글 캘린더 일정 추가 실패: {e}", file=sys.stderr)

        return updated_task

    def create_project_workflow(self, project_data: dict) -> dict:
        """새로운 프로젝트를 로컬 DB와 Notion에 동기화하여 등록합니다."""
        print("-> [Project] 프로젝트 등록 프로세스를 진행합니다...")
        return self.repository.save_project(project_data)

    def create_milestone_workflow(self, milestone_data: dict) -> dict:
        """새로운 마일스톤을 로컬 DB와 Notion에 동기화하여 등록합니다."""
        print("-> [Milestone] 마일스톤 등록 프로세스를 진행합니다...")
        return self.repository.save_milestone(milestone_data)
