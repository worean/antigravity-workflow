import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Project, Issue } from '@/types';
import { createIssue, updateIssue, getIssue } from '@/services/api';
import { issueKeys, useIssues } from '@/api/issues';
import { useProjects } from '@/api/projects';
import { useUsers } from '@/api/users';
import { useCustomFields } from '@/api/customFields';
import { useWorkspace } from '@/context/WorkspaceContext';
import { prefRepository } from '@/lib/prefRepository';
import { useUIStore } from '@/stores/useUIStore';
import { X, PlusCircle } from 'lucide-react';
import { useActionFeedback } from '@/hooks/useActionFeedback';
import { ActionFeedbackModal } from './ActionFeedbackModal';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';
import { useModalLayer } from '@/hooks/useModalLayer';
import { getProjectMembers } from '@/utils/projectMembers';
import { formatDateOnly } from '@/utils/dateUtils';
import { Portal } from './common';
import { IssueDetailEditForm } from './issueDetail/IssueDetailEditForm';

export interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIssue?: Issue | null;
  projects?: Project[];
  initialProjectId?: number;
  initialParentId?: number | null;
  initialParentIssue?: Issue | null;
  onSuccess?: (savedIssue?: Issue) => void;
  onIssueCreated?: () => void;
}

const getDefaultPriority = (): number => prefRepository.defaultPriority || 2;

