// -*- coding: utf-8 -*-
import React from 'react';
import type { Issue, User, Project, CustomFieldDefinition } from '@/types';
import { IssueDetailView } from './IssueDetailView';
import { IssueDetailEditForm } from './IssueDetailEditForm';

interface IssueDetailMainCardProps {
  issue: Issue;
  isEditing: boolean;
  user: User | null;
  isAuthenticated: boolean;
  plannedStartDate: string;
  dueDate: string;
  actualStartDate: string;
  actualEndDate: string;
  customFieldsData: Record<string, any>;
  setShowCreateSubTaskModal: (show: boolean) => void;
  setIssue: React.Dispatch<React.SetStateAction<Issue | null>>;
  onOpenAuth?: () => void;
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  tags?: string[];
  setTags?: (tags: string[]) => void;
  projectId: number;
  setProjectId: (val: number) => void;
  parentId: number | null;
  setParentId: (val: number | null) => void;
  assigneeId: number | undefined;
  setAssigneeId: (val: number | undefined) => void;
  priorityId: number;
  setPriorityId: (val: number) => void;
  statusId: number;
  setStatusId: (val: number) => void;
  typeId: number;
  setTypeId: (val: number) => void;
  progress: number;
  setProgress: (val: number) => void;
  setPlannedStartDate: (val: string) => void;
  setDueDate: (val: string) => void;
  setActualStartDate: (val: string) => void;
  setActualEndDate: (val: string) => void;
  customDefs: CustomFieldDefinition[];
  setCustomFieldsData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  projects: Project[];
  candidateParentIssues: Issue[];
  users: User[];
  isPending: boolean;
  handleUpdateIssue: (e: React.FormEvent) => Promise<void>;
  toggleEditing: () => void;
}

export const IssueDetailMainCard: React.FC<IssueDetailMainCardProps> = ({
  issue,
  isEditing,
  user,
  isAuthenticated,
  plannedStartDate,
  dueDate,
  actualStartDate,
  actualEndDate,
  customFieldsData,
  setShowCreateSubTaskModal,
  setIssue,
  onOpenAuth,
  title,
  setTitle,
  description,
  setDescription,
  tags = [],
  setTags,
  projectId,
  setProjectId,
  parentId,
  setParentId,
  assigneeId,
  setAssigneeId,
  priorityId,
  setPriorityId,
  statusId,
  setStatusId,
  typeId,
  setTypeId,
  progress,
  setProgress,
  setPlannedStartDate,
  setDueDate,
  setActualStartDate,
  setActualEndDate,
  customDefs,
  setCustomFieldsData,
  projects,
  candidateParentIssues,
  users,
  isPending,
  handleUpdateIssue,
  toggleEditing,
}) => {
  return (
    <div className="glass-panel" style={{ padding: '14px 16px' }}>
      {!isEditing ? (
        <IssueDetailView
          issue={issue}
          user={user}
          isAuthenticated={isAuthenticated}
          plannedStartDate={plannedStartDate}
          dueDate={dueDate}
          actualStartDate={actualStartDate}
          actualEndDate={actualEndDate}
          customFieldsData={customFieldsData}
          setShowCreateSubTaskModal={setShowCreateSubTaskModal}
          setIssue={setIssue}
          onOpenAuth={onOpenAuth}
        />
      ) : (
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
          customDefs={customDefs}
          customFieldsData={customFieldsData}
          setCustomFieldsData={setCustomFieldsData}
          projects={projects}
          candidateParentIssues={candidateParentIssues}
          users={users}
          isPending={isPending}
          handleUpdateIssue={handleUpdateIssue}
          toggleEditing={toggleEditing}
        />
      )}
    </div>
  );
};