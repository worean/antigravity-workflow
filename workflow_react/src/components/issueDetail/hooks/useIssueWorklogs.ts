﻿import { useState } from 'react';
import type { Issue, Worklog } from '@/types';
import { getWorklogs, createWorklog } from '@/services/api';
import { hoursToMinutes } from '@/utils/worklogUtils';

interface UseIssueWorklogsProps {
  issue: Issue | null;
  onIssueUpdated?: () => void;
}

export const useIssueWorklogs = ({ issue, onIssueUpdated }: UseIssueWorklogsProps) => {
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [showWorklogForm, setShowWorklogForm] = useState<boolean>(false);
  const [worklogHoursInput, setWorklogHoursInput] = useState<string>('1.0');
  const [worklogDescInput, setWorklogDescInput] = useState<string>('');
  const [isLoggingWork, setIsLoggingWork] = useState<boolean>(false);

  const handleCreateWorklog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue) return;

    const hours = parseFloat(worklogHoursInput);
    if (isNaN(hours) || hours <= 0) {
      alert('올바른 투입 시간을 입력하세요 (예: 1.5)');
      return;
    }

    setIsLoggingWork(true);
    try {
      await createWorklog({
        issueId: issue.id,
        timeSpent: hoursToMinutes(hours),
        description: worklogDescInput.trim() || undefined,
        startedAt: new Date().toISOString(),
      });
      setShowWorklogForm(false);
      setWorklogDescInput('');
      setWorklogHoursInput('1.0');
      const updatedLogs = await getWorklogs(issue.id);
      setWorklogs(updatedLogs);
      if (onIssueUpdated) onIssueUpdated();
    } catch (err: any) {
      console.error('Failed to log work:', err);
      alert(err.response?.data?.error || '작업 시간 기록에 실패했습니다.');
    } finally {
      setIsLoggingWork(false);
    }
  };

  return {
    worklogs,
    setWorklogs,
    showWorklogForm,
    setShowWorklogForm,
    worklogHoursInput,
    setWorklogHoursInput,
    worklogDescInput,
    setWorklogDescInput,
    isLoggingWork,
    handleCreateWorklog,
  };
};
