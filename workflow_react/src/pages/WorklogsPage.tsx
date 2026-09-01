import React, { useState, useEffect } from 'react';
import type { Worklog, Issue } from '@/types';
import { getWorklogs, getIssues, createWorklog } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { hoursToMinutes } from '@/utils/worklogUtils';
import {
  WorklogsHeaderToolbar,
  WorklogCreateForm,
  WorklogsList,
} from '@/components/worklogs';

interface WorklogsPageProps {
  onOpenAuth?: () => void;
}

export const WorklogsPage: React.FC<WorklogsPageProps> = ({ onOpenAuth }) => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [showForm, setShowForm] = useState<boolean>(false);
  const [issueId, setIssueId] = useState<number>(1);
  const [hoursInput, setHoursInput] = useState<string>('1.0');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wData, iData] = await Promise.all([getWorklogs(), getIssues()]);
      setWorklogs(wData);
      setIssues(iData);
      if (iData.length > 0) setIssueId(iData[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWorklog = async (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(hoursInput);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('유효한 작업 시간(시간 단위, 예: 1.4 또는 5.5)을 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const calculatedMinutes = hoursToMinutes(hoursNum);
      await createWorklog({
        issueId,
        timeSpent: calculatedMinutes,
        timeSpentHours: hoursNum,
        description,
      });
      setDescription('');
      setHoursInput('1.0');
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '작업 로그 등록 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 1. Header Toolbar */}
      <WorklogsHeaderToolbar
        worklogsCount={worklogs.length}
        isAuthenticated={isAuthenticated}
        showForm={showForm}
        setShowForm={setShowForm}
        onOpenAuth={onOpenAuth}
      />

      {/* 2. Create Form (Toggled) */}
      {showForm && (
        <WorklogCreateForm
          issues={issues}
          issueId={issueId}
          setIssueId={setIssueId}
          hoursInput={hoursInput}
          setHoursInput={setHoursInput}
          description={description}
          setDescription={setDescription}
          submitting={submitting}
          onSubmit={handleCreateWorklog}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* 3. Worklogs List */}
      <WorklogsList
        worklogs={worklogs}
        loading={loading}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
      />
    </div>
  );
};