import { useState, useEffect, useCallback, type RefObject } from 'react';
import type { Project, Sprint, Issue } from '@/types';
import { getProjects, getSprints, getIssues } from '@/services/api';

interface UseWBSProjectDataProps {
  initialProjectId?: number | null;
  tableBodyRef: RefObject<HTMLDivElement | null>;
  ganttBodyRef: RefObject<HTMLDivElement | null>;
  onFilterChange?: (projectId: number | null) => void;
}

export const useWBSProjectData = ({
  initialProjectId = null,
  tableBodyRef,
  ganttBodyRef,
  onFilterChange,
}: UseWBSProjectDataProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(initialProjectId);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | 'ALL'>('ALL');
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    if (initialProjectId !== undefined && initialProjectId !== null) {
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  const loading = false;
  const [issuesLoading, setIssuesLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState<boolean>(false);
  const [updatingIssueId, setUpdatingIssueId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Initial Load: Projects
  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        const pList = await getProjects();
        if (!isMounted) return;
        setProjects(pList);
        if (pList.length > 0) {
          const matched = initialProjectId ? pList.find((p) => p.id === initialProjectId) : null;
          const targetId = matched ? matched.id : pList[0].id;
          setSelectedProjectId(targetId);
          if (onFilterChange) onFilterChange(targetId);
        } else {
          setIsInitialLoading(false);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
        if (isMounted) setIsInitialLoading(false);
      }
    };
    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [onFilterChange]);

  // 2. Load Sprints & Issues when Project/Sprint changes
  const loadProjectData = useCallback(
    async (showLoading: boolean = false) => {
      if (!selectedProjectId) {
        setIsInitialLoading(false);
        setIssuesLoading(false);
        setIsBackgroundSyncing(false);
        return;
      }
      if (showLoading && issues.length === 0) setIssuesLoading(true);
      else setIsBackgroundSyncing(true);

      const prevTableScrollTop = tableBodyRef.current?.scrollTop;
      const prevGanttScrollTop = ganttBodyRef.current?.scrollTop;
      const prevGanttScrollLeft = ganttBodyRef.current?.scrollLeft;

      try {
        const [sData, iData] = await Promise.all([
          getSprints(selectedProjectId),
          getIssues({
            projectId: selectedProjectId,
            sprintId: selectedSprintId === 'ALL' ? undefined : selectedSprintId,
          }),
        ]);
        setSprints(sData);
        setIssues(iData);
      } catch (err) {
        console.error('Failed to load WBS data:', err);
      } finally {
        setIssuesLoading(false);
        setIsBackgroundSyncing(false);
        setIsInitialLoading(false);

        // 스크롤 위치 보존
        requestAnimationFrame(() => {
          if (tableBodyRef.current && prevTableScrollTop !== undefined) {
            tableBodyRef.current.scrollTop = prevTableScrollTop;
          }
          if (ganttBodyRef.current) {
            if (prevGanttScrollTop !== undefined) ganttBodyRef.current.scrollTop = prevGanttScrollTop;
            if (prevGanttScrollLeft !== undefined) ganttBodyRef.current.scrollLeft = prevGanttScrollLeft;
          }
        });
      }
    },
    [selectedProjectId, selectedSprintId, tableBodyRef, ganttBodyRef, issues.length]
  );

  useEffect(() => {
    loadProjectData(false);
  }, [loadProjectData]);

  return {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    sprints,
    selectedSprintId,
    setSelectedSprintId,
    issues,
    setIssues,
    loading,
    issuesLoading,
    isInitialLoading,
    isBackgroundSyncing,
    updatingIssueId,
    setUpdatingIssueId,
    errorMessage,
    setErrorMessage,
    loadProjectData,
  };
};