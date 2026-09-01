# -*- coding: utf-8 -*-
"""
AntiGravity API Spec & Source Inspector CLI
Docs(/docs/api)와 Backend(/workflow_server/src/modules)의 API 명세 및 구현 소스를 빠르게 검색/조회하는 헬퍼 도구입니다.
"""

import os
import sys
import argparse
import json
import re

# Windows 콘솔 UTF-8 출력 보장
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
DOCS_API_DIR = os.path.join(ROOT_DIR, "docs", "api")
SERVER_MODULES_DIR = os.path.join(ROOT_DIR, "workflow_server", "src", "modules")

DOMAIN_MAP = {
    "auth": {"doc": "auth.md", "module": "auth"},
    "users": {"doc": "users.md", "module": "users"},
    "projects": {"doc": "projects/README.md", "module": "projects", "subs": ["members.md", "groups.md"]},
    "issues": {"doc": "issues/README.md", "module": "issues", "subs": ["batch-schedules.md", "reactions.md"]},
    "comments": {"doc": "comments/README.md", "module": "comments", "subs": ["reactions.md"]},
    "sprints": {"doc": "sprints/README.md", "module": "sprints", "subs": ["issues.md", "discussions.md", "worklogs.md"]},
    "groups": {"doc": "groups/README.md", "module": "groups", "subs": ["members.md"]},
    "chat": {"doc": "chat/README.md", "module": "chat", "subs": ["channels.md", "messages.md", "reactions.md"]},
    "workspaces": {"doc": "workspaces/README.md", "module": "workspaces", "subs": ["members.md", "invitations.md"]},
    "tags": {"doc": "tags.md", "module": "tags"},
    "worklogs": {"doc": "worklogs.md", "module": "worklogs"},
    "custom-fields": {"doc": "custom-fields.md", "module": "customFields"},
    "attachments": {"doc": "attachments.md", "module": "attachments"},
    "link-previews": {"doc": "link-previews.md", "module": "linkPreviews"},
    "activity-logs": {"doc": "activity-logs.md", "module": "activityLogs"},
    "favorites": {"doc": "favorites.md", "module": "favorites"},
}

def cmd_list(args):
    print("\n========================================================")
    print(" 📌 AntiGravity Backend API Domains & Route Hierarchy")
    print("========================================================")
    print(f"{'Domain':<16} | {'Docs Path':<35} | {'Sub-routes'}")
    print("-" * 75)
    for domain, info in sorted(DOMAIN_MAP.items()):
        subs = ", ".join(info.get("subs", [])) if "subs" in info else "-"
        print(f"{domain:<16} | docs/api/{info['doc']:<26} | {subs}")
    print("========================================================\n")

def cmd_get(args):
    domain = args.domain.lower()
    if domain not in DOMAIN_MAP:
        print(f"❌ 도메인 '{domain}'을(를) 찾을 수 없습니다.")
        print(f"사용 가능한 도메인: {', '.join(sorted(DOMAIN_MAP.keys()))}")
        return

    info = DOMAIN_MAP[domain]
    doc_path = os.path.join(DOCS_API_DIR, info["doc"])
    module_path = os.path.join(SERVER_MODULES_DIR, info["module"])

    print(f"\n🏷️ [API Domain: {domain.upper()}]")
    print(f"📖 문서 경로: docs/api/{info['doc']}")
    print(f"💻 서버 모듈: workflow_server/src/modules/{info['module']}/\n")

    if os.path.exists(doc_path):
        with open(doc_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read().lstrip("\ufeff")
            print("--- [ API Specification Summary ] ---")
            lines = content.splitlines()
            for line in lines[:35]:
                print(line)
            if len(lines) > 35:
                print(f"\n... (총 {len(lines)}줄, 전체 내용은 docs/api/{info['doc']} 참조)")
    else:
        print("⚠️ 문서 파일이 존재하지 않습니다.")

    if os.path.exists(module_path):
        routes_file = os.path.join(module_path, f"{info['module']}.routes.ts")
        if os.path.exists(routes_file):
            print(f"\n--- [ Module Routes ({info['module']}.routes.ts) ] ---")
            with open(routes_file, "r", encoding="utf-8", errors="ignore") as f:
                r_lines = f.read().lstrip("\ufeff").splitlines()
                for line in r_lines:
                    if "router." in line or "Router()" in line:
                        print("  ", line.strip())

def cmd_search(args):
    query = args.query.lower()
    print(f"\n🔍 API 엔드포인트/키워드 검색: '{query}'")
    print("=" * 60)
    found = 0

    for root, _, files in os.walk(DOCS_API_DIR):
        for file in files:
            if file.endswith(".md"):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, ROOT_DIR)
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.read().lstrip("\ufeff").splitlines()
                    for i, line in enumerate(lines, 1):
                        if query in line.lower():
                            print(f"[{rel_path}:{i}] {line.strip()}")
                            found += 1
    if found == 0:
        print("검색 결과가 없습니다.")
    else:
        print(f"\n총 {found}개의 일치 항목을 발견했습니다.\n")

def main():
    parser = argparse.ArgumentParser(description="AntiGravity API Inspector CLI")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("list", help="전체 API 도메인 및 라우트 계층 목록")
    
    get_p = subparsers.add_parser("get", help="특정 도메인의 API 명세 및 소스 정보 조회")
    get_p.add_argument("domain", help="도메인 이름 (예: projects, issues, tags, chat 등)")

    search_p = subparsers.add_parser("search", help="API 엔드포인트 또는 설명 키워드 검색")
    search_p.add_argument("query", help="검색 키워드")

    args = parser.parse_args()
    if args.command == "list":
        cmd_list(args)
    elif args.command == "get":
        cmd_get(args)
    elif args.command == "search":
        cmd_search(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