export const IssueModal: React.FC<IssueModalProps> = ({
  isOpen,
  onClose,
  selectedIssue,
  projects: propProjects,
  initialProjectId,
  initialParentId,
  initialParentIssue,
  onSuccess,
  onIssueCreated,
}) => {
  const { getIssueDraft, saveIssueDraft, clearIssueDraft } = useWorkspace();
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();
  const queryClient = useQueryClient();
  const overlayProps = useOverlayClickClose(onClose);
  const { effectiveZIndex } = useModalLayer(isOpen, {
    onClose: () => {
      if (!errorState.isOpen) onClose();
    },
    triggerKey: initialParentId ?? selectedIssue?.id,
  });

  // TanStack Query 캐시 공유 (중복 네트워크 요청 제거)
  const { data: queriedProjects = [] } = useProjects(undefined, { enabled: isOpen });
  const projects = propProjects && propProjects.length > 0 ? propProjects : queriedProjects;
  const { data: users = [] } = useUsers();
  const { data: customDefs = [] } = useCustomFields();

  const draftKey = selectedIssue ? `edit_${selectedIssue.id}` : 'new';
  const [draftBanner, setDraftBanner] = useState<any | null>(null);

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<number>(initialProjectId || projects[0]?.id || 1);
  const [parentId, setParentId] = useState<number | null>(initialParentId ?? selectedIssue?.parentId ?? null);
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [priorityId, setPriorityId] = useState<number>(() => getDefaultPriority());
  const [statusId, setStatusId] = useState<number>(1);
  const [typeId, setTypeId] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});

  const [plannedStartDate, setPlannedStartDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [actualStartDate, setActualStartDate] = useState<string>('');
  const [actualEndDate, setActualEndDate] = useState<string>('');

  const { data: projectIssues = [] } = useIssues(
    { projectId: Number(projectId) },
    { enabled: Boolean(isOpen && projectId) }
  );

  const candidateParentIssues = useMemo(() => {
    const filtered = projectIssues.filter((i) => !selectedIssue || i.id !== selectedIssue.id);
    if (initialParentIssue && !filtered.some((p) => p.id === initialParentIssue.id)) {
      return [initialParentIssue, ...filtered];
    }
    return filtered;
  }, [projectIssues, selectedIssue, initialParentIssue]);

  const prevIsOpenRef = useRef<boolean>(false);
  const prevIssueIdRef = useRef<number | null>(null);

  useEffect(() => {
    const isNewlyOpened = isOpen && !prevIsOpenRef.current;
    const isIssueChanged = selectedIssue ? selectedIssue.id !== prevIssueIdRef.current : prevIssueIdRef.current !== null;

    prevIsOpenRef.current = isOpen;
    prevIssueIdRef.current = selectedIssue ? selectedIssue.id : null;

    if (!isOpen) return;

    if (isNewlyOpened || isIssueChanged) {
      if (selectedIssue) {
        setTitle(selectedIssue.title || '');
        setDescription(selectedIssue.description || '');
        setTags(Array.isArray(selectedIssue.tags) ? selectedIssue.tags.map((t: any) => t.name || t) : []);
        setProjectId(selectedIssue.projectId || projects[0]?.id || 1);
        setAssigneeId(selectedIssue.assigneeId || selectedIssue.assignee?.id || undefined);
        setPriorityId(selectedIssue.priorityId || selectedIssue.priority?.id || 1);
        setStatusId(selectedIssue.statusId || selectedIssue.status?.id || 1);
        setTypeId(selectedIssue.typeId || selectedIssue.type?.id || 1);
        setProgress(selectedIssue.progress || 0);
        setCustomFieldsData(
          typeof selectedIssue.customFields === 'string'
            ? JSON.parse(selectedIssue.customFields)
            : selectedIssue.customFields || {}
        );
        setPlannedStartDate(formatDateOnly(selectedIssue.plannedStartDate));
        setDueDate(formatDateOnly(selectedIssue.dueDate));
        setActualStartDate(formatDateOnly(selectedIssue.actualStartDate));
        setActualEndDate(formatDateOnly(selectedIssue.actualEndDate));
      } else {
        setTitle('');
        setDescription('');
        setTags([]);
        setProjectId(initialProjectId || projects[0]?.id || 1);
        setAssigneeId(undefined);
        setPriorityId(getDefaultPriority());
        setStatusId(1);
        setTypeId(1);
        setProgress(0);
        setCustomFieldsData({});
        setPlannedStartDate('');
        setDueDate('');
        setActualStartDate('');
        setActualEndDate('');
        const effectiveParentId = initialParentIssue?.id ?? initialParentId ?? null;
        setParentId(effectiveParentId);

        if (initialParentIssue) {
          if (initialParentIssue.projectId) setProjectId(initialParentIssue.projectId);
          if (initialParentIssue.plannedStartDate) setPlannedStartDate(formatDateOnly(initialParentIssue.plannedStartDate) || '');
          if (initialParentIssue.dueDate) setDueDate(formatDateOnly(initialParentIssue.dueDate) || '');
          if (initialParentIssue.actualStartDate) setActualStartDate(formatDateOnly(initialParentIssue.actualStartDate) || '');
          if (initialParentIssue.actualEndDate) setActualEndDate(formatDateOnly(initialParentIssue.actualEndDate) || '');
        } else if (initialParentId) {
          getIssue(initialParentId)
            .then((pIssue) => {
              if (pIssue) {
                if (pIssue.projectId) setProjectId(pIssue.projectId);
                if (pIssue.plannedStartDate) setPlannedStartDate(formatDateOnly(pIssue.plannedStartDate) || '');
                if (pIssue.dueDate) setDueDate(formatDateOnly(pIssue.dueDate) || '');
                if (pIssue.actualStartDate) setActualStartDate(formatDateOnly(pIssue.actualStartDate) || '');
                if (pIssue.actualEndDate) setActualEndDate(formatDateOnly(pIssue.actualEndDate) || '');
              }
            })
            .catch((err) => console.error('Parent issue fetch failed:', err));
        }
      }

      const existingDraft = getIssueDraft(draftKey);
      if (existingDraft && (existingDraft.title?.trim() || existingDraft.description?.trim())) {
        setDraftBanner(existingDraft);
      } else {
        setDraftBanner(null);
      }
    }
  }, [selectedIssue, isOpen, initialProjectId, initialParentId, initialParentIssue, projects, draftKey, getIssueDraft]);

  useEffect(() => {
    if (isOpen && (title.trim() || description.trim())) {
      saveIssueDraft(draftKey, {
        title,
        description,
        projectId,
        priorityId,
        statusId,
        assigneeId,
        dueDate,
        plannedStartDate,
      });
    }
  }, [isOpen, title, description, projectId, priorityId, statusId, assigneeId, dueDate, plannedStartDate, draftKey, saveIssueDraft]);

  if (!isOpen) return null;

  const handleSaveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    const scheduleData = {
      plannedStartDate: plannedStartDate || null,
      dueDate: dueDate || null,
      actualStartDate: actualStartDate || null,
      actualEndDate: actualEndDate || null,
    };

    await executeAction(
      async () => {
        if (selectedIssue) {
          return await updateIssue(selectedIssue.id, {
            title,
            description,
            tags,
            projectId: Number(projectId),
            parentId: parentId ? Number(parentId) : null,
            assigneeId: assigneeId ? Number(assigneeId) : undefined,
            priorityId: Number(priorityId),
            statusId: Number(statusId),
            typeId: Number(typeId),
            progress: Number(progress),
            customFields: customFieldsData,
            ...scheduleData,
          });
        }
        return await createIssue({
          title,
          description,
          tags,
          projectId: Number(projectId),
          parentId: parentId ? Number(parentId) : null,
          assigneeId: assigneeId ? Number(assigneeId) : undefined,
          priorityId: Number(priorityId),
          statusId: Number(statusId),
          typeId: Number(typeId),
          customFields: customFieldsData,
          ...scheduleData,
        });
      },
      {
        onSuccess: (res) => {
          clearIssueDraft(draftKey);
          setDraftBanner(null);
          queryClient.invalidateQueries({ queryKey: issueKeys.all });
          useUIStore.getState().showToast(
            selectedIssue
              ? `이슈 #${selectedIssue.issueNumber || selectedIssue.id}가 수정되었습니다.`
              : '새 이슈가 생성되었습니다.',
            'success'
          );
          if (onSuccess) onSuccess(res);
          if (onIssueCreated) onIssueCreated();
          onClose();
        },
        onError: (err) => {
          useUIStore.getState().showToast(err.response?.data?.error || '이슈 저장에 실패했습니다.', 'error');
        },
      }
    );
  };

  const activeCustomDefs = customDefs.filter(
    (def) => !def.projectId || def.projectId === Number(projectId)
  );
  const projectUsers = getProjectMembers(projects.find((p) => p.id === Number(projectId)), users);

  return (
    <Portal containerId="ag-portal-root">
      <div
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        style={{ zIndex: effectiveZIndex }}
        {...overlayProps}
      >
        <div
          className="modal-content"
          style={{
            maxWidth: '640px',
            width: '92%',
            padding: '14px 18px',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
            margin: 'auto',
            borderRadius: '6px',
            background: 'var(--bg-modal)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-lg)',
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-bright)' }}>
              <PlusCircle size={15} color="var(--primary)" />
              <span>{selectedIssue ? `#${selectedIssue.id} 이슈 정보 수정` : '새 이슈 작성'}</span>
            </div>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
              <X size={16} />
            </button>
          </div>

          {draftBanner && (
            <div
              style={{
                background: 'var(--primary-subtle)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-xs)',
                padding: '8px 12px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.78rem',
              }}
            >
              <span style={{ color: 'var(--accent-cyan)' }}>
                🍪 이전에 작성 중이던 임시 초안(<strong>{draftBanner.title || '제목 없음'}</strong>)이 있습니다.
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setTitle(draftBanner.title || '');
                    setDescription(draftBanner.description || '');
                    if (draftBanner.projectId) setProjectId(draftBanner.projectId);
                    if (draftBanner.priorityId) setPriorityId(draftBanner.priorityId);
                    if (draftBanner.statusId) setStatusId(draftBanner.statusId);
                    if (draftBanner.assigneeId !== undefined) setAssigneeId(draftBanner.assigneeId);
                    if (draftBanner.dueDate) setDueDate(draftBanner.dueDate);
                    if (draftBanner.plannedStartDate) setPlannedStartDate(draftBanner.plannedStartDate);
                    setDraftBanner(null);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                >
                  초안 불러오기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearIssueDraft(draftKey);
                    setDraftBanner(null);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                >
                  초안 삭제
                </button>
              </div>
            </div>
          )}

          <IssueDetailEditForm
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            tags={tags}
            setTags={setTags}
            projectId={projectId}
            setProjectId={setProjectId}
            parentId={parentId}
            setParentId={setParentId}
            assigneeId={assigneeId}
            setAssigneeId={setAssigneeId}
            priorityId={priorityId}
            setPriorityId={setPriorityId}
            statusId={statusId}
            setStatusId={setStatusId}
            typeId={typeId}
            setTypeId={setTypeId}
            progress={progress}
            setProgress={setProgress}
            plannedStartDate={plannedStartDate}
            setPlannedStartDate={setPlannedStartDate}
            dueDate={dueDate}
            setDueDate={setDueDate}
            actualStartDate={actualStartDate}
            setActualStartDate={setActualStartDate}
            actualEndDate={actualEndDate}
            setActualEndDate={setActualEndDate}
            customDefs={activeCustomDefs}
            customFieldsData={customFieldsData}
            setCustomFieldsData={setCustomFieldsData}
            projects={projects}
            candidateParentIssues={candidateParentIssues}
            users={projectUsers}
            isPending={isPending}
            handleUpdateIssue={handleSaveIssue}
            toggleEditing={() => onClose()}
          />
        </div>
      </div>
      <ActionFeedbackModal state={errorState} onClose={closeErrorModal} />
    </Portal>
  );
};
