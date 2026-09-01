// -*- coding: utf-8 -*-
---
name: api-spec-reader
description: Docs(docs/api/) 디렉토리를 동적으로 탐색하고 api_inspector.py 헬퍼를 실행하여 REST API 규격, 엔드포인트 목록, 요청/응답 스펙 및 서버 소스 코드를 조회/검색하는 기술(Skill)입니다.
---

# 🛠️ AntiGravity API Spec Reader Skill

이 스킬은 `docs/api/` 디렉토리의 도메인별 API 명세서와 `workflow_server/src/modules/`의 백엔드 소스를 조회/검색하기 위한 실행 도구 및 절차를 제공하는 전용 **기술(Skill)**입니다.

---

## 🛠️ CLI 실행 도구 ([api_inspector.py](./scripts/api_inspector.py))

`docs/api/` 디렉토리의 모든 파일과 서브 라우트 폴더를 동적으로 스캔하여 빠른 조회를 제공합니다.

### 1. 도메인 및 라우트 목록 동적 조회
```powershell
$env:PYTHONUTF8=1; python .agents/skills/api-spec-reader/scripts/api_inspector.py list
```

### 2. 특정 도메인 및 서브 라우트 명세 조회
```powershell
# 기본 도메인 조회 (예: issues, projects, tags, chat, auth 등)
$env:PYTHONUTF8=1; python .agents/skills/api-spec-reader/scripts/api_inspector.py get issues
$env:PYTHONUTF8=1; python .agents/skills/api-spec-reader/scripts/api_inspector.py get tags

# 서브 라우트 핀포인트 조회
$env:PYTHONUTF8=1; python .agents/skills/api-spec-reader/scripts/api_inspector.py get projects/members
$env:PYTHONUTF8=1; python .agents/skills/api-spec-reader/scripts/api_inspector.py get issues/batch-schedules
$env:PYTHONUTF8=1; python .agents/skills/api-spec-reader/scripts/api_inspector.py get sprints/discussions
```

### 3. 엔드포인트 또는 키워드 검색
```powershell
$env:PYTHONUTF8=1; python .agents/skills/api-spec-reader/scripts/api_inspector.py search batch-schedules
$env:PYTHONUTF8=1; python .agents/skills/api-spec-reader/scripts/api_inspector.py search "#태그"
```
