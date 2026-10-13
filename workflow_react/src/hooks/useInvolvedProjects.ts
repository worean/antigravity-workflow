import { useMemo } from 'react';
import { useProjects } from '@/api/projects';
import { useAuth } from '@/context/AuthContext';
import { isUserProjectMember } from '@/utils/issueFilters';

export const useInvolvedProjects = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: allProjects = [] } = useProjects({}, { enabled: isAuthenticated });

  const myProjectIds = useMemo(() => {
    if (!isAuthenticated || !user) return new Set<number>();
    const set = new Set<number>();
    allProjects.forEach((p) => {
      if (isUserProjectMember(p, user)) {
        set.add(p.id);
      }
    });
    return set;
  }, [allProjects, user, isAuthenticated]);

  return { myProjectIds, allProjects, user, isAuthenticated };
};
