import type { ChatbotAction } from '@/types/chatbot';
import { createIssue, updateIssue, deleteIssue, getIssues } from '@/api/issues';
import { getProjects, createProject, deleteProject } from '@/api/projects';
import { getSprints, createSprint, updateSprint } from '@/api/sprints';

/**
 * AI 액션 실제 실행 엔진 (이슈, 프로젝트, 스프린트 스킬 핸들러)
 */
export const executeChatbotAction = async (
  action: ChatbotAction
): Promise<{ success: boolean; message: string; result?: any }> => {
  switch (action.type) {
    case 'create_issue': {
      const projects = await getProjects({ limit: 1 });
      const targetProjectId = projects[0]?.id || 1;
      const created = await createIssue({
        projectId: targetProjectId,
        parentId: action.payload.parentId ? Number(action.payload.parentId) : null,
        title: action.payload.title,
        description: action.payload.description,
        priorityId: action.payload.priorityId || 2,
        dueDate: action.payload.dueDate || null,
        plannedStartDate: action.payload.plannedStartDate || null,
      });
      const dueSuffix = action.payload.dueDate ? ` (마감: ${action.payload.dueDate})` : '';
      const parentSuffix = created.parentId ? ` [상위: #${created.parentId}]` : '';
      return {
        success: true,
        message: `✅ 이슈 #${created.issueNumber || created.id} ("${created.title}")${parentSuffix}${dueSuffix} 생성이 완료되었습니다!`,
        result: created,
      };
    }

    case 'update_issue': {
      let targetId = action.payload.issueId;
      if (!targetId && action.payload.title) {
        const found = await getIssues({ search: action.payload.title, limit: 1 });
        targetId = found[0]?.id;
      }
      if (!targetId) {
        return {
          success: false,
          message: '수정할 대상 이슈 번호(ID)를 찾을 수 없습니다.',
        };
      }

      const updateData: any = {};
      if (action.payload.title) updateData.title = action.payload.title;
      if (action.payload.description !== undefined) updateData.description = action.payload.description;
      if (action.payload.priorityId !== undefined) updateData.priorityId = action.payload.priorityId;
      if (action.payload.statusId !== undefined) updateData.statusId = action.payload.statusId;
      if (action.payload.dueDate !== undefined) updateData.dueDate = action.payload.dueDate;
      if (action.payload.plannedStartDate !== undefined) updateData.plannedStartDate = action.payload.plannedStartDate;
      if (action.payload.parentId !== undefined) updateData.parentId = action.payload.parentId ? Number(action.payload.parentId) : null;

      const updated = await updateIssue(targetId, updateData);

      const changedItems: string[] = [];
      if (action.payload.parentId) changedItems.push(`상위 이슈: #${action.payload.parentId}`);
      if (action.payload.dueDate) changedItems.push(`기한: ${action.payload.dueDate}`);
      if (action.payload.plannedStartDate) changedItems.push(`시작일: ${action.payload.plannedStartDate}`);
      if (action.payload.title) changedItems.push(`제목 변경`);
      if (action.payload.priorityId) changedItems.push(`우선순위 변경`);
      if (action.payload.statusId) changedItems.push(`상태 변경`);
      const changedDesc = changedItems.length > 0 ? ` (${changedItems.join(', ')})` : '';

      return {
        success: true,
        message: `✏️ 이슈 #${updated.issueNumber || updated.id} 수정이 완료되었습니다!${changedDesc}`,
        result: updated,
      };
    }

    case 'delete_issue': {
      let targetId = action.payload.issueId;
      let targetTitle = action.payload.title;
      if (!targetId && targetTitle) {
        const found = await getIssues({ search: targetTitle, limit: 1 });
        if (found[0]) {
          targetId = found[0].id;
          targetTitle = found[0].title;
        }
      }
      if (!targetId) {
        return {
          success: false,
          message: '삭제할 대상 이슈를 찾을 수 없습니다. 이슈 번호(#번호)를 명시해 주세요.',
        };
      }
      await deleteIssue(targetId);
      return {
        success: true,
        message: `🗑️ 이슈 #${targetId}${targetTitle ? ` ("${targetTitle}")` : ''} 삭제가 완료되었습니다!`,
        result: { deletedId: targetId },
      };
    }

    case 'search_issues': {
      const filters: any = { limit: 30 };
      if (action.payload.projectId) {
        filters.projectId = action.payload.projectId;
      } else if (action.payload.projectName) {
        const found = await getProjects({ search: action.payload.projectName, limit: 1 });
        if (found[0]) filters.projectId = found[0].id;
      }

      if (action.payload.statusId) {
        filters.statusId = action.payload.statusId;
      } else if (action.payload.status) {
        const s = String(action.payload.status);
        if (s.includes('진행')) filters.statusId = 2;
        else if (s.includes('완료')) filters.statusId = 4;
        else if (s.includes('검토')) filters.statusId = 3;
        else if (s.includes('대기') || s.includes('백로그')) filters.statusId = 1;
      }

      if (action.payload.isMy) filters.assigneeId = 'my';
      if (action.payload.search) filters.search = action.payload.search;

      let issues = await getIssues(filters);

      const todayStr = new Date().toISOString().substring(0, 10);
      if (action.payload.dueDateFilter === 'today') {
        issues = issues.filter((i) => i.dueDate && i.dueDate.substring(0, 10) === todayStr);
      } else if (action.payload.dueDateFilter === 'overdue') {
        issues = issues.filter((i) => i.dueDate && i.dueDate.substring(0, 10) < todayStr && i.statusId !== 4);
      } else if (action.payload.dueDateFilter === 'upcoming') {
        issues = issues.filter((i) => i.dueDate && i.dueDate.substring(0, 10) > todayStr);
      }

      if (issues.length === 0) {
        return {
          success: true,
          message: '🔍 지정하신 조건에 부합하는 이슈가 없습니다.',
          result: [],
        };
      }

      const statusMap: Record<number, string> = { 1: '대기', 2: '진행 중', 3: '검토 중', 4: '완료' };
      const priorityMap: Record<number, string> = { 1: '낮음', 2: '보통', 3: '높음', 4: '긴급' };

      const lines = issues.slice(0, 7).map((iss) => {
        const pName = iss.priorityId ? ` | 우선순위: ${priorityMap[iss.priorityId] || iss.priorityId}` : '';
        const dStr = iss.dueDate ? ` | 📅 ${iss.dueDate.substring(0, 10)}` : '';
        const sName = iss.status?.name || (iss.statusId ? statusMap[iss.statusId] : '상태 미지정');
        return `- **#${iss.issueNumber || iss.id}** ${iss.title} (${sName}${pName}${dStr})`;
      });

      const moreCount = issues.length > 7 ? `\n- *... 외 ${issues.length - 7}개 일감 더 있음*` : '';
      const summaryMsg = `📋 **이슈 조회 결과 (총 ${issues.length}건)**\n${lines.join('\n')}${moreCount}\n\n💡 *수정하고 싶은 이슈가 있다면 \`"이슈 #번호 완료 처리해줘"\` 또는 \`"이슈 #번호 기한 변경해줘"\`라고 명령하세요.*`;

      return {
        success: true,
        message: summaryMsg,
        result: issues,
      };
    }

    case 'create_project': {
      const rawName = String(action.payload.name || 'Project');
      const sanitizedKey = rawName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'PRJ';
      const created = await createProject({
        name: rawName,
        key: action.payload.key || sanitizedKey,
        description: action.payload.description,
      });
      return {
        success: true,
        message: `✅ 프로젝트 "${created.name}" (키: ${created.key}) 생성이 완료되었습니다!`,
        result: created,
      };
    }

    case 'delete_project': {
      let targetId = action.payload.projectId;
      let targetName = action.payload.name;
      if (!targetId && targetName) {
        const found = await getProjects({ search: targetName, limit: 1 });
        if (found[0]) {
          targetId = found[0].id;
          targetName = found[0].name;
        }
      }
      if (!targetId) {
        return {
          success: false,
          message: '삭제할 대상 프로젝트를 찾을 수 없습니다. 프로젝트 이름을 명시해 주세요.',
        };
      }
      await deleteProject(targetId);
      return {
        success: true,
        message: `🗑️ 프로젝트 "${targetName || `#${targetId}`}" 삭제가 완료되었습니다!`,
        result: { deletedId: targetId },
      };
    }

    case 'search_projects': {
      const projects = await getProjects({ search: action.payload.search });
      if (projects.length === 0) {
        return {
          success: true,
          message: '🔍 등록된 프로젝트가 없습니다.',
          result: [],
        };
      }
      const pLines = projects.slice(0, 10).map((p) => `- **${p.name}** (키: \`${p.key}\` / ID: ${p.id})`);
      return {
        success: true,
        message: `📁 **프로젝트 목록 (총 ${projects.length}개)**\n${pLines.join('\n')}`,
        result: projects,
      };
    }

    case 'create_sprint': {
      let targetProjectId = action.payload.projectId;
      if (!targetProjectId && action.payload.projectName) {
        const found = await getProjects({ search: action.payload.projectName, limit: 1 });
        if (found[0]) targetProjectId = found[0].id;
      }
      if (!targetProjectId) {
        const all = await getProjects({ limit: 1 });
        targetProjectId = all[0]?.id || 1;
      }

      const createdSprint = await createSprint({
        projectId: targetProjectId,
        name: action.payload.name,
        startDate: action.payload.startDate,
        endDate: action.payload.endDate,
        goal: action.payload.goal,
      });

      const dateStr = action.payload.startDate && action.payload.endDate ? ` (${action.payload.startDate} ~ ${action.payload.endDate})` : '';
      return {
        success: true,
        message: `🚀 스프린트 "${createdSprint.name}"${dateStr} 생성이 완료되었습니다!`,
        result: createdSprint,
      };
    }

    case 'search_sprints': {
      let targetProjectId = action.payload.projectId;
      if (!targetProjectId && action.payload.projectName) {
        const found = await getProjects({ search: action.payload.projectName, limit: 1 });
        if (found[0]) targetProjectId = found[0].id;
      }
      const sprints = await getSprints(targetProjectId);
      let filtered = sprints;
      if (action.payload.status) {
        filtered = sprints.filter((s) => s.status === action.payload.status);
      }
      if (filtered.length === 0) {
        return {
          success: true,
          message: '🔍 조회된 스프린트가 없습니다.',
          result: [],
        };
      }
      const sKoMap: Record<string, string> = { active: '진행 중', planned: '계획됨', completed: '완료' };
      const sLines = filtered.slice(0, 8).map((sp) => {
        const dates = sp.startDate && sp.endDate ? ` [${sp.startDate.substring(0, 10)} ~ ${sp.endDate.substring(0, 10)}]` : '';
        return `- **#${sp.id} ${sp.name}** (${sKoMap[sp.status || 'planned'] || sp.status}${dates})`;
      });
      return {
        success: true,
        message: `🏃 **스프린트 목록 (총 ${filtered.length}개)**\n${sLines.join('\n')}`,
        result: filtered,
      };
    }

    case 'update_sprint': {
      const updated = await updateSprint(action.payload.sprintId, {
        name: action.payload.name,
        status: action.payload.status,
        startDate: action.payload.startDate,
        endDate: action.payload.endDate,
        goal: action.payload.goal,
      });
      return {
        success: true,
        message: `🔄 스프린트 #${action.payload.sprintId} ("${updated.name}") 수정이 완료되었습니다!`,
        result: updated,
      };
    }

    case 'navigate': {
      if (typeof window !== 'undefined') {
        const tab = action.payload.tab || 'dashboard';
        window.location.hash = `#/${tab}`;
      }
      return {
        success: true,
        message: `화면 이동을 완료했습니다.`,
      };
    }

    default:
      return {
        success: false,
        message: `지원되지 않는 액션 타입입니다: ${action.type}`,
      };
  }
};
